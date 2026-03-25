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
      `${YT}/commentThreads?videoId=${videoId}&part=snippet&maxResults=100&order=relevance&key=${apiKey}`
    );
    const data = await res.json();
    if (!res.ok) return "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (plData.items ?? []).map((item: any) => item.snippet.title as string);
  } catch {
    return [];
  }
}

async function fetchTranscript(videoId: string): Promise<string> {
  const attempts = [
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&lang=en-US&fmt=json3`,
    `https://www.youtube.com/api/timedtext?v=${videoId}&fmt=json3`,
  ];
  for (const url of attempts) {
    try {
      const res = await fetch(url);
      if (!res.ok) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const json: any = await res.json();
      const text = (json.events ?? [])
        .filter((e: any) => e.segs)
        .map((e: any) => e.segs.map((s: any) => s.utf8 ?? "").join(""))
        .filter(Boolean)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (text) return text;
    } catch {
      // try next
    }
  }
  return "";
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
    const [comments, recentVideoTitles, transcript] = await Promise.all([
      fetchComments(videoId, ytApiKey),
      fetchRecentVideoTitles(meta.channelId, ytApiKey),
      fetchTranscript(videoId),
    ]);

    const result: YouTubeVideoData = {
      videoId,
      ...meta,
      transcript,
      comments,
      recentVideoTitles,
    };

    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fetch failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
