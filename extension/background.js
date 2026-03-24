// CreatorIQ Background Service Worker
// Minimal — handles extension lifecycle events only.

chrome.runtime.onInstalled.addListener(({ reason }) => {
  if (reason === "install") {
    // Open the web app on first install
    chrome.tabs.create({ url: "http://localhost:3000/settings" });
  }
});
