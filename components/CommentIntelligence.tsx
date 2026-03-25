"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ApiKeyGate from "@/components/ApiKeyGate";
import CopyButton from "@/components/CopyButton";
import { CommentsSkeleton } from "@/components/LoadingSkeleton";
import YouTubeUrlInput from "@/components/YouTubeUrlInput";
import { useApiCall, getGeminiKey } from "@/lib/hooks";
import type { CommentAnalysis, YouTubeVideoData } from "@/lib/types";

const STORAGE_KEY = "creatoriq_last_comments";

function buildReportText(a: CommentAnalysis): string {
  return [
    "# Comment Intelligence Report", "", "## Summary", a.summaryInsight, "",
    "## Sentiment", `- Positive: ${a.sentimentBreakdown.positive}%`, `- Neutral: ${a.sentimentBreakdown.neutral}%`, `- Negative: ${a.sentimentBreakdown.negative}%`, "",
    "## Topic Clusters", ...a.topicClusters.map((c) => `### ${c.topic} (${c.sentiment}, ~${c.commentCount})\n${c.keyQuotes.map((q) => `> ${q}`).join("\n")}`), "",
    "## Video Ideas", ...a.futureVideoIdeas.map((i) => `### ${i.title} (${i.demandScore}/10)\n${i.evidenceQuotes.map((q) => `> ${q}`).join("\n")}`), "",
    "## Complaints", ...a.topComplaints.map((c) => `- ${c.complaint} (${c.frequency})`), "",
    "## Appreciation", ...a.appreciationHighlights.map((h) => `- ${h}`),
  ].join("\n");
}

function SentimentDonut({ positive, neutral, negative }: { positive: number; neutral: number; negative: number }) {
  const total = positive + neutral + negative || 1;
  const pPct = (positive / total) * 100;
  const nPct = (neutral / total) * 100;
  return (
    <div className="flex items-center gap-4">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="currentColor" strokeWidth="3.5"
            className="text-gray-200 dark:text-gray-700" />
          <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5"
            className="text-emerald-500" strokeDasharray={`${pPct} ${100 - pPct}`} strokeDashoffset="0" strokeLinecap="round" />
          <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5"
            className="text-gray-400" strokeDasharray={`${nPct} ${100 - nPct}`} strokeDashoffset={`${-pPct}`} strokeLinecap="round" />
          <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3.5"
            className="text-red-400" strokeDasharray={`${100 - pPct - nPct} ${pPct + nPct}`} strokeDashoffset={`${-(pPct + nPct)}`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{positive}%</span>
        </div>
      </div>
      <div className="space-y-1.5 text-xs">
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /><span className="text-gray-600 dark:text-gray-300">Positive {positive}%</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-gray-400" /><span className="text-gray-600 dark:text-gray-300">Neutral {neutral}%</span></div>
        <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-400" /><span className="text-gray-600 dark:text-gray-300">Negative {negative}%</span></div>
      </div>
    </div>
  );
}

function Results({ analysis }: { analysis: CommentAnalysis }) {
  const sentBadge = (s: string) =>
    s === "positive" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
    : s === "negative" ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
    : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300";

  return (
    <div className="mt-8 animate-fade-in space-y-5">
      {/* Summary banner */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-800 dark:to-purple-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-violet-200 mb-2 font-semibold">Summary Insight</p>
            <p className="text-base leading-relaxed font-medium">{analysis.summaryInsight}</p>
          </div>
          <CopyButton text={buildReportText(analysis)} label="Copy full report" className="text-violet-200 hover:text-white shrink-0" />
        </div>
        <div className="relative flex flex-wrap gap-2 mt-4">
          {analysis.futureVideoIdeas.length > 0 && (
            <Link href={`/titles?concept=${encodeURIComponent(analysis.futureVideoIdeas[0].title)}`}
              className="text-xs bg-white/15 hover:bg-white/25 backdrop-blur rounded-lg px-3 py-1.5 transition-colors">
              Generate titles for top idea →
            </Link>
          )}
          <Link href="/sponsorship" className="text-xs bg-white/15 hover:bg-white/25 backdrop-blur rounded-lg px-3 py-1.5 transition-colors">
            Analyze sponsorship fit →
          </Link>
        </div>
      </div>

      {/* Row: Sentiment + Complaints + Appreciation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide">Sentiment</h2>
          <SentimentDonut positive={analysis.sentimentBreakdown.positive} neutral={analysis.sentimentBreakdown.neutral} negative={analysis.sentimentBreakdown.negative} />
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 border-l-4 border-l-red-400">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">Top Complaints</h2>
          <div className="space-y-3">
            {analysis.topComplaints.map((c, i) => (
              <div key={i}>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.complaint}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{c.frequency}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 border-l-4 border-l-emerald-400">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">What They Love</h2>
          <ul className="space-y-2">
            {analysis.appreciationHighlights.map((h, i) => (
              <li key={i} className="text-sm text-gray-700 dark:text-gray-300 flex gap-2">
                <span className="text-emerald-500 shrink-0 font-bold">+</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Row: Topics + Video Ideas (2-col) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide">Topic Clusters</h2>
          <div className="space-y-3">
            {analysis.topicClusters.map((cluster, i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{cluster.topic}</span>
                  <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${sentBadge(cluster.sentiment)}`}>{cluster.sentiment}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">~{cluster.commentCount}</span>
                </div>
                <div className="space-y-1">
                  {cluster.keyQuotes.map((q, j) => (
                    <p key={j} className="text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-gray-300 dark:border-gray-600 pl-2">&ldquo;{q}&rdquo;</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide">Video Ideas from Your Audience</h2>
          <div className="space-y-3">
            {analysis.futureVideoIdeas.map((idea, i) => (
              <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{idea.title}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <CopyButton text={idea.title} label="Copy" />
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 rounded-full px-2 py-0.5">{idea.demandScore}/10</span>
                  </div>
                </div>
                {idea.evidenceQuotes.map((q, j) => (
                  <p key={j} className="text-xs text-gray-500 dark:text-gray-400 italic border-l-2 border-purple-300 dark:border-purple-700 pl-2 mt-1">&ldquo;{q}&rdquo;</p>
                ))}
                <Link href={`/titles?concept=${encodeURIComponent(idea.title)}`}
                  className="inline-block mt-2 text-xs text-purple-600 dark:text-purple-400 hover:underline font-medium">
                  Generate titles →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CommentIntelligence() {
  const searchParams = useSearchParams();
  const [comments, setComments] = useState("");
  const [analysis, setAnalysis] = useState<CommentAnalysis | null>(null);
  const videoUrl = searchParams.get("videoUrl") ?? undefined;
  const { loading, error, call } = useApiCall<{ analysis: CommentAnalysis }>();

  useEffect(() => { try { const s = localStorage.getItem(STORAGE_KEY); if (s) setAnalysis(JSON.parse(s)); } catch { /* */ } }, []);
  useEffect(() => { const c = searchParams.get("comments"); if (c) setComments(decodeURIComponent(c)); }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!comments.trim() || loading) return; setAnalysis(null);
    const result = await call("/api/analyze-comments", { apiKey: getGeminiKey(), comments });
    if (result?.analysis) { setAnalysis(result.analysis); localStorage.setItem(STORAGE_KEY, JSON.stringify(result.analysis)); }
  }

  function clearResults() { setAnalysis(null); localStorage.removeItem(STORAGE_KEY); }

  return (
    <ApiKeyGate>
      <div className={`mx-auto px-4 sm:px-6 py-6 transition-all duration-300 ${analysis ? "max-w-7xl" : "max-w-3xl"}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comment Intelligence</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Uncover topic clusters, sentiment trends, and future video ideas from your audience comments.
          </p>
        </div>

        {!analysis && (
          <>
            <YouTubeUrlInput onFetched={(data: YouTubeVideoData) => { if (data.comments) setComments(data.comments); }} autoFetchUrl={videoUrl} />
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span className="text-xs text-gray-400">or paste manually</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Audience Comments <span className="text-gray-400 font-normal">(up to 200)</span>
                </label>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)}
                  placeholder={"Great video! The part about X was really helpful.\nCan you do a video on Y next?\n(paste comments here)"}
                  rows={8} maxLength={15000}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-y font-mono bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={!comments.trim() || loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-sm shadow-purple-600/25">
                {loading ? "Analyzing..." : "Analyze Comments"}
              </button>
            </form>
          </>
        )}

        {loading && <CommentsSkeleton />}

        {analysis && !loading && (
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setAnalysis(null)} className="text-sm text-purple-600 dark:text-purple-400 hover:underline font-medium">← New Analysis</button>
            <div className="flex-1" />
            <button onClick={clearResults} className="text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-4 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Clear Results</button>
          </div>
        )}

        {analysis && <Results analysis={analysis} />}
      </div>
    </ApiKeyGate>
  );
}
