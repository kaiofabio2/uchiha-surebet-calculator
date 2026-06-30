// Madara Surebet - Content Script
// Injeta o painel flutuante e gerencia a captura automatica de odds

(function () {
  'use strict';

  const PANEL_ID = 'madara-surebet-panel';
  const IFRAME_ID = 'madara-surebet-iframe';
  const TOOLTIP_ID = 'madara-capture-tooltip';
  const APP_URL = 'https://madarasurebet.com.br/';

  let captureMode = false;
  let lastHighlighted = null;
  let tooltip = null;
  let capturedCount = 0;

  // -----------------------------
  // Cria / remove o painel
  // -----------------------------
  function createPanel() {
    if (document.getElementById(PANEL_ID)) return;

    const panel = document.createElement('div');
    panel.id = PANEL_ID;
    panel.innerHTML = `
      <div id="madara-surebet-header">
        <div id="madara-surebet-title">MADARA SUREBET</div>
        <div id="madara-surebet-controls">
          <button class="madara-btn" id="madara-capture-btn" title="Ativar captura automatica de odds">
            🎯 Capturar Odds
          </button>
          <button class="madara-icon-btn" id="madara-minimize-btn" title="Minimizar">−</button>
          <button class="madara-icon-btn" id="madara-close-btn" title="Fechar">×</button>
        </div>
      </div>
      <iframe id="${IFRAME_ID}" src="${APP_URL}" allow="clipboard-write"></iframe>
    `;
    document.body.appendChild(panel);

    setupDrag(panel);
    setupControls(panel);
  }

  function removePanel() {
    const panel = document.getElementById(PANEL_ID);
    if (panel) panel.remove();
    disableCaptureMode();
  }

  function togglePanel() {
    const existing = document.getElementById(PANEL_ID);
    if (existing) {
      removePanel();
    } else {
      createPanel();
    }
  }

  // -----------------------------
  // Arrastar pelo header
  // -----------------------------
  function setupDrag(panel) {
    const header = panel.querySelector('#madara-surebet-header');
    let dragging = false;
    let startX = 0, startY = 0, startLeft = 0, startTop = 0;

    header.addEventListener('mousedown', (e) => {
      // Nao iniciar drag em botoes
      if (e.target.closest('button')) return;
      dragging = true;
      const rect = panel.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startLeft = rect.left;
      startTop = rect.top;
      // Trocar de "right: 20px" para "left: X" para permitir arrastar
      panel.style.left = startLeft + 'px';
      panel.style.top = startTop + 'px';
      panel.style.right = 'auto';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newLeft = Math.max(0, Math.min(window.innerWidth - 100, startLeft + dx));
      const newTop = Math.max(0, Math.min(window.innerHeight - 50, startTop + dy));
      panel.style.left = newLeft + 'px';
      panel.style.top = newTop + 'px';
    });

    document.addEventListener('mouseup', () => {
      dragging = false;
    });
  }

  // -----------------------------
  // Botoes do header
  // -----------------------------
  function setupControls(panel) {
    const captureBtn = panel.querySelector('#madara-capture-btn');
    const minBtn = panel.querySelector('#madara-minimize-btn');
    const closeBtn = panel.querySelector('#madara-close-btn');

    captureBtn.addEventListener('click', () => {
      if (captureMode) {
        disableCaptureMode();
      } else {
        enableCaptureMode();
      }
    });

    minBtn.addEventListener('click', () => {
      panel.classList.toggle('madara-minimized');
      minBtn.textContent = panel.classList.contains('madara-minimized') ? '+' : '−';
    });

    closeBtn.addEventListener('click', () => {
      try {
        chrome.storage.local.set({ madara_panel_open: false });
        chrome.runtime.sendMessage({ type: 'MADARA_REQUEST_CLOSE_ALL' });
      } catch (_) {}
      removePanel();
    });
  }

  // -----------------------------
  // Modo Captura
  // -----------------------------
  function enableCaptureMode() {
    captureMode = true;
    capturedCount = 0;
    document.body.classList.add('madara-capture-mode');
    const btn = document.getElementById('madara-capture-btn');
    if (btn) {
      btn.classList.add('madara-active');
      btn.textContent = '⏹ Parar Captura';
    }
    document.addEventListener('mouseover', onHover, true);
    document.addEventListener('mouseout', onHoverOut, true);
    document.addEventListener('mousemove', onMouseMove, true);
    document.addEventListener('click', onCapture, true);
    showToast('Modo Captura ATIVO - clique em qualquer odd na pagina');
  }

  function disableCaptureMode() {
    captureMode = false;
    document.body.classList.remove('madara-capture-mode');
    const btn = document.getElementById('madara-capture-btn');
    if (btn) {
      btn.classList.remove('madara-active');
      btn.textContent = '🎯 Capturar Odds';
    }
    document.removeEventListener('mouseover', onHover, true);
    document.removeEventListener('mouseout', onHoverOut, true);
    document.removeEventListener('mousemove', onMouseMove, true);
    document.removeEventListener('click', onCapture, true);
    clearHighlight();
    removeTooltip();
  }

  // Detecta se um elemento contem texto de odd (1.50, 2,30 etc)
  function extractOdd(el) {
    if (!el || el.id === PANEL_ID || el.closest && el.closest('#' + PANEL_ID)) return null;
    // Pega texto direto, sem incluir filhos profundos
    const text = (el.innerText || el.textContent || '').trim();
    if (!text || text.length > 12) return null;
    // Aceita 1.50, 1,50, 10.00, 1.5, etc.
    const match = text.match(/^(\d{1,3}[.,]\d{1,3})$/);
    if (!match) return null;
    const value = parseFloat(match[1].replace(',', '.'));
    if (isNaN(value) || value <= 1.01 || value > 1000) return null;
    return value;
  }

  function onHover(e) {
    if (!captureMode) return;
    const el = e.target;
    const odd = extractOdd(el);
    if (odd !== null) {
      clearHighlight();
      el.classList.add('madara-capture-highlight');
      lastHighlighted = el;
      showTooltip(`Clique para capturar: ${odd.toFixed(2)} (Odd ${String.fromCharCode(65 + capturedCount)})`);
    }
  }

  function onHoverOut(e) {
    if (!captureMode) return;
    if (lastHighlighted === e.target) {
      clearHighlight();
      removeTooltip();
    }
  }

  function onMouseMove(e) {
    if (!captureMode || !tooltip) return;
    tooltip.style.left = (e.clientX + 14) + 'px';
    tooltip.style.top = (e.clientY + 14) + 'px';
  }

  function onCapture(e) {
    if (!captureMode) return;
    const el = e.target;
    const odd = extractOdd(el);
    if (odd === null) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const iframe = document.getElementById(IFRAME_ID);
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ type: 'MADARA_ODD_CAPTURED', value: odd }, '*');
      capturedCount++;
      showToast(`Odd ${String.fromCharCode(65 + capturedCount - 1)} capturada: ${odd.toFixed(2)}`);
    }
  }

  function clearHighlight() {
    if (lastHighlighted) {
      lastHighlighted.classList.remove('madara-capture-highlight');
      lastHighlighted = null;
    }
  }

  function showTooltip(text) {
    if (!tooltip) {
      tooltip = document.createElement('div');
      tooltip.id = TOOLTIP_ID;
      document.body.appendChild(tooltip);
    }
    tooltip.textContent = text;
  }

  function removeTooltip() {
    if (tooltip) {
      tooltip.remove();
      tooltip = null;
    }
  }

  // -----------------------------
  // Toast simples
  // -----------------------------
  function showToast(message) {
    const existing = document.getElementById('madara-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'madara-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2500);
  }

  // -----------------------------
  // Mensagens do background / iframe
  // -----------------------------
  const STATE_KEY = 'madara_panel_open';

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg) return;
    if (msg.type === 'MADARA_TOGGLE_PANEL') togglePanel();
    if (msg.type === 'MADARA_OPEN_PANEL') createPanel();
    if (msg.type === 'MADARA_CLOSE_PANEL') removePanel();
  });

  // Ao carregar qualquer pagina/aba, verifica o estado global e abre o painel
  try {
    chrome.storage.local.get(STATE_KEY, (res) => {
      if (res && res[STATE_KEY]) createPanel();
    });
  } catch (_) {}

  // Reset do contador quando a calculadora avisa que carregou
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'MADARA_CALC_READY') {
      capturedCount = 0;
    }
  });
})();
