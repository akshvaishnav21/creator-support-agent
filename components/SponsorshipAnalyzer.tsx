"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ApiKeyGate from "@/components/ApiKeyGate";
import YouTubeUrlInput from "@/components/YouTubeUrlInput";
import type { SponsorshipAnalysis, BrandContactResult, YouTubeVideoData } from "@/lib/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

const SCORE_COLORS = [
  { min: 8, bar: "bg-green-500", badge: "bg-green-100 text-green-800" },
  { min: 6, bar: "bg-blue-500",  badge: "bg-blue-100 text-blue-800"  },
  { min: 4, bar: "bg-yellow-400",badge: "bg-yellow-100 text-yellow-800"},
  { min: 0, bar: "bg-gray-400",  badge: "bg-gray-100 text-gray-700"  },
];

function scoreColor(score: number) {
  return SCORE_COLORS.find((c) => score >= c.min)!;
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

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <button
      onClick={handleCopy}
      className="text-xs text-gray-400 hover:text-blue-600 transition-colors shrink-0"
      title={label}
    >
      {copied ? <span className="text-green-600 text-xs">Copied!</span> : "📋"}
    </button>
  );
}

function buildReportText(analysis: SponsorshipAnalysis): string {
  const lines: string[] = [
    "# Sponsorship Fit Analysis",
    "",
    "## Executive Summary",
    analysis.summaryInsight,
    "",
    "## Audience Profile",
    `- Age Range: ${analysis.audienceProfile.ageRange}`,
    `- Gender: ${analysis.audienceProfile.likelyGender}`,
    `- Income Signal: ${analysis.audienceProfile.incomeSignal}`,
    `- Engagement: ${analysis.audienceProfile.engagementStyle}`,
    `- Interests: ${analysis.audienceProfile.primaryInterests.join(", ")}`,
    "",
    "## Content Tone",
    `- Primary Tone: ${analysis.contentTone.primaryTone}`,
    `- Authenticity: ${analysis.contentTone.authenticityScore}/10`,
    `- Style: ${analysis.contentTone.styleKeywords.join(", ")}`,
    `- Brand Safety: ${analysis.contentTone.brandSafetyNotes}`,
    "",
    "## Deal Intelligence",
    `- Estimated CPM: $${analysis.estimatedCpmRange.low}–$${analysis.estimatedCpmRange.high}`,
    `- Recommended Deal Type: ${analysis.dealTypeRecommendation}`,
    "",
    "### Brands to Avoid",
    ...analysis.brandsToAvoid.map((b) => `- ${b}`),
    "",
    "## Top Sponsorship Categories",
    ...(analysis.topSponsorshipCategories ?? []).map(
      (c) => `### ${c.category} (${c.fitScore}/10)\n${c.rationale}`
    ),
    "",
    "## Brand Suggestions",
    ...(analysis.specificBrandSuggestions ?? []).map(
      (b) =>
        `### ${b.brandName} (${b.category})\n${b.fitReason}\n\nPitch: ${b.pitchAngle}`
    ),
    "",
  ];
  return lines.join("\n");
}

// ─── Inline Email Panel ─────────────────────────────────────────────────────

function InlineEmailPanel({
  brandName,
  pitchAngle,
  audienceProfile,
  contentTone,
  apiKey,
}: {
  brandName: string;
  pitchAngle: string;
  audienceProfile: SponsorshipAnalysis["audienceProfile"];
  contentTone: SponsorshipAnalysis["contentTone"];
  apiKey: string;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, brandName, pitchAngle, audienceProfile, contentTone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Email generation failed");
      setEmail(data.email);
      setOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  if (!email) {
    return (
      <div className="pt-2 border-t border-gray-200">
        {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
        <button
          onClick={generate}
          disabled={loading}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? "Generating..." : "✉️ Generate outreach email"}
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-gray-200">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="text-xs font-medium text-gray-700">✉️ Outreach Email</span>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 relative">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 pr-8">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap font-mono leading-relaxed">
              {email}
            </pre>
          </div>
          <div className="absolute top-1.5 right-1.5">
            <CopyButton text={email} label="Copy email" />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Results Dashboard ──────────────────────────────────────────────────────

function Results({
  analysis,
  brandContacts,
  contactsLoading,
  apiKey,
}: {
  analysis: SponsorshipAnalysis;
  brandContacts: BrandContactResult[] | null;
  contactsLoading: boolean;
  apiKey: string;
}) {
  const [avoidsOpen, setAvoidsOpen] = useState(false);
  const reportText = buildReportText(analysis);

  return (
    <div className="space-y-6 mt-8 animate-fade-in">

      {/* Executive Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-xl p-5 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-blue-200 mb-1 font-medium">
              Executive Summary
            </p>
            <p className="text-sm leading-relaxed">{analysis.summaryInsight}</p>
          </div>
          <CopyButton text={reportText} label="Copy full report as markdown" />
        </div>
      </div>

      {/* Audience Profile + Content Tone */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>👥</span> Audience Profile
          </h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCell label="Age Range" value={analysis.audienceProfile.ageRange} />
            <StatCell label="Gender" value={analysis.audienceProfile.likelyGender} />
            <StatCell label="Income Signal" value={analysis.audienceProfile.incomeSignal} />
            <StatCell label="Engagement" value={analysis.audienceProfile.engagementStyle} />
          </div>
          <p className="text-xs text-gray-500 mb-2">Primary Interests</p>
          <div className="flex flex-wrap gap-1.5">
            {(analysis.audienceProfile.primaryInterests ?? []).map((i) => (
              <Pill key={i} label={i} color="blue" />
            ))}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span>🎙️</span> Content Tone
          </h2>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <StatCell label="Primary Tone" value={analysis.contentTone.primaryTone} />
            <StatCell label="Authenticity" value={`${analysis.contentTone.authenticityScore}/10`} />
          </div>
          <p className="text-xs text-gray-500 mb-2">Style Keywords</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(analysis.contentTone.styleKeywords ?? []).map((k) => (
              <Pill key={k} label={k} color="gray" />
            ))}
          </div>
          {analysis.contentTone.brandSafetyNotes !== "None identified." &&
            analysis.contentTone.brandSafetyNotes !== "None identified" && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-xs text-yellow-800">
                ⚠️ {analysis.contentTone.brandSafetyNotes}
              </div>
            )}
        </div>
      </div>

      {/* Deal Intelligence */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>💰</span> Deal Intelligence
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-green-50 border border-green-100 rounded-lg p-3">
            <p className="text-xs text-green-700 mb-0.5">Estimated CPM</p>
            <p className="text-lg font-bold text-green-800">
              ${analysis.estimatedCpmRange.low}–${analysis.estimatedCpmRange.high}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 sm:col-span-2">
            <p className="text-xs text-blue-700 mb-0.5">Recommended Deal Type</p>
            <p className="text-sm font-semibold text-blue-900">{analysis.dealTypeRecommendation}</p>
          </div>
        </div>

        {/* Brands to Avoid */}
        <button
          onClick={() => setAvoidsOpen((o) => !o)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <span className="text-red-400">🚫</span>
          <span>Brands to Avoid ({(analysis.brandsToAvoid ?? []).length})</span>
          <span className="text-xs">{avoidsOpen ? "▲" : "▼"}</span>
        </button>
        {avoidsOpen && (
          <ul className="mt-3 space-y-1.5">
            {(analysis.brandsToAvoid ?? []).map((b, i) => (
              <li key={i} className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {b}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Top Sponsorship Categories */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🏷️</span> Top Sponsorship Categories
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(analysis.topSponsorshipCategories ?? []).map((cat, i) => {
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
                <div className="flex items-start gap-1.5">
                  <p className="text-xs text-gray-600 flex-1">{cat.rationale}</p>
                  <CopyButton text={cat.rationale} label="Copy rationale" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Brand Suggestions */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span>🤝</span> Brand Suggestions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(analysis.specificBrandSuggestions ?? []).map((brand, i) => {
            const contact = brandContacts?.find(
              (c) => c.brandName === brand.brandName
            );
            return (
              <div key={i} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm text-gray-900">{brand.brandName}</span>
                  <Pill label={brand.category} color="gray" />
                </div>
                <p className="text-xs text-gray-700 leading-relaxed">{brand.fitReason}</p>
                <div className="mt-auto pt-2 border-t border-gray-200">
                  <div className="flex items-start gap-1.5">
                    <p className="text-xs text-blue-700 italic flex-1">💡 {brand.pitchAngle}</p>
                    <CopyButton text={brand.pitchAngle} label="Copy pitch angle" />
                  </div>
                </div>

                {/* Brand contact links */}
                <div className="pt-1">
                  {contactsLoading ? (
                    <p className="text-xs text-gray-400 animate-pulse">Finding contact page...</p>
                  ) : contact?.sponsorshipUrl ? (
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={contact.sponsorshipUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline font-medium"
                      >
                        View Sponsorship Page →
                      </a>
                      {contact.contactUrl && contact.contactUrl !== contact.sponsorshipUrl && (
                        <a
                          href={contact.contactUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-gray-500 hover:underline"
                        >
                          Contact →
                        </a>
                      )}
                    </div>
                  ) : contact?.searchStatus === "error" || contact?.searchStatus === "not_found" ? (
                    <p className="text-xs text-gray-400">No contact page found</p>
                  ) : null}
                </div>

                {/* On-demand outreach email */}
                <InlineEmailPanel
                  brandName={brand.brandName}
                  pitchAngle={brand.pitchAngle}
                  audienceProfile={analysis.audienceProfile}
                  contentTone={analysis.contentTone}
                  apiKey={apiKey}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SponsorshipAnalyzer() {
  const searchParams = useSearchParams();
  const [transcript, setTranscript] = useState("");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SponsorshipAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [brandContacts, setBrandContacts] = useState<BrandContactResult[] | null>(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");

  const videoUrl = searchParams.get("videoUrl") ?? undefined;

  useEffect(() => {
    const t = searchParams.get("transcript");
    const c = searchParams.get("comments");
    if (t) setTranscript(decodeURIComponent(t));
    if (c) setComments(decodeURIComponent(c));
  }, [searchParams]);

  function handleYtFetch(data: YouTubeVideoData) {
    if (data.transcript) setTranscript(data.transcript);
    if (data.comments) setComments(data.comments);
  }

  async function triggerBrandSearch(apiKey: string, brands: string[]) {
    setContactsLoading(true);
    setBrandContacts(null);
    try {
      const res = await fetch("/api/search-brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, brands }),
      });
      if (res.ok) {
        const data = await res.json();
        setBrandContacts(data.results);
      }
    } catch {
      // silent — brand search is an enhancement only
    } finally {
      setContactsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!transcript.trim() && !comments.trim()) || loading) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setBrandContacts(null);

    const storedKey = localStorage.getItem("creatoriq_gemini_key") ?? "";
    setApiKey(storedKey);

    try {
      const res = await fetch("/api/analyze-sponsorship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: storedKey, transcript, comments }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Analysis failed");
      setAnalysis(data.analysis);
      triggerBrandSearch(storedKey, data.analysis.specificBrandSuggestions.map((b: { brandName: string }) => b.brandName));
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

        <YouTubeUrlInput onFetched={handleYtFetch} autoFetchUrl={videoUrl} />

        <div className="flex items-center gap-3 my-1">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or fill in manually</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

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

          {error && <p className="text-red-600 text-sm">{error}</p>}

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

        {analysis && (
          <Results
            analysis={analysis}
            brandContacts={brandContacts}
            contactsLoading={contactsLoading}
            apiKey={apiKey}
          />
        )}
      </div>
    </ApiKeyGate>
  );
}
