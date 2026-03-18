/**
 * Background Service Worker
 * Handles side panel toggle and context menu for inline annotations.
 */

// Register context menu on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus?.create({
    id: 'audit-selection',
    title: 'Audit this text for biases',
    contexts: ['selection'],
  });
});

// Handle context menu click — send selected text to content script for inline audit
chrome.contextMenus?.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'audit-selection' && tab?.id) {
    chrome.tabs.sendMessage(tab.id, {
      action: 'auditSelection',
      text: info.selectionText,
    });
  }
});

// Allow popup to open side panel
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'openSidePanel') {
    chrome.sidePanel
      .open({ windowId: sender.tab?.windowId ?? undefined })
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // async response
  }
});
