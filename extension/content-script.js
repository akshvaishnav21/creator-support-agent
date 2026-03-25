// CreatorIQ Content Script
// Runs on youtube.com/watch* pages in the MAIN world (has access to page globals)
// Extracts transcript and comments, exposes via window.__creatoriq

(function () {
  "use strict";

  function getVideoTitle() {
    const el =
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
      document.querySelector("#above-the-fold #title h1") ||
      document.querySelector("h1.style-scope.ytd-watch-metadata");
    return el ? el.textContent.trim() : document.title.replace(" - YouTube", "").trim();
  }

  /**
   * Fetch transcript text via YouTube's player response data.
   * This is reliable and does not require the transcript panel to be open.
   * Falls back to DOM extraction if the player response is unavailable.
   */
  async function fetchTranscript() {
    try {
      const tracks =
        window.ytInitialPlayerResponse?.captions
          ?.playerCaptionsTracklistRenderer?.captionTracks;
      if (tracks?.length) {
        const track =
          tracks.find((t) => t.languageCode?.startsWith("en")) || tracks[0];
        if (track?.baseUrl) {
          const res = await fetch(track.baseUrl + "&fmt=json3");
          const json = await res.json();
          const text = (json.events || [])
            .filter((e) => e.segs)
            .map((e) => e.segs.map((s) => s.utf8 ?? "").join(""))
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          if (text) return text;
        }
      }
    } catch {
      // fall through to DOM fallback
    }

    // Fallback: DOM extraction (only works if transcript panel is already open)
    const segments = document.querySelectorAll(
      "ytd-transcript-segment-renderer .segment-text, " +
        "ytd-transcript-segment-renderer yt-formatted-string"
    );
    return Array.from(segments)
      .map((el) => el.textContent.trim())
      .filter(Boolean)
      .join(" ");
  }

  /**
   * Extract visible comments from the page (up to 100).
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
   * If no comments are in the DOM yet, scroll to the comments section briefly
   * to trigger YouTube's lazy loading, then restore the original scroll position.
   */
  async function ensureCommentsLoaded() {
    const hasComments =
      document.querySelectorAll(
        "ytd-comment-renderer #content-text, ytd-comment-view-model #content-text"
      ).length > 0;
    if (!hasComments) {
      const commentsEl = document.querySelector("ytd-comments");
      if (commentsEl) {
        const saved = window.scrollY;
        commentsEl.scrollIntoView({ behavior: "instant" });
        await new Promise((r) => setTimeout(r, 1500));
        window.scrollTo({ top: saved, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 200));
      }
    }
  }

  /**
   * Main data collection. Ensures comments are loaded, then collects everything.
   */
  async function collectData() {
    await ensureCommentsLoaded();
    const data = {
      videoTitle: getVideoTitle(),
      transcript: await fetchTranscript(),
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
      setTimeout(collectData, 2000);
    }
  }).observe(document, { subtree: true, childList: true });

  // Expose a refresh function for the popup to call
  window.__creatoriqRefresh = collectData;
})();
