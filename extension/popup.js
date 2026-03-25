// CreatorIQ Popup Script

// Update this URL when deployed to Vercel
const APP_URL = "http://localhost:3000";

// DOM refs
const apiKeyInput = document.getElementById("api-key-input");
const saveKeyBtn = document.getElementById("save-key-btn");
const keyStatus = document.getElementById("key-status");
const youtubeContent = document.getElementById("youtube-content");
const notYoutube = document.getElementById("not-youtube");
const videoTitleEl = document.getElementById("video-title");
const dataStatusEl = document.getElementById("data-status");
const openAppLink = document.getElementById("open-app-link");

openAppLink.href = APP_URL;
openAppLink.addEventListener("click", (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: APP_URL });
});

// --- API Key ---

chrome.storage.local.get(["geminiKey"], ({ geminiKey }) => {
  if (geminiKey) {
    apiKeyInput.value = geminiKey;
    keyStatus.textContent = "Key saved.";
    keyStatus.className = "status ok";
  }
});

saveKeyBtn.addEventListener("click", () => {
  const key = apiKeyInput.value.trim();
  if (!key) return;
  chrome.storage.local.set({ geminiKey: key }, () => {
    keyStatus.textContent = "Key saved!";
    keyStatus.className = "status ok";
    setTimeout(() => {
      keyStatus.textContent = "";
    }, 2000);
  });
});

// --- Tab detection ---

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;

  const isYouTubeVideo = tab.url?.includes("youtube.com/watch");

  if (!isYouTubeVideo) {
    notYoutube.style.display = "block";
    return;
  }

  youtubeContent.style.display = "block";
  videoTitleEl.textContent = tab.title?.replace(" - YouTube", "").trim() ?? "Unknown video";
  dataStatusEl.textContent = "Ready — click a tool to fetch and analyze.";
  dataStatusEl.className = "status ok";
  setupToolButtons(tab.url);
});

// --- Tool buttons ---

function setupToolButtons(videoUrl) {
  const encoded = encodeURIComponent(videoUrl);

  document.getElementById("btn-sponsorship").addEventListener("click", () => {
    chrome.tabs.create({ url: `${APP_URL}/sponsorship?videoUrl=${encoded}` });
  });

  document.getElementById("btn-comments").addEventListener("click", () => {
    chrome.tabs.create({ url: `${APP_URL}/comments?videoUrl=${encoded}` });
  });

  document.getElementById("btn-titles").addEventListener("click", () => {
    chrome.tabs.create({ url: `${APP_URL}/titles?videoUrl=${encoded}` });
  });
}
