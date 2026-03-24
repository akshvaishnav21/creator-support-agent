"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ApiKeyGate from "@/components/ApiKeyGate";
import type { TitleAnalysis, PsychPrinciple } from "@/lib/types";

const PRINCIPLE_LABELS: Record<PsychPrinciple, string> = {
  curiosity_gap: "Curiosity Gap",
  controversy: "Controversy",
  how_to: "How-To / Tutorial",
  listicle: "Listicle",
  urgency: "Urgency / FOMO",
  social_proof: "Social Proof",
  story: "Story / Journey",
};

const PRINCIPLE_COLORS: Record<PsychPrinciple, string> = {
  curiosity_gap: "bg-purple-100 text-purple-800",
  controversy: "bg-red-100 text-red-800",
  how_to: "bg-blue-100 text-blue-800",
  listicle: "bg-green-100 text-green-800",
  urgency: "bg-orange-100 text-orange-800",
  social_proof: "bg-teal-100 text-teal-800",
  story: "bg-pink-100 text-pink-800",
};

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="bg-gray-200 rounded h-1.5 w-16">
      <div
        className="bg-green-400 h-1.5 rounded"
        style={{ width: `${score * 10}%` }}
      />
    </div>
  );
}

function Results({ analysis }: { analysis: TitleAnalysis }) {
  // Group titles by principle
  const grouped = analysis.titles.reduce<Partial<Record<PsychPrinciple, typeof analysis.titles>>>(
    (acc, t) => {
      if (!acc[t.psychPrinciple]) acc[t.psychPrinciple] = [];
      acc[t.psychPrinciple]!.push(t);
      return acc;
    },
    {}
  );

  const principles = Object.keys(grouped) as PsychPrinciple[];

  return (
    <div className="space-y-6 mt-6">
      {/* Top Pick */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">Top Pick</span>
        </div>
        <p className="font-bold text-blue-900 text-lg">{analysis.topPick}</p>
        <p className="text-blue-700 text-sm mt-1">{analysis.audienceAngle}</p>
      </div>

      {/* Titles grouped by principle */}
      {principles.map((principle) => (
        <div key={principle} className="bg-gray-50 rounded-lg p-4">
          <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span className={`text-xs rounded-full px-2 py-0.5 ${PRINCIPLE_COLORS[principle]}`}>
              {PRINCIPLE_LABELS[principle]}
            </span>
          </h2>
          <div className="space-y-3">
            {grouped[principle]!.map((t, i) => (
              <div key={i} className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="font-semibold text-sm">{t.title}</p>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-gray-500">{t.score}/10</span>
                    <ScoreBar score={t.score} />
                  </div>
                </div>
                <p className="text-xs text-gray-500 italic mb-1">Hook: {t.hook}</p>
                <p className="text-xs text-gray-600">{t.whyItWorks}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TitleFactory() {
  const searchParams = useSearchParams();
  const [concept, setConcept] = useState("");
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    const c = searchParams.get("concept");
    const t = searchParams.get("transcript");
    if (c) setConcept(decodeURIComponent(c));
    if (t) setTranscript(decodeURIComponent(t));
  }, [searchParams]);
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<TitleAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!concept.trim() || loading) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    const apiKey = localStorage.getItem("creatoriq_gemini_key");

    try {
      const res = await fetch("/api/generate-titles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, concept, transcript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Generation failed");
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
        <h1 className="text-2xl font-bold mb-1">Hook &amp; Title Factory</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Generate 15 high-converting title and hook variations for your video,
          grouped by psychological principle.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Concept <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              placeholder="e.g. How I saved $10,000 in one year on a $50k salary"
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transcript or Outline{" "}
              <span className="text-gray-400 font-normal">(optional, improves results)</span>
            </label>
            <textarea
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your script outline or key points here..."
              rows={5}
              maxLength={10000}
              className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={!concept.trim() || loading}
            className="w-full bg-blue-500 text-white py-2.5 rounded-lg font-medium hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? "Generating..." : "Generate 15 Titles"}
          </button>
        </form>

        {loading && (
          <div className="text-center text-gray-500 py-12">
            Generating title variations with Gemini...
          </div>
        )}

        {analysis && <Results analysis={analysis} />}
      </div>
    </ApiKeyGate>
  );
}
