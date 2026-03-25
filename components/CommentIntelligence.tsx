"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ApiKeyGate from "@/components/ApiKeyGate";
import YouTubeUrlInput from "@/components/YouTubeUrlInput";
import type { CommentAnalysis, YouTubeVideoData } from "@/lib/types";

function SentimentBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="w-16 text-gray-600">{label}</span>
      <div className="flex-1 bg-gray-200 rounded h-3">
        <div
          className={`${color} h-3 rounded`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="w-10 text-right font-medium">{value}%</span>
    </div>
  );
}

function Results({ analysis }: { analysis: CommentAnalysis }) {
  const sentimentColor = (s: string) =>
    s === "positive" ? "bg-green-100 text-green-800" :
    s === "negative" ? "bg-red-100 text-red-800" :
    "bg-yellow-100 text-yellow-800";

  return (
    <div className="space-y-6 mt-6">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Summary Insight</h2>
        <p className="text-blue-800 text-sm">{analysis.summaryInsight}</p>
      </div>

      {/* Sentiment Breakdown */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Sentiment Breakdown</h2>
        <div className="space-y-2">
          <SentimentBar label="Positive" value={analysis.sentimentBreakdown.positive} color="bg-green-400" />
          <SentimentBar label="Neutral" value={analysis.sentimentBreakdown.neutral} color="bg-gray-400" />
          <SentimentBar label="Negative" value={analysis.sentimentBreakdown.negative} color="bg-red-400" />
        </div>
      </div>

      {/* Topic Clusters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Topic Clusters</h2>
        <div className="space-y-3">
          {analysis.topicClusters.map((cluster, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{cluster.topic}</span>
                <span className={`text-xs rounded-full px-2 py-0.5 ${sentimentColor(cluster.sentiment)}`}>
                  {cluster.sentiment}
                </span>
                <span className="text-xs text-gray-500 ml-auto">~{cluster.commentCount} comments</span>
              </div>
              <div className="space-y-1">
                {cluster.keyQuotes.map((q, j) => (
                  <p key={j} className="text-xs text-gray-600 italic border-l-2 border-gray-200 pl-2">
                    &ldquo;{q}&rdquo;
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Future Video Ideas */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Future Video Ideas from Your Audience</h2>
        <div className="space-y-3">
          {analysis.futureVideoIdeas.map((idea, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-start justify-between gap-2 mb-1">
                <span className="font-medium text-sm">{idea.title}</span>
                <span className="text-xs bg-green-100 text-green-800 rounded-full px-2 py-0.5 shrink-0">
                  {idea.demandScore}/10
                </span>
              </div>
              {idea.evidenceQuotes.map((q, j) => (
                <p key={j} className="text-xs text-gray-600 italic border-l-2 border-blue-200 pl-2 mt-1">
                  &ldquo;{q}&rdquo;
                </p>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Complaints & Appreciation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-red-50 rounded-lg p-4">
          <h2 className="font-semibold text-red-900 mb-3">Top Complaints</h2>
          <div className="space-y-2">
            {analysis.topComplaints.map((c, i) => (
              <div key={i} className="text-sm">
                <p className="font-medium text-red-800">{c.complaint}</p>
                <p className="text-red-600 text-xs">{c.frequency}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <h2 className="font-semibold text-green-900 mb-3">What They Love</h2>
          <ul className="space-y-1.5">
            {analysis.appreciationHighlights.map((h, i) => (
              <li key={i} className="text-sm text-green-800 flex gap-2">
                <span>✓</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CommentIntelligence() {
  const searchParams = useSearchParams();
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<CommentAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  const videoUrl = searchParams.get("videoUrl") ?? undefined;

  useEffect(() => {
    const c = searchParams.get("comments");
    if (c) setComments(decodeURIComponent(c));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comments.trim() || loading) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    const apiKey = localStorage.getItem("creatoriq_gemini_key");

    try {
      const res = await fetch("/api/analyze-comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, comments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ApiKeyGate>
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-1">Comment Intelligence</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Paste your audience comments to uncover topic clusters, sentiment trends,
          and future video ideas hidden in what your viewers are saying.
        </p>

        <YouTubeUrlInput
          onFetched={(data: YouTubeVideoData) => { if (data.comments) setComments(data.comments); }}
          autoFetchUrl={videoUrl}
        />

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or paste manually</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audience Comments
              <span className="text-gray-400 font-normal ml-2">(paste up to 200 comments)</span>
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder={"Great video! The part about X was really helpful.\nCan you do a video on Y next?\nI've been struggling with this for years...\n(paste comments here, one per line or as a block)"}
              rows={10}
              maxLength={20000}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y font-mono"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!comments.trim() || loading}
            className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Comments"}
          </button>
        </form>

        {loading && (
          <div className="text-center text-gray-500 py-12">
            Analyzing your comments with Gemini...
          </div>
        )}

        {analysis && <Results analysis={analysis} />}
      </div>
    </ApiKeyGate>
  );
}
