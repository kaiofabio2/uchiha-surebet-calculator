// Madara Surebet - Content Script (standalone, sem iframe)
// Monta a calculadora React dentro de um Shadow DOM flutuante.
// Estado sincronizado entre abas via chrome.storage.local.

(function () {
  'use strict';

  const HOST_ID = 'madara-surebet-host';
  const TOOLTIP_ID = 'madara-capture-tooltip';
  const PANEL_STATE_KEY = 'madara_panel_state';

  let shadowRoot = null;
  let panelEl = null;
  let mountEl = null;
  let captureMode = false;
  let lastHighlighted = null;
  let tooltip = null;
  let capturedCount = 0;

  // -----------------------------
  // Criar host + shadow root
  // -----------------------------
  async function ensurePanel() {
    if (document.getElementById(HOST_ID)) return;

    const host = document.createElement('div');
    host.id = HOST_ID;
    host.style.cssText = 'all: initial; position: fixed; top: 0; left: 0; width: 0; height: 0; z-index: 2147483647;';
    document.documentElement.appendChild(host);
    shadowRoot = host.attachShadow({ mode: 'open' });

    // Injeta CSS do Tailwind (com :root -> :host para vars funcionarem no shadow)
    let cssText = '';
    try {
      const res = await fetch(chrome.runtime.getURL('calculator.css'));
      cssText = await res.text();
      cssText = cssText.replace(/:root\b/g, ':host');
    } catch (e) {
      console.error('[Madara] Falha ao carregar calculator.css', e);
    }

    // Estilos do painel flutuante (container do shadow)
    const panelStyles = `
      :host { display: block; color-scheme: dark; }
      .madara-panel {
        position: fixed;
        top: 20px; right: 20px;
        width: 880px; height: 720px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 40px);
        min-width: 400px; min-height: 400px;
        background: #0C0C0D;
        border: 2px solid #ea384c;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(234,56,76,.4), 0 0 0 1px rgba(234,56,76,.2);
        display: flex; flex-direction: column; overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #fff;
        resize: both;
        pointer-events: auto;
      }
      .madara-panel.minimized { height: 48px !important; min-height: 48px; resize: none; }
      .madara-panel.minimized .madara-body { display: none; }
      .madara-header {
        background: linear-gradient(90deg,#1a0508 0%,#2a0a10 100%);
        border-bottom: 1px solid #ea384c;
        padding: 8px 12px;
        display: flex; align-items: center; justify-content: space-between;
        cursor: move; user-select: none; flex-shrink: 0;
      }
      .madara-title {
        font-size: 14px; font-weight: 700; color: #ea384c;
        letter-spacing: 1px; text-shadow: 0 0 8px rgba(234,56,76,.5);
        display: flex; align-items: center; gap: 8px;
      }
      .madara-title::before {
        content: ""; display: inline-block; width: 12px; height: 12px;
        border-radius: 50%; background: #ea384c; box-shadow: 0 0 8px #ea384c;
        animation: mp 2s ease-in-out infinite;
      }
      @keyframes mp { 0%,100%{opacity:1} 50%{opacity:.4} }
      .madara-controls { display: flex; align-items: center; gap: 6px; }
      .m-btn {
        background: rgba(234,56,76,.1); border: 1px solid rgba(234,56,76,.4);
        color: #fff; padding: 4px 10px; border-radius: 6px;
        font-size: 12px; font-weight: 600; cursor: pointer;
        display: inline-flex; align-items: center; gap: 4px; line-height: 1;
      }
      .m-btn:hover { background: rgba(234,56,76,.25); border-color: #ea384c; }
      .m-btn.active { background: #ea384c; color: #fff; box-shadow: 0 0 12px rgba(234,56,76,.6); }
      .m-icon {
        width: 28px; height: 28px; padding: 0; background: transparent;
        border: 1px solid transparent; color: #ccc; border-radius: 4px;
        cursor: pointer; font-size: 16px; line-height: 1;
        display: inline-flex; align-items: center; justify-content: center;
      }
      .m-icon:hover { background: rgba(234,56,76,.2); color: #fff; }
      .madara-body { flex: 1; overflow: auto; background: #0C0C0D; }
    `;

    const styleEl = document.createElement('style');
    styleEl.textContent = panelStyles + '\n' + cssText;
    shadowRoot.appendChild(styleEl);

    panelEl = document.createElement('div');
    panelEl.className = 'madara-panel';
    panelEl.innerHTML = `
      <div class="madara-header" data-role="header">
        <div class="madara-title">MADARA SUREBET</div>
        <div class="madara-controls">
          <button class="m-btn" data-role="capture" title="Ativar captura automatica de odds">🎯 Capturar Odds</button>
          <button class="m-icon" data-role="min" title="Minimizar">−</button>
          <button class="m-icon" data-role="close" title="Fechar">×</button>
        </div>
      </div>
      <div class="madara-body" data-role="body"></div>
    `;
    shadowRoot.appendChild(panelEl);

    mountEl = panelEl.querySelector('[data-role="body"]');

    // Monta React
    if (window.MadaraSurebet && typeof window.MadaraSurebet.mount === 'function') {
      try {
        window.MadaraSurebet.mount(mountEl);
      } catch (e) {
        console.error('[Madara] Falha ao montar React', e);
      }
    } else {
      console.error('[Madara] Bundle da calculadora nao foi carregado.');
    }

    setupDrag();
    setupControls();
    restorePanelState();
  }

  function removePanel() {
    disableCaptureMode();
    if (window.MadaraSurebet?.unmount) {
      try { window.MadaraSurebet.unmount(); } catch {}
    }
    const host = document.getElementById(HOST_ID);
    if (host) host.remove();
    shadowRoot = null; panelEl = null; mountEl = null;
    chrome.storage.local.set({ [PANEL_STATE_KEY]: { open: false } });
  }

  async function togglePanel() {
    if (document.getElementById(HOST_ID)) {
      removePanel();
    } else {
      await ensurePanel();
      chrome.storage.local.set({
        [PANEL_STATE_KEY]: {
          open: true,
          left: panelEl.style.left,
          top: panelEl.style.top,
          width: panelEl.style.width,
          height: panelEl.style.height,
          minimized: panelEl.classList.contains('minimized'),
        },
      });
    }
  }

  function restorePanelState() {
    chrome.storage.local.get(PANEL_STATE_KEY, (res) => {
      const st = res?.[PANEL_STATE_KEY];
      if (!st || !panelEl) return;
      if (st.left) { panelEl.style.left = st.left; panelEl.style.right = 'auto'; }
      if (st.top) panelEl.style.top = st.top;
      if (st.width) panelEl.style.width = st.width;
      if (st.height) panelEl.style.height = st.height;
      if (st.minimized) {
        panelEl.classList.add('minimized');
        const b = panelEl.querySelector('[data-role="min"]'); if (b) b.textContent = '+';
      }
    });
  }

  function savePanelState(patch) {
    chrome.storage.local.get(PANEL_STATE_KEY, (res) => {
      const cur = res?.[PANEL_STATE_KEY] || {};
      chrome.storage.local.set({ [PANEL_STATE_KEY]: { ...cur, ...patch } });
    });
  }

  // -----------------------------
  // Drag
  // -----------------------------
  function setupDrag() {
    const header = panelEl.querySelector('[data-role="header"]');
    let dragging = false, sX=0, sY=0, sL=0, sT=0;
    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      dragging = true;
      const r = panelEl.getBoundingClientRect();
      sX = e.clientX; sY = e.clientY; sL = r.left; sT = r.top;
      panelEl.style.left = sL + 'px';
      panelEl.style.top = sT + 'px';
      panelEl.style.right = 'auto';
      e.preventDefault();
    });
    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const nl = Math.max(0, Math.min(window.innerWidth - 100, sL + e.clientX - sX));
      const nt = Math.max(0, Math.min(window.innerHeight - 50, sT + e.clientY - sY));
      panelEl.style.left = nl + 'px';
      panelEl.style.top = nt + 'px';
    });
    document.addEventListener('mouseup', () => {
      if (dragging) {
        dragging = false;
        savePanelState({ left: panelEl.style.left, top: panelEl.style.top });
      }
    });
  }

  function setupControls() {
    const captureBtn = panelEl.querySelector('[data-role="capture"]');
    const minBtn = panelEl.querySelector('[data-role="min"]');
    const closeBtn = panelEl.querySelector('[data-role="close"]');

    captureBtn.addEventListener('click', () => {
      captureMode ? disableCaptureMode() : enableCaptureMode();
    });
    minBtn.addEventListener('click', () => {
      panelEl.classList.toggle('minimized');
      const min = panelEl.classList.contains('minimized');
      minBtn.textContent = min ? '+' : '−';
      savePanelState({ minimized: min });
    });
    closeBtn.addEventListener('click', removePanel);

    // Salva resize
    const ro = new ResizeObserver(() => {
      if (!panelEl.classList.contains('minimized')) {
        savePanelState({ width: panelEl.style.width, height: panelEl.style.height });
      }
    });
    ro.observe(panelEl);
  }

  // -----------------------------
  // Modo captura
  // -----------------------------
  function enableCaptureMode() {
    captureMode = true; capturedCount = 0;
    document.body.classList.add('madara-capture-mode');
    const btn = panelEl?.querySelector('[data-role="capture"]');
    if (btn) { btn.classList.add('active'); btn.textContent = '⏹ Parar Captura'; }
    document.addEventListener('mouseover', onHover, true);
    document.addEventListener('mouseout', onHoverOut, true);
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onCapture, true);
    showToast('Modo Captura ATIVO - clique em qualquer odd na pagina');
  }

  function disableCaptureMode() {
    captureMode = false;
    document.body.classList.remove('madara-capture-mode');
    const btn = panelEl?.querySelector('[data-role="capture"]');
    if (btn) { btn.classList.remove('active'); btn.textContent = '🎯 Capturar Odds'; }
    document.removeEventListener('mouseover', onHover, true);
    document.removeEventListener('mouseout', onHoverOut, true);
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onCapture, true);
    clearHighlight(); removeTooltip();
  }

  function extractOdd(el) {
    if (!el || el.id === HOST_ID || (el.closest && el.closest('#' + HOST_ID))) return null;
    const text = (el.innerText || el.textContent || '').trim();
    if (!text || text.length > 12) return null;
    const m = text.match(/^(\d{1,3}[.,]\d{1,3})$/);
    if (!m) return null;
    const v = parseFloat(m[1].replace(',', '.'));
    if (isNaN(v) || v <= 1.01 || v > 1000) return null;
    return v;
  }

  function onHover(e) {
    if (!captureMode) return;
    const odd = extractOdd(e.target);
    if (odd !== null) {
      clearHighlight();
      e.target.classList.add('madara-capture-highlight');
      lastHighlighted = e.target;
      showTooltip(`Clique para capturar: ${odd.toFixed(2)}`);
    }
  }
  function onHoverOut(e) {
    if (!captureMode) return;
    if (lastHighlighted === e.target) { clearHighlight(); removeTooltip(); }
  }
  function onMouseMove(e) {
    if (!captureMode || !tooltip) return;
    tooltip.style.left = (e.clientX + 14) + 'px';
    tooltip.style.top = (e.clientY + 14) + 'px';
  }
  function onCapture(e) {
    if (!captureMode) return;
    const odd = extractOdd(e.target);
    if (odd === null) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    // Envia para a calculadora via chrome.storage (sincroniza entre abas)
    chrome.storage.local.set({ madara_pending_capture: { value: odd, ts: Date.now() } });
    capturedCount++;
    showToast(`Odd capturada: ${odd.toFixed(2)}`);
  }
  function clearHighlight() {
    if (lastHighlighted) { lastHighlighted.classList.remove('madara-capture-highlight'); lastHighlighted = null; }
  }
  function showTooltip(text) {
    if (!tooltip) { tooltip = document.createElement('div'); tooltip.id = TOOLTIP_ID; document.body.appendChild(tooltip); }
    tooltip.textContent = text;
  }
  function removeTooltip() { if (tooltip) { tooltip.remove(); tooltip = null; } }
  function showToast(msg) {
    const ex = document.getElementById('madara-toast'); if (ex) ex.remove();
    const t = document.createElement('div'); t.id = 'madara-toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2500);
  }

  // -----------------------------
  // Mensagens do background
  // -----------------------------
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'MADARA_TOGGLE_PANEL') togglePanel();
  });

  // Auto-abre se estava aberto na sessão anterior
  chrome.storage.local.get(PANEL_STATE_KEY, (res) => {
    if (res?.[PANEL_STATE_KEY]?.open) ensurePanel();
  });
})();
