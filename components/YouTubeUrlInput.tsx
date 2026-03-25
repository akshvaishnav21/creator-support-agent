"use client";

import { useState, useEffect } from "react";
import type { YouTubeVideoData } from "@/lib/types";

interface Props {
  onFetched: (data: YouTubeVideoData) => void;
  autoFetchUrl?: string;
}

export default function YouTubeUrlInput({ onFetched, autoFetchUrl }: Props) {
  const [url, setUrl] = useState(autoFetchUrl ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetched, setFetched] = useState<{ title: string; channel: string } | null>(null);
  const [noKey, setNoKey] = useState(false);

  useEffect(() => {
    if (autoFetchUrl) {
      setUrl(autoFetchUrl);
      handleFetch(autoFetchUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetchUrl]);

  async function handleFetch(fetchUrl?: string) {
    const target = fetchUrl ?? url;
    if (!target.trim()) return;

    const ytApiKey = localStorage.getItem("creatoriq_yt_key");
    if (!ytApiKey) {
      setNoKey(true);
      return;
    }
    setNoKey(false);
    setLoading(true);
    setError(null);
    setFetched(null);

    try {
      const res = await fetch("/api/youtube/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ytApiKey, videoUrl: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      setFetched({ title: data.title, channel: data.channelTitle });
      onFetched(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch video data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-2">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        Auto-fill from YouTube
      </p>

      {noKey && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          YouTube API key not set.{" "}
          <a href="/settings" className="underline font-medium">
            Add it in Settings →
          </a>
        </p>
      )}

      <div className="flex gap-2">
        <input
          type="url"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setFetched(null); setError(null); setNoKey(false); }}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => handleFetch()}
          disabled={!url.trim() || loading}
          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 shrink-0"
        >
          {loading ? "Fetching…" : "Fetch"}
        </button>
      </div>

      {fetched && (
        <p className="mt-2 text-xs text-green-700 font-medium">
          ✓ {fetched.title} · {fetched.channel}
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
