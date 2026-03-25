"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ApiKeyGate from "@/components/ApiKeyGate";
import CopyButton from "@/components/CopyButton";
import { TitlesSkeleton } from "@/components/LoadingSkeleton";
import YouTubeUrlInput from "@/components/YouTubeUrlInput";
import { useApiCall, getGeminiKey } from "@/lib/hooks";
import type { TitleAnalysis, PsychPrinciple, YouTubeVideoData } from "@/lib/types";

const STORAGE_KEY = "creatoriq_last_titles";

const PRINCIPLE_LABELS: Record<PsychPrinciple, string> = {
  curiosity_gap: "Curiosity Gap", controversy: "Controversy", how_to: "How-To",
  listicle: "Listicle", urgency: "Urgency / FOMO", social_proof: "Social Proof", story: "Story",
};

const PRINCIPLE_COLORS: Record<PsychPrinciple, string> = {
  curiosity_gap: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  controversy: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  how_to: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  listicle: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  urgency: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  social_proof: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  story: "bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300",
};

function buildReportText(a: TitleAnalysis): string {
  const grouped = a.titles.reduce<Partial<Record<PsychPrinciple, typeof a.titles>>>((acc, t) => {
    if (!acc[t.psychPrinciple]) acc[t.psychPrinciple] = [];
    acc[t.psychPrinciple]!.push(t); return acc;
  }, {});
  const lines = [`# Title & Hook Variations`, ``, `**Top Pick:** ${a.topPick}`, `**Audience:** ${a.audienceAngle}`, ``];
  for (const [p, titles] of Object.entries(grouped)) {
    lines.push(`## ${PRINCIPLE_LABELS[p as PsychPrinciple]}`);
    for (const t of titles!) lines.push(`- **${t.title}** (${t.score}/10)`, `  Hook: ${t.hook}`, `  ${t.whyItWorks}`);
    lines.push("");
  }
  return lines.join("\n");
}

function Results({ analysis }: { analysis: TitleAnalysis }) {
  const grouped = analysis.titles.reduce<Partial<Record<PsychPrinciple, typeof analysis.titles>>>((acc, t) => {
    if (!acc[t.psychPrinciple]) acc[t.psychPrinciple] = [];
    acc[t.psychPrinciple]!.push(t); return acc;
  }, {});
  const principles = Object.keys(grouped) as PsychPrinciple[];
  const allTitles = analysis.titles.map((t) => t.title).join("\n");

  return (
    <div className="mt-8 animate-fade-in space-y-5">
      {/* Top Pick banner */}
      <div className="bg-gradient-to-r from-orange-500 to-rose-500 dark:from-orange-700 dark:to-rose-700 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-orange-200 mb-2 font-semibold">Top Pick</p>
            <p className="text-xl font-bold leading-tight">{analysis.topPick}</p>
            <p className="text-sm text-orange-100 mt-2">{analysis.audienceAngle}</p>
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <CopyButton text={analysis.topPick} label="Copy top pick" className="text-orange-200 hover:text-white" />
            <CopyButton text={buildReportText(analysis)} label="Copy all" className="text-orange-200 hover:text-white" />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="font-medium">{analysis.titles.length} titles</span>
          <span>across {principles.length} principles</span>
        </div>
        <button onClick={() => navigator.clipboard.writeText(allTitles)}
          className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium">
          Copy all titles as list
        </button>
      </div>

      {/* Titles in masonry-style 2-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {principles.map((principle) => (
          <div key={principle} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
            <div className="mb-4">
              <span className={`text-xs font-bold rounded-full px-3 py-1 ${PRINCIPLE_COLORS[principle]}`}>
                {PRINCIPLE_LABELS[principle]}
              </span>
            </div>
            <div className="space-y-3">
              {grouped[principle]!.map((t, i) => (
                <div key={i} className="border border-gray-100 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50 hover:border-orange-200 dark:hover:border-orange-700 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 leading-snug">{t.title}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      <CopyButton text={t.title} label="Copy" />
                      <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums">{t.score}/10</span>
                    </div>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 italic mb-1">{t.hook}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t.whyItWorks}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TitleFactory() {
  const searchParams = useSearchParams();
  const [concept, setConcept] = useState("");
  const [captions, setCaptions] = useState("");
  const [analysis, setAnalysis] = useState<TitleAnalysis | null>(null);
  const videoUrl = searchParams.get("videoUrl") ?? undefined;
  const { loading, error, call } = useApiCall<{ analysis: TitleAnalysis }>();

  useEffect(() => { try { const s = localStorage.getItem(STORAGE_KEY); if (s) setAnalysis(JSON.parse(s)); } catch { /* */ } }, []);
  useEffect(() => {
    const c = searchParams.get("concept"); const t = searchParams.get("captions");
    if (c) setConcept(decodeURIComponent(c)); if (t) setCaptions(decodeURIComponent(t));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!concept.trim() || loading) return; setAnalysis(null);
    const result = await call("/api/generate-titles", { apiKey: getGeminiKey(), concept, captions });
    if (result?.analysis) { setAnalysis(result.analysis); localStorage.setItem(STORAGE_KEY, JSON.stringify(result.analysis)); }
  }

  function clearResults() { setAnalysis(null); localStorage.removeItem(STORAGE_KEY); }

  return (
    <ApiKeyGate>
      <div className={`mx-auto px-4 sm:px-6 py-6 transition-all duration-300 ${analysis ? "max-w-7xl" : "max-w-3xl"}`}>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Hook & Title Factory</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Generate 15 high-converting title and hook variations grouped by psychological principle.
          </p>
        </div>

        {!analysis && (
          <>
            <YouTubeUrlInput onFetched={(data: YouTubeVideoData) => { if (data.title) setConcept(data.title); if (data.captions) setCaptions(data.captions); }} autoFetchUrl={videoUrl} />
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span className="text-xs text-gray-400">or fill in manually</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Video Concept <span className="text-red-500">*</span></label>
                <input type="text" value={concept} onChange={(e) => setConcept(e.target.value)}
                  placeholder="e.g. How I saved $10,000 in one year on a $50k salary" maxLength={500}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Captions or Outline <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea value={captions} onChange={(e) => setCaptions(e.target.value)}
                  placeholder="Paste your script outline or key points here..." rows={4} maxLength={15000}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={!concept.trim() || loading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-sm shadow-orange-500/25">
                {loading ? "Generating..." : "Generate 15 Titles"}
              </button>
            </form>
          </>
        )}

        {loading && <TitlesSkeleton />}

        {analysis && !loading && (
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => setAnalysis(null)} className="text-sm text-orange-600 dark:text-orange-400 hover:underline font-medium">← New Generation</button>
            <div className="flex-1" />
            <button onClick={clearResults} className="text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-4 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Clear Results</button>
          </div>
        )}

        {analysis && <Results analysis={analysis} />}
      </div>
    </ApiKeyGate>
  );
}
