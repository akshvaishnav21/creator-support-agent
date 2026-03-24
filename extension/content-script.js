// CreatorIQ Content Script
// Runs on youtube.com/watch* pages
// Extracts transcript and comments, exposes via window.__creatoriq

(function () {
  "use strict";

  /**
   * Get the current video title from the page.
   */
  function getVideoTitle() {
    const el =
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
      document.querySelector("#above-the-fold #title h1") ||
      document.querySelector("h1.style-scope.ytd-watch-metadata");
    return el ? el.textContent.trim() : document.title.replace(" - YouTube", "").trim();
  }

  /**
   * Extract transcript text from the transcript panel if it is open.
   * Returns empty string if the panel is not open or has no content.
   */
  function extractTranscript() {
    const segments = document.querySelectorAll(
      "ytd-transcript-segment-renderer .segment-text, " +
      "ytd-transcript-segment-renderer yt-formatted-string"
    );
    if (segments.length === 0) return "";

    return Array.from(segments)
      .map((el) => el.textContent.trim())
      .filter(Boolean)
      .join(" ");
  }

  /**
   * Extract visible comments from the page.
   * Returns up to 100 comments as a newline-joined string.
   */
  function extractComments() {
    const commentEls = document.querySelectorAll(
      "ytd-comment-renderer #content-text, " +
      "ytd-comment-view-model #content-text"
    );
    if (commentEls.length === 0) return "";

    return Array.from(commentEls)
      .slice(0, 100)
      .map((el) => el.textContent.trim())
      .filter(Boolean)
      .join("\n");
  }

  /**
   * Try to open the transcript panel by clicking the "More actions" button
   * then the "Show transcript" option. Non-destructive — fails silently.
   */
  async function tryOpenTranscript() {
    // Click "..." (more actions) button near the video
    const moreBtn =
      document.querySelector("ytd-menu-renderer.ytd-watch-metadata button[aria-label]") ||
      document.querySelector("#above-the-fold ytd-menu-renderer button");
    if (!moreBtn) return;

    moreBtn.click();
    await new Promise((r) => setTimeout(r, 500));

    // Look for "Show transcript" option in the popup menu
    const menuItems = document.querySelectorAll(
      "ytd-menu-service-item-renderer, tp-yt-paper-item"
    );
    for (const item of menuItems) {
      if (item.textContent.toLowerCase().includes("transcript")) {
        item.click();
        await new Promise((r) => setTimeout(r, 1000));
        break;
      }
    }
  }

  /**
   * Main data collection function. Tries to open transcript first,
   * then collects all available data.
   */
  async function collectData() {
    if (extractTranscript() === "") {
      await tryOpenTranscript();
    }

    const data = {
      videoTitle: getVideoTitle(),
      transcript: extractTranscript(),
      comments: extractComments(),
      url: window.location.href,
      collectedAt: new Date().toISOString(),
    };

    window.__creatoriq = data;
    return data;
  }

  // Initialize on page load
  collectData();

  // Re-collect if the URL changes (YouTube is a SPA)
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      setTimeout(collectData, 2000); // wait for new page content
    }
  }).observe(document, { subtree: true, childList: true });

  // Expose a refresh function for the popup to call
  window.__creatoriqRefresh = collectData;
})();
