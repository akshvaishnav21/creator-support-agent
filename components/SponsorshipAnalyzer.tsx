"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ApiKeyGate from "@/components/ApiKeyGate";
import type { SponsorshipAnalysis } from "@/lib/types";

const SCORE_COLORS = [
  { min: 8, bar: "bg-green-500", badge: "bg-green-100 text-green-800" },
  { min: 6, bar: "bg-blue-500",  badge: "bg-blue-100 text-blue-800"  },
  { min: 4, bar: "bg-yellow-400",badge: "bg-yellow-100 text-yellow-800"},
  { min: 0, bar: "bg-gray-400",  badge: "bg-gray-100 text-gray-700"  },
];

function scoreColor(score: number) {
  return SCORE_COLORS.find((c) => score >= c.min)!;
}

function ScoreBar({ score }: { score: number }) {
  const { bar } = scoreColor(score);
  return (
    <div className="bg-gray-200 rounded-full h-2 w-full">
      <div className={`${bar} h-2 rounded-full transition-all`} style={{ width: `${score * 10}%` }} />
    </div>
  );
}

function Pill({ label, color = "blue" }: { label: string; color?: "blue" | "gray" }) {
  const cls = color === "blue" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-700";
  return <span className={`text-xs rounded-full px-2 py-0.5 ${cls}`}>{label}</span>;
}

function StatCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-100 p-3">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-semibold text-gray-900 capitalize">{value}</p>
    </div>
  );
}

function Results({ analysis }: { analysis: SponsorshipAnalysis }) {
  return (
    <div className="space-y-6 mt-8">
      {/* Executive Summary — full-width banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-5 text-white">
        <p className="text-xs uppercase tracking-widest text-blue-200 mb-1 font-medium">Executive Summary</p>
        <p className="text-sm leading-relaxed">{analysis.summaryInsight}</p>
      </div>

      {/* Audience Profile + Content Tone — side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Audience Profile */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-base">👥</span> Audience Profile
          </h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCell label="Age Range" value={analysis.audienceProfile.ageRange} />
            <StatCell label="Gender" value={analysis.audienceProfile.likelyGender} />
            <StatCell label="Income Signal" value={analysis.audienceProfile.incomeSignal} />
            <StatCell label="Engagement" value={analysis.audienceProfile.engagementStyle} />
          </div>
          <p className="text-xs text-gray-500 mb-2">Primary Interests</p>
          <div className="flex flex-wrap gap-1.5">
            {analysis.audienceProfile.primaryInterests.map((i) => (
              <Pill key={i} label={i} color="blue" />
            ))}
          </div>
        </div>

        {/* Content Tone */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-base">🎙️</span> Content Tone
          </h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCell label="Primary Tone" value={analysis.contentTone.primaryTone} />
            <StatCell label="Authenticity" value={`${analysis.contentTone.authenticityScore}/10`} />
          </div>
          <p className="text-xs text-gray-500 mb-2">Style Keywords</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {analysis.contentTone.styleKeywords.map((k) => (
              <Pill key={k} label={k} color="gray" />
            ))}
          </div>
          {analysis.contentTone.brandSafetyNotes !== "None identified" && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-xs text-yellow-800">
              ⚠️ Brand safety: {analysis.contentTone.brandSafetyNotes}
            </div>
          )}
        </div>
      </div>

      {/* Top Sponsorship Categories — 2×2 grid of cards */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-base">🏷️</span> Top Sponsorship Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {analysis.topSponsorshipCategories.map((cat, i) => {
            const { bar, badge } = scoreColor(cat.fitScore);
            return (
              <div key={i} className="border border-gray-100 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-sm text-gray-900">{cat.category}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${badge}`}>
                    {cat.fitScore}/10
                  </span>
                </div>
                <div className="bg-gray-200 rounded-full h-1.5 mb-2">
                  <div className={`${bar} h-1.5 rounded-full`} style={{ width: `${cat.fitScore * 10}%` }} />
                </div>
                <p className="text-xs text-gray-600">{cat.rationale}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand Suggestions — 2-column card grid */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-base">🤝</span> Brand Suggestions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {analysis.specificBrandSuggestions.map((brand, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="font-semibold text-sm text-gray-900">{brand.brandName}</span>
                <Pill label={brand.category} color="gray" />
              </div>
              <p className="text-xs text-gray-700 leading-relaxed">{brand.fitReason}</p>
              <div className="mt-auto pt-2 border-t border-gray-200">
                <p className="text-xs text-blue-700 italic">💡 {brand.pitchAngle}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SponsorshipAnalyzer() {
  const searchParams = useSearchParams();
  const [transcript, setTranscript] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SponsorshipAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = searchParams.get("transcript");
    const c = searchParams.get("comments");
    if (t) setTranscript(decodeURIComponent(t));
    if (c) setComments(decodeURIComponent(c));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!transcript.trim() && !comments.trim()) || loading) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    const apiKey = localStorage.getItem("creatoriq_gemini_key");

    try {
      const res = await fetch("/api/analyze-sponsorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, transcript, comments }),
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
      <div className={`mx-auto p-6 transition-all ${analysis ? "max-w-5xl" : "max-w-2xl"}`}>
        <h1 className="text-2xl font-bold mb-1">Sponsorship Fit Analyzer</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Paste a video transcript and/or audience comments to find the best-fit
          brand sponsorships for your channel.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Transcript
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your video transcript here..."
              rows={6}
              maxLength={15000}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Audience Comments
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Paste audience comments here (one per line or as a block)..."
              rows={6}
              maxLength={10000}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          {error && (
            <p className="text-red-600 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={(!transcript.trim() && !comments.trim()) || loading}
            className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Analyzing..." : "Analyze Sponsorship Fit"}
          </button>
        </form>

        {loading && (
          <div className="text-center text-gray-500 py-12">
            Analyzing your content with Gemini...
          </div>
        )}

        {analysis && <Results analysis={analysis} />}
      </div>
    </ApiKeyGate>
  );
}
