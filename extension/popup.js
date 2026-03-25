// CreatorIQ Popup Script

// Update this URL when deployed to Vercel
const APP_URL = "https://creator-support-agent-peach.vercel.app";

// DOM refs
const apiKeyInput = document.getElementById("api-key-input");
const saveKeyBtn = document.getElementById("save-key-btn");
const keyStatus = document.getElementById("key-status");
const youtubeContent = document.getElementById("youtube-content");
const notYoutube = document.getElementById("not-youtube");
const videoTitleEl = document.getElementById("video-title");
const badgeCaptions = document.getElementById("badge-captions");
const badgeComments = document.getElementById("badge-comments");
const btnCopyCaptions = document.getElementById("btn-copy-captions");
const btnCopyComments = document.getElementById("btn-copy-comments");
const btnRefresh = document.getElementById("btn-refresh");
const openAppLink = document.getElementById("open-app-link");

// Cached data from content script
let collectedData = null;

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
    setTimeout(() => { keyStatus.textContent = ""; }, 2000);
  });
});

// --- Copy buttons ---

function flashCopied(btn, originalText) {
  btn.textContent = "Copied!";
  btn.classList.add("copied");
  setTimeout(() => {
    btn.textContent = originalText;
    btn.classList.remove("copied");
  }, 1500);
}

btnCopyCaptions.addEventListener("click", () => {
  if (collectedData?.captions) {
    navigator.clipboard.writeText(collectedData.captions);
    flashCopied(btnCopyCaptions, "Copy Captions");
  }
});

btnCopyComments.addEventListener("click", () => {
  if (collectedData?.comments) {
    navigator.clipboard.writeText(collectedData.comments);
    flashCopied(btnCopyComments, "Copy Comments");
  }
});

// --- Badge update ---

function updateBadges(data) {
  if (data.captions) {
    const wordCount = data.captions.split(/\s+/).length;
    badgeCaptions.className = "badge badge-ok";
    badgeCaptions.innerHTML = `<span class="badge-dot"></span> Captions: ${wordCount} words`;
    btnCopyCaptions.disabled = false;
  } else if (data.captionsAvailable) {
    badgeCaptions.className = "badge badge-warn";
    badgeCaptions.innerHTML = `<span class="badge-dot"></span> Captions: loading...`;
    btnCopyCaptions.disabled = true;
  } else {
    badgeCaptions.className = "badge badge-none";
    badgeCaptions.innerHTML = `<span class="badge-dot"></span> Captions: none`;
    btnCopyCaptions.disabled = true;
  }

  if (data.comments) {
    badgeComments.className = "badge badge-ok";
    badgeComments.innerHTML = `<span class="badge-dot"></span> Comments: ${data.commentCount || "found"}`;
    btnCopyComments.disabled = false;
  } else {
    badgeComments.className = "badge badge-none";
    badgeComments.innerHTML = `<span class="badge-dot"></span> Comments: none`;
    btnCopyComments.disabled = true;
  }
}

// --- Fetch data from content script ---

function fetchDataFromTab(tabId) {
  // Execute in the MAIN world to access window.__creatoriq
  chrome.scripting.executeScript(
    {
      target: { tabId },
      world: "MAIN",
      func: () => {
        // If refresh function exists, call it and return the result
        if (window.__creatoriqRefresh) {
          return window.__creatoriqRefresh();
        }
        return window.__creatoriq || null;
      },
    },
    (results) => {
      if (chrome.runtime.lastError) {
        console.log("Script error:", chrome.runtime.lastError.message);
        return;
      }
      const data = results?.[0]?.result;
      if (data) {
        collectedData = data;
        if (data.videoTitle) {
          videoTitleEl.textContent = data.videoTitle;
        }
        updateBadges(data);
      }
    }
  );
}

// --- Tab detection ---

chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
  if (!tab) return;

  const isYouTubeVideo = tab.url?.includes("youtube.com/watch");

  if (!isYouTubeVideo) {
    notYoutube.style.display = "block";
    return;
  }

  youtubeContent.style.display = "block";
  videoTitleEl.textContent =
    tab.title?.replace(" - YouTube", "").trim() ?? "Unknown video";

  // Fetch data from the content script
  fetchDataFromTab(tab.id);

  // Setup refresh button
  btnRefresh.addEventListener("click", () => {
    btnRefresh.textContent = "Refreshing...";
    fetchDataFromTab(tab.id);
    // The fetchDataFromTab is async via executeScript callback
    setTimeout(() => {
      btnRefresh.textContent = "Refresh data";
    }, 2000);
  });

  // Setup tool buttons
  setupToolButtons(tab.url, tab.id);
});

// --- Tool buttons ---

function setupToolButtons(videoUrl, tabId) {
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
