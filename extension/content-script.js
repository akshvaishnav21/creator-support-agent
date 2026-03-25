// CreatorIQ Content Script
// Runs on youtube.com/watch* pages in the MAIN world (access to page globals)
// Extracts captions and comments, exposes via window.__creatoriq

(function () {
  "use strict";

  function getVideoTitle() {
    const el =
      document.querySelector("h1.ytd-watch-metadata yt-formatted-string") ||
      document.querySelector("#above-the-fold #title h1") ||
      document.querySelector("h1.style-scope.ytd-watch-metadata");
    return el
      ? el.textContent.trim()
      : document.title.replace(" - YouTube", "").trim();
  }

  function getVideoId() {
    const m = window.location.href.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  /**
   * Get caption tracks from the player response.
   * Tries multiple sources since ytInitialPlayerResponse becomes stale on SPA nav.
   */
  function getCaptionTracks() {
    // Source 1: ytInitialPlayerResponse (available on initial load)
    const src1 =
      window.ytInitialPlayerResponse?.captions
        ?.playerCaptionsTracklistRenderer?.captionTracks;
    if (src1?.length) return src1;

    // Source 2: ytplayer.bootstrapPlayerResponse (updated on SPA nav)
    try {
      const src2 =
        window.ytplayer?.bootstrapPlayerResponse?.captions
          ?.playerCaptionsTracklistRenderer?.captionTracks;
      if (src2?.length) return src2;
    } catch {
      // ignore
    }

    // Source 3: Try to find it from the movie_player element
    try {
      const player = document.getElementById("movie_player");
      if (player?.getPlayerResponse) {
        const resp = player.getPlayerResponse();
        const src3 =
          resp?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
        if (src3?.length) return src3;
      }
    } catch {
      // ignore
    }

    return null;
  }

  /**
   * Fetch captions text from caption tracks.
   * This runs in the browser context so timedtext fetch works (unlike server-side).
   */
  async function fetchCaptions() {
    try {
      const tracks = getCaptionTracks();
      if (!tracks?.length) return "";

      // Prefer English, fall back to first available
      const track =
        tracks.find((t) => t.languageCode === "en") ||
        tracks.find((t) => t.languageCode?.startsWith("en")) ||
        tracks[0];

      if (!track?.baseUrl) return "";

      const res = await fetch(track.baseUrl + "&fmt=json3");
      if (!res.ok) return "";

      const json = await res.json();
      const text = (json.events || [])
        .filter((e) => e.segs)
        .map((e) => e.segs.map((s) => s.utf8 ?? "").join(""))
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) return text;
    } catch {
      // fall through
    }

    // Fallback: DOM extraction (only if transcript panel is open)
    const segments = document.querySelectorAll(
      "ytd-transcript-segment-renderer .segment-text, " +
        "ytd-transcript-segment-renderer yt-formatted-string"
    );
    if (segments.length) {
      return Array.from(segments)
        .map((el) => el.textContent.trim())
        .filter(Boolean)
        .join(" ");
    }

    return "";
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
   * Scroll to comments section to trigger YouTube's lazy loading,
   * then restore scroll position.
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
        await new Promise((r) => setTimeout(r, 2000));
        window.scrollTo({ top: saved, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 300));
      }
    }
  }

  /**
   * Main data collection.
   */
  async function collectData() {
    await ensureCommentsLoaded();
    const captions = await fetchCaptions();
    const comments = extractComments();
    const data = {
      videoTitle: getVideoTitle(),
      videoId: getVideoId(),
      captions: captions,
      captionsAvailable: !!getCaptionTracks()?.length,
      comments: comments,
      commentCount: comments ? comments.split("\n").filter(Boolean).length : 0,
      url: window.location.href,
      collectedAt: new Date().toISOString(),
    };
    window.__creatoriq = data;
    return data;
  }

  // Initialize — wait a bit for YouTube's SPA to settle
  setTimeout(collectData, 1500);

  // Re-collect on SPA navigation
  let lastUrl = window.location.href;
  new MutationObserver(() => {
    if (window.location.href !== lastUrl) {
      lastUrl = window.location.href;
      // Wait for new player response to load
      setTimeout(collectData, 3000);
    }
  }).observe(document, { subtree: true, childList: true });

  // Expose refresh for popup
  window.__creatoriqRefresh = collectData;
})();
