// Service worker - alterna o estado global do painel em todas as abas
const STATE_KEY = 'madara_panel_open';

async function broadcast(open) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (!tab.id) continue;
    try {
      await chrome.tabs.sendMessage(tab.id, {
        type: open ? 'MADARA_OPEN_PANEL' : 'MADARA_CLOSE_PANEL',
      });
    } catch (_) {
      // Aba sem content script (chrome://, web store, etc) - ignora
    }
  }
}

chrome.action.onClicked.addListener(async () => {
  const { [STATE_KEY]: open = false } = await chrome.storage.local.get(STATE_KEY);
  const next = !open;
  await chrome.storage.local.set({ [STATE_KEY]: next });
  await broadcast(next);
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === 'MADARA_REQUEST_CLOSE_ALL') {
    chrome.storage.local.set({ [STATE_KEY]: false });
    broadcast(false);
  }
});
