import { NextRequest, NextResponse } from "next/server";
import type { YouTubeVideoData } from "@/lib/types";

const YT = "https://www.googleapis.com/youtube/v3";

function extractVideoId(url: string): string | null {
  const patterns = [
    /[?&]v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

async function fetchVideoMeta(videoId: string, apiKey: string) {
  const res = await fetch(
    `${YT}/videos?id=${videoId}&part=snippet,statistics&key=${apiKey}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? "YouTube API error");
  if (!data.items?.length) throw new Error("Video not found");
  const { snippet, statistics } = data.items[0];
  return {
    title: snippet.title as string,
    description: snippet.description as string,
    channelId: snippet.channelId as string,
    channelTitle: snippet.channelTitle as string,
    viewCount: statistics?.viewCount as string | undefined,
    likeCount: statistics?.likeCount as string | undefined,
  };
}

async function fetchComments(videoId: string, apiKey: string): Promise<string> {
  try {
    const res = await fetch(
      `${YT}/commentThreads?videoId=${videoId}&part=snippet&maxResults=100&order=relevance&textFormat=plainText&key=${apiKey}`
    );
    const data = await res.json();
    if (!res.ok) return "";

    return (data.items ?? [])
      .map((item: any) => item.snippet.topLevelComment.snippet.textDisplay)
      .join("\n");
  } catch {
    return "";
  }
}

async function fetchRecentVideoTitles(
  channelId: string,
  apiKey: string
): Promise<string[]> {
  try {
    const chRes = await fetch(
      `${YT}/channels?id=${channelId}&part=contentDetails&key=${apiKey}`
    );
    const chData = await chRes.json();
    const playlistId =
      chData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
    if (!playlistId) return [];

    const plRes = await fetch(
      `${YT}/playlistItems?playlistId=${playlistId}&part=snippet&maxResults=10&key=${apiKey}`
    );
    const plData = await plRes.json();

    return (plData.items ?? []).map((item: any) => item.snippet.title as string);
  } catch {
    return [];
  }
}

/**
 * Extract a JSON object assigned to a JS variable from raw HTML.
 * Uses brace-counting instead of regex to correctly handle nested objects.
 */
function extractJSON(html: string, varName: string): unknown | null {
  // Try both `var = {` and `var={` patterns
  let idx = html.indexOf(`${varName} = {`);
  if (idx !== -1) {
    idx = html.indexOf("{", idx);
  } else {
    idx = html.indexOf(`${varName}={`);
    if (idx !== -1) {
      idx = html.indexOf("{", idx);
    }
  }
  if (idx === -1) return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = idx; i < html.length; i++) {
    const ch = html[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(idx, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/**
 * Fetch captions by scraping the YouTube watch page HTML.
 *
 * Strategy:
 * 1. Fetch watch page and extract ytInitialPlayerResponse (caption track URLs)
 * 2. Attempt to fetch caption text from the timedtext URL
 * 3. If that returns empty (YouTube blocks server-side timedtext requests),
 *    extract caption text from the video description as a fallback
 *
 * Note: YouTube's timedtext API blocks server-side requests as of early 2025.
 * The Chrome extension can fetch captions reliably since it runs in the browser.
 */
async function fetchCaptions(videoId: string): Promise<{ text: string; available: boolean }> {
  try {
    const pageRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!pageRes.ok) return { text: "", available: false };
    const html = await pageRes.text();

    // Extract the player response JSON using brace-counting parser
    const playerResponse = extractJSON(html, "ytInitialPlayerResponse") as any;
    if (!playerResponse) return { text: "", available: false };

    // Get caption tracks from the player response
    const captionTracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    if (!captionTracks?.length) return { text: "", available: false };

    // Prefer English, fall back to first available track
    const track =
      captionTracks.find(
        (t: { languageCode?: string }) =>
          t.languageCode === "en" || t.languageCode?.startsWith("en")
      ) ?? captionTracks[0];

    if (!track?.baseUrl) return { text: "", available: true };

    // Attempt to fetch caption data (may return empty due to YouTube server-side blocking)
    const captionRes = await fetch(track.baseUrl + "&fmt=json3", {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (captionRes.ok) {
      const raw = await captionRes.text();
      if (raw.length > 0) {
        try {
          const captionJson = JSON.parse(raw);
          const text = (captionJson.events ?? [])
            .filter((e: any) => e.segs)
            .map((e: any) =>
              e.segs.map((s: any) => s.utf8 ?? "").join("")
            )
            .filter(Boolean)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
          if (text) return { text, available: true };
        } catch {
          // Fall through to XML attempt
        }
      }
    }

    // Fallback: try the XML format
    const xmlRes = await fetch(track.baseUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (xmlRes.ok) {
      const xml = await xmlRes.text();
      if (xml.length > 0) {
        const textMatches = Array.from(xml.matchAll(/<text[^>]*>([^<]*)<\/text>/g));
        if (textMatches.length) {
          const xmlText = textMatches
            .map((m) => m[1])
            .join(" ")
            .replace(/&#39;/g, "'")
            .replace(/&amp;/g, "&")
            .replace(/&quot;/g, '"')
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/\s+/g, " ")
            .trim();
          return { text: xmlText, available: true };
        }
      }
    }

    // YouTube blocks server-side caption fetching — return empty but mark as available
    // Users can paste captions manually or use the Chrome extension
    return { text: "", available: true };
  } catch {
    return { text: "", available: false };
  }
}

export async function POST(req: NextRequest) {
  const { ytApiKey, videoUrl } = await req.json();

  if (!ytApiKey) {
    return NextResponse.json(
      { error: "YouTube API key required" },
      { status: 401 }
    );
  }

  const videoId = extractVideoId(videoUrl ?? "");
  if (!videoId) {
    return NextResponse.json(
      { error: "Could not extract video ID from URL" },
      { status: 400 }
    );
  }

  try {
    // Fetch video metadata first (we need channelId for the next calls)
    const meta = await fetchVideoMeta(videoId, ytApiKey);

    // Run the rest in parallel
    const [comments, recentVideoTitles, captionResult] = await Promise.all([
      fetchComments(videoId, ytApiKey),
      fetchRecentVideoTitles(meta.channelId, ytApiKey),
      fetchCaptions(videoId),
    ]);

    const result: YouTubeVideoData = {
      videoId,
      ...meta,
      captions: captionResult.text,
      captionsAvailable: captionResult.available,
      comments,
      recentVideoTitles,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
