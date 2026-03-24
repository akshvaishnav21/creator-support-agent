// CreatorIQ Popup Script

// Update this URL when deployed to Vercel
const APP_URL = "http://localhost:3000";

const MAX_PARAM_LENGTH = 8000; // URL param limit (chars)

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

  const isYouTubeVideo =
    tab.url && tab.url.includes("youtube.com/watch");

  if (!isYouTubeVideo) {
    notYoutube.style.display = "block";
    return;
  }

  youtubeContent.style.display = "block";
  loadVideoData(tab.id);
});

// --- Load video data from content script ---

function loadVideoData(tabId) {
  chrome.scripting
    .executeScript({
      target: { tabId },
      func: () => window.__creatoriq || null,
    })
    .then((results) => {
      const data = results?.[0]?.result;
      if (!data) {
        dataStatusEl.textContent = "Refresh the page to import data.";
        dataStatusEl.className = "status warn";
        videoTitleEl.textContent = "Unknown video";
        return;
      }

      videoTitleEl.textContent = data.videoTitle || "Unknown video";
      videoTitleEl.title = data.videoTitle || "";

      const parts = [];
      if (data.transcript) parts.push("transcript");
      if (data.comments) parts.push("comments");

      if (parts.length > 0) {
        dataStatusEl.textContent = `Ready to import: ${parts.join(" + ")}`;
        dataStatusEl.className = "status ok";
      } else {
        dataStatusEl.textContent =
          "No transcript/comments found yet. Scroll down to load comments.";
        dataStatusEl.className = "status warn";
      }

      setupToolButtons(data);
    })
    .catch(() => {
      dataStatusEl.textContent = "Could not read page data. Refresh and try again.";
      dataStatusEl.className = "status warn";
    });
}

// --- Tool buttons ---

function truncate(str, max) {
  if (!str) return "";
  return str.length > max ? str.slice(0, max) : str;
}

function buildUrl(path, data, fields) {
  const params = new URLSearchParams();
  for (const field of fields) {
    if (data[field]) {
      params.set(field, truncate(data[field], MAX_PARAM_LENGTH / fields.length));
    }
  }
  const paramStr = params.toString();
  return APP_URL + path + (paramStr ? "?" + paramStr : "");
}

function setupToolButtons(data) {
  document.getElementById("btn-sponsorship").addEventListener("click", () => {
    const url = buildUrl("/sponsorship", data, ["transcript", "comments"]);
    chrome.tabs.create({ url });
  });

  document.getElementById("btn-comments").addEventListener("click", () => {
    const url = buildUrl("/comments", data, ["comments"]);
    chrome.tabs.create({ url });
  });

  document.getElementById("btn-titles").addEventListener("click", () => {
    // For titles, use the video title as the concept seed
    const params = new URLSearchParams();
    if (data.videoTitle) params.set("concept", data.videoTitle);
    if (data.transcript) params.set("transcript", truncate(data.transcript, MAX_PARAM_LENGTH));
    const url = APP_URL + "/titles?" + params.toString();
    chrome.tabs.create({ url });
  });
}
