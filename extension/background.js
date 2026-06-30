// Service worker - alterna o painel flutuante quando o icone e clicado
chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'MADARA_TOGGLE_PANEL' });
  } catch (err) {
    // Content script ainda nao foi injetado (paginas chrome://, web store etc)
    console.warn('[Madara Surebet] Nao foi possivel abrir o painel nesta pagina:', err?.message);
  }
});
