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
  const [captionsWarning, setCaptionsWarning] = useState(false);
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
    setCaptionsWarning(false);

    try {
      const res = await fetch("/api/youtube/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ytApiKey, videoUrl: target }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Fetch failed");
      setFetched({ title: data.title, channel: data.channelTitle });

      // Show warning if captions exist but couldn't be fetched server-side
      if (data.captionsAvailable && !data.captions) {
        setCaptionsWarning(true);
      }

      onFetched(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch video data");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-2">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
        Auto-fill from YouTube
      </p>

      {noKey && (
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2 mb-3">
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
          onChange={(e) => { setUrl(e.target.value); setFetched(null); setError(null); setNoKey(false); setCaptionsWarning(false); }}
          onKeyDown={(e) => e.key === "Enter" && handleFetch()}
          placeholder="https://youtube.com/watch?v=..."
          className="flex-1 border dark:border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
          disabled={loading}
        />
        <button
          type="button"
          onClick={() => handleFetch()}
          disabled={!url.trim() || loading}
          className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50 shrink-0"
        >
          {loading ? "Fetching..." : "Fetch"}
        </button>
      </div>

      {fetched && (
        <p className="mt-2 text-xs text-green-700 dark:text-green-400 font-medium">
          ✓ {fetched.title} · {fetched.channel}
        </p>
      )}
      {captionsWarning && (
        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg px-3 py-2">
          Captions are available for this video but YouTube blocks server-side access.
          You can paste them manually or use the Chrome extension to import them.
        </p>
      )}
      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
