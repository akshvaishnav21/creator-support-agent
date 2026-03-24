"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ApiKeyGate from "@/components/ApiKeyGate";
import type { SponsorshipAnalysis } from "@/lib/types";

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="bg-gray-200 rounded h-2 w-full">
      <div
        className="bg-green-400 h-2 rounded"
        style={{ width: `${score * 10}%` }}
      />
    </div>
  );
}

function Pill({ label, color = "blue" }: { label: string; color?: "blue" | "gray" }) {
  const cls =
    color === "blue"
      ? "bg-blue-100 text-blue-800"
      : "bg-gray-100 text-gray-700";
  return (
    <span className={`text-xs rounded-full px-2 py-0.5 ${cls}`}>{label}</span>
  );
}

function Results({ analysis }: { analysis: SponsorshipAnalysis }) {
  return (
    <div className="space-y-6 mt-6">
      {/* Executive Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h2 className="font-semibold text-blue-900 mb-2">Executive Summary</h2>
        <p className="text-blue-800 text-sm">{analysis.summaryInsight}</p>
      </div>

      {/* Audience Profile */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Audience Profile</h2>
        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
          <div>
            <span className="text-gray-500">Age Range</span>
            <p className="font-medium">{analysis.audienceProfile.ageRange}</p>
          </div>
          <div>
            <span className="text-gray-500">Gender</span>
            <p className="font-medium">{analysis.audienceProfile.likelyGender}</p>
          </div>
          <div>
            <span className="text-gray-500">Income Signal</span>
            <p className="font-medium capitalize">{analysis.audienceProfile.incomeSignal}</p>
          </div>
          <div>
            <span className="text-gray-500">Engagement</span>
            <p className="font-medium">{analysis.audienceProfile.engagementStyle}</p>
          </div>
        </div>
        <div>
          <span className="text-gray-500 text-sm">Primary Interests</span>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {analysis.audienceProfile.primaryInterests.map((i) => (
              <Pill key={i} label={i} color="blue" />
            ))}
          </div>
        </div>
      </div>

      {/* Content Tone */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Content Tone</h2>
        <div className="text-sm space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Primary Tone:</span>
            <span className="font-medium capitalize">{analysis.contentTone.primaryTone}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Authenticity:</span>
            <span className="font-medium">{analysis.contentTone.authenticityScore}/10</span>
          </div>
          <div>
            <span className="text-gray-500">Style:</span>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {analysis.contentTone.styleKeywords.map((k) => (
                <Pill key={k} label={k} color="gray" />
              ))}
            </div>
          </div>
          {analysis.contentTone.brandSafetyNotes !== "None identified" && (
            <div className="text-yellow-700 bg-yellow-50 rounded p-2 text-xs">
              Brand safety: {analysis.contentTone.brandSafetyNotes}
            </div>
          )}
        </div>
      </div>

      {/* Top Sponsorship Categories */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Top Sponsorship Categories</h2>
        <div className="space-y-3">
          {analysis.topSponsorshipCategories.map((cat, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{cat.category}</span>
                <span className="text-gray-500">{cat.fitScore}/10</span>
              </div>
              <ScoreBar score={cat.fitScore} />
              <p className="text-xs text-gray-600 mt-1">{cat.rationale}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Suggestions */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h2 className="font-semibold text-gray-900 mb-3">Brand Suggestions</h2>
        <div className="space-y-4">
          {analysis.specificBrandSuggestions.map((brand, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm">{brand.brandName}</span>
                <Pill label={brand.category} color="gray" />
              </div>
              <p className="text-sm text-gray-700 mb-1">{brand.fitReason}</p>
              <p className="text-xs text-gray-500 italic">
                Pitch angle: {brand.pitchAngle}
              </p>
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
      <div className="max-w-2xl mx-auto p-6">
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
