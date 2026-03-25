"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ApiKeyGate from "@/components/ApiKeyGate";
import CopyButton from "@/components/CopyButton";
import { SponsorshipSkeleton } from "@/components/LoadingSkeleton";
import YouTubeUrlInput from "@/components/YouTubeUrlInput";
import { useApiCall, getGeminiKey } from "@/lib/hooks";
import type { SponsorshipAnalysis, BrandContactResult, YouTubeVideoData } from "@/lib/types";

const STORAGE_KEY = "creatoriq_last_sponsorship";

const SCORE_COLORS = [
  { min: 8, bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300" },
  { min: 6, bar: "bg-blue-500", badge: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300" },
  { min: 4, bar: "bg-amber-400", badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300" },
  { min: 0, bar: "bg-gray-400", badge: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
];

function scoreColor(score: number) {
  return SCORE_COLORS.find((c) => score >= c.min)!;
}

function Pill({ label, variant = "blue" }: { label: string; variant?: "blue" | "gray" }) {
  const cls = variant === "blue"
    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  return <span className={`text-xs font-medium rounded-full px-2.5 py-0.5 ${cls}`}>{label}</span>;
}

function MetricCard({ label, value, sub, color = "gray" }: { label: string; value: string; sub?: string; color?: "green" | "blue" | "purple" | "gray" }) {
  const colors = {
    green: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800",
    blue: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    purple: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
    gray: "bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700",
  };
  const textColors = {
    green: "text-emerald-800 dark:text-emerald-300",
    blue: "text-blue-800 dark:text-blue-300",
    purple: "text-purple-800 dark:text-purple-300",
    gray: "text-gray-900 dark:text-gray-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function buildReportText(analysis: SponsorshipAnalysis): string {
  const lines: string[] = [
    "# Sponsorship Fit Analysis", "",
    "## Executive Summary", analysis.summaryInsight, "",
    "## Audience Profile",
    `- Age Range: ${analysis.audienceProfile.ageRange}`,
    `- Gender: ${analysis.audienceProfile.likelyGender}`,
    `- Income Signal: ${analysis.audienceProfile.incomeSignal}`,
    `- Engagement: ${analysis.audienceProfile.engagementStyle}`,
    `- Interests: ${analysis.audienceProfile.primaryInterests.join(", ")}`, "",
    "## Content Tone",
    `- Primary Tone: ${analysis.contentTone.primaryTone}`,
    `- Authenticity: ${analysis.contentTone.authenticityScore}/10`,
    `- Style: ${analysis.contentTone.styleKeywords.join(", ")}`,
    `- Brand Safety: ${analysis.contentTone.brandSafetyNotes}`, "",
    "## Deal Intelligence",
    `- Estimated CPM: $${analysis.estimatedCpmRange.low}-$${analysis.estimatedCpmRange.high}`,
    `- Recommended Deal Type: ${analysis.dealTypeRecommendation}`, "",
    "### Brands to Avoid", ...analysis.brandsToAvoid.map((b) => `- ${b}`), "",
    "## Top Sponsorship Categories",
    ...(analysis.topSponsorshipCategories ?? []).map((c) => `### ${c.category} (${c.fitScore}/10)\n${c.rationale}`), "",
    "## Brand Suggestions",
    ...(analysis.specificBrandSuggestions ?? []).map((b) => `### ${b.brandName} (${b.category})\n${b.fitReason}\n\nPitch: ${b.pitchAngle}`), "",
  ];
  return lines.join("\n");
}

// ─── Inline Email Panel ─────────────────────────────────────────────────────

function InlineEmailPanel({ brandName, pitchAngle, audienceProfile, contentTone, apiKey }: {
  brandName: string; pitchAngle: string;
  audienceProfile: SponsorshipAnalysis["audienceProfile"];
  contentTone: SponsorshipAnalysis["contentTone"];
  apiKey: string;
}) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  async function generate() {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/generate-email", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey, brandName, pitchAngle, audienceProfile, contentTone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Email generation failed");
      setEmail(data.email); setOpen(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Failed"); }
    finally { setLoading(false); }
  }

  if (!email) {
    return (
      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
        {error && <p className="text-xs text-red-500 mb-1">{error}</p>}
        <button onClick={generate} disabled={loading}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 font-medium disabled:opacity-50">
          {loading ? "Generating..." : "Generate outreach email"}
        </button>
      </div>
    );
  }

  return (
    <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center justify-between w-full text-left">
        <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Outreach Email</span>
        <span className="text-gray-400 text-xs">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="mt-2 relative">
          <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-3 pr-8">
            <pre className="text-xs text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono leading-relaxed">{email}</pre>
          </div>
          <div className="absolute top-1.5 right-1.5"><CopyButton text={email} label="Copy email" /></div>
        </div>
      )}
    </div>
  );
}

// ─── Results Dashboard ──────────────────────────────────────────────────────

function Results({ analysis, brandContacts, contactsLoading, apiKey }: {
  analysis: SponsorshipAnalysis; brandContacts: BrandContactResult[] | null;
  contactsLoading: boolean; apiKey: string;
}) {
  const [avoidsOpen, setAvoidsOpen] = useState(false);
  const reportText = buildReportText(analysis);
  const audienceSummary = `Audience: ${analysis.audienceProfile.ageRange}, ${analysis.audienceProfile.primaryInterests.slice(0, 3).join(", ")}`;

  return (
    <div className="mt-8 animate-fade-in space-y-5">

      {/* ── Row 1: Summary banner ── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZyIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2cpIiB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs uppercase tracking-widest text-blue-200 mb-2 font-semibold">Executive Summary</p>
            <p className="text-base leading-relaxed font-medium">{analysis.summaryInsight}</p>
          </div>
          <CopyButton text={reportText} label="Copy full report" className="text-blue-200 hover:text-white shrink-0" />
        </div>
        <div className="relative flex flex-wrap gap-2 mt-4">
          <Link href={`/titles?concept=${encodeURIComponent(audienceSummary)}`}
            className="text-xs bg-white/15 hover:bg-white/25 backdrop-blur rounded-lg px-3 py-1.5 transition-colors">
            Generate titles for this audience →
          </Link>
          <Link href="/comments"
            className="text-xs bg-white/15 hover:bg-white/25 backdrop-blur rounded-lg px-3 py-1.5 transition-colors">
            Analyze comments →
          </Link>
        </div>
      </div>

      {/* ── Row 2: Key metrics ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Estimated CPM" value={`$${analysis.estimatedCpmRange.low}-$${analysis.estimatedCpmRange.high}`} color="green" />
        <MetricCard label="Authenticity Score" value={`${analysis.contentTone.authenticityScore}/10`} sub={analysis.contentTone.primaryTone} color="blue" />
        <MetricCard label="Age Range" value={analysis.audienceProfile.ageRange} sub={analysis.audienceProfile.likelyGender} color="purple" />
        <MetricCard label="Income Signal" value={analysis.audienceProfile.incomeSignal} sub={analysis.audienceProfile.engagementStyle} color="gray" />
      </div>

      {/* ── Row 3: Audience + Tone + Deal (3-col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Audience Profile */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">Audience Profile</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Primary Interests</p>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(analysis.audienceProfile.primaryInterests ?? []).map((i) => (
              <Pill key={i} label={i} variant="blue" />
            ))}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500 dark:text-gray-400">Engagement</span>
              <span className="text-gray-800 dark:text-gray-200 font-medium">{analysis.audienceProfile.engagementStyle}</span>
            </div>
          </div>
        </div>

        {/* Content Tone */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">Content Tone</h2>
          <div className="flex flex-wrap gap-1.5 mb-4">
            {(analysis.contentTone.styleKeywords ?? []).map((k) => (
              <Pill key={k} label={k} variant="gray" />
            ))}
          </div>
          {analysis.contentTone.brandSafetyNotes !== "None identified." &&
            analysis.contentTone.brandSafetyNotes !== "None identified" && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 text-xs text-amber-800 dark:text-amber-300">
                {analysis.contentTone.brandSafetyNotes}
              </div>
            )}
        </div>

        {/* Deal Intelligence */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-3 uppercase tracking-wide">Deal Intelligence</h2>
          <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-3">{analysis.dealTypeRecommendation}</p>
          <button onClick={() => setAvoidsOpen((o) => !o)}
            className="flex items-center gap-2 text-xs text-red-500 dark:text-red-400 hover:text-red-700 transition-colors">
            Brands to Avoid ({(analysis.brandsToAvoid ?? []).length})
            <span>{avoidsOpen ? "▲" : "▼"}</span>
          </button>
          {avoidsOpen && (
            <ul className="mt-2 space-y-1">
              {(analysis.brandsToAvoid ?? []).map((b, i) => (
                <li key={i} className="text-xs text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-1.5">{b}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Row 4: Categories + Brand Suggestions (2-col) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Categories — 2 cols */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide">Sponsorship Categories</h2>
          <div className="space-y-4">
            {(analysis.topSponsorshipCategories ?? []).map((cat, i) => {
              const { bar, badge } = scoreColor(cat.fitScore);
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">{cat.category}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{cat.fitScore}/10</span>
                  </div>
                  <div className="bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                    <div className={`${bar} h-2 rounded-full transition-all`} style={{ width: `${cat.fitScore * 10}%` }} />
                  </div>
                  <div className="flex items-start gap-1.5">
                    <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 leading-relaxed">{cat.rationale}</p>
                    <CopyButton text={cat.rationale} label="Copy" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Brand Suggestions — 3 cols */}
        <div className="lg:col-span-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5">
          <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4 uppercase tracking-wide">Brand Suggestions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(analysis.specificBrandSuggestions ?? []).map((brand, i) => {
              const contact = brandContacts?.find((c) => c.brandName === brand.brandName);
              return (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-gray-50 dark:bg-gray-900/50 flex flex-col gap-2 hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-gray-100">{brand.brandName}</span>
                    <Pill label={brand.category} variant="gray" />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed flex-1">{brand.fitReason}</p>
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-start gap-1.5">
                      <p className="text-xs text-blue-600 dark:text-blue-400 italic flex-1">{brand.pitchAngle}</p>
                      <CopyButton text={brand.pitchAngle} label="Copy pitch" />
                    </div>
                  </div>
                  {/* Contact links */}
                  <div className="text-xs">
                    {contactsLoading ? (
                      <p className="text-gray-400 animate-pulse">Finding contact...</p>
                    ) : contact?.sponsorshipUrl ? (
                      <div className="flex flex-wrap gap-2">
                        <a href={contact.sponsorshipUrl} target="_blank" rel="noopener noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Sponsorship Page →</a>
                        {contact.contactUrl && contact.contactUrl !== contact.sponsorshipUrl && (
                          <a href={contact.contactUrl} target="_blank" rel="noopener noreferrer"
                            className="text-gray-500 hover:underline">Contact →</a>
                        )}
                      </div>
                    ) : contact?.searchStatus === "error" || contact?.searchStatus === "not_found" ? (
                      <p className="text-gray-400">No contact page found</p>
                    ) : null}
                  </div>
                  <InlineEmailPanel brandName={brand.brandName} pitchAngle={brand.pitchAngle}
                    audienceProfile={analysis.audienceProfile} contentTone={analysis.contentTone} apiKey={apiKey} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function SponsorshipAnalyzer() {
  const searchParams = useSearchParams();
  const [captions, setCaptions] = useState("");
  const [comments, setComments] = useState("");
  const [analysis, setAnalysis] = useState<SponsorshipAnalysis | null>(null);
  const [brandContacts, setBrandContacts] = useState<BrandContactResult[] | null>(null);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [apiKey, setApiKey] = useState<string>("");
  const videoUrl = searchParams.get("videoUrl") ?? undefined;
  const { loading, error, call } = useApiCall<{ analysis: SponsorshipAnalysis }>();

  useEffect(() => {
    try { const stored = localStorage.getItem(STORAGE_KEY); if (stored) setAnalysis(JSON.parse(stored)); } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const t = searchParams.get("captions"); const c = searchParams.get("comments");
    if (t) setCaptions(decodeURIComponent(t)); if (c) setComments(decodeURIComponent(c));
  }, [searchParams]);

  function handleYtFetch(data: YouTubeVideoData) {
    if (data.captions) setCaptions(data.captions);
    if (data.comments) setComments(data.comments);
  }

  async function triggerBrandSearch(key: string, brands: string[]) {
    setContactsLoading(true); setBrandContacts(null);
    try {
      const res = await fetch("/api/search-brands", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey: key, brands }) });
      if (res.ok) { const data = await res.json(); setBrandContacts(data.results); }
    } catch { /* silent */ } finally { setContactsLoading(false); }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if ((!captions.trim() && !comments.trim()) || loading) return;
    setAnalysis(null); setBrandContacts(null);
    const storedKey = getGeminiKey(); setApiKey(storedKey);
    const result = await call("/api/analyze-sponsorship", { apiKey: storedKey, captions, comments });
    if (result?.analysis) {
      setAnalysis(result.analysis);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(result.analysis));
      triggerBrandSearch(storedKey, result.analysis.specificBrandSuggestions.map((b) => b.brandName));
    }
  }

  function clearResults() { setAnalysis(null); setBrandContacts(null); localStorage.removeItem(STORAGE_KEY); }

  return (
    <ApiKeyGate>
      <div className={`mx-auto px-4 sm:px-6 py-6 transition-all duration-300 ${analysis ? "max-w-7xl" : "max-w-3xl"}`}>
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Sponsorship Fit Analyzer</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Paste video captions and/or audience comments to find the best-fit brand sponsorships.
          </p>
        </div>

        {/* Input form */}
        {!analysis && (
          <>
            <YouTubeUrlInput onFetched={handleYtFetch} autoFetchUrl={videoUrl} />
            <div className="flex items-center gap-3 my-3">
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
              <span className="text-xs text-gray-400">or fill in manually</span>
              <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Captions</label>
                <textarea value={captions} onChange={(e) => setCaptions(e.target.value)}
                  placeholder="Paste your video captions here..." rows={5} maxLength={15000}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audience Comments</label>
                <textarea value={comments} onChange={(e) => setComments(e.target.value)}
                  placeholder="Paste audience comments here (one per line or as a block)..." rows={5} maxLength={15000}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-y bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" />
              </div>
              {error && <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={(!captions.trim() && !comments.trim()) || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition-colors shadow-sm shadow-blue-600/25">
                {loading ? "Analyzing..." : "Analyze Sponsorship Fit"}
              </button>
            </form>
          </>
        )}

        {/* Loading skeleton */}
        {loading && <SponsorshipSkeleton />}

        {/* Results header with actions */}
        {analysis && !loading && (
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => { setAnalysis(null); }} className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium">
              ← New Analysis
            </button>
            <div className="flex-1" />
            <button onClick={clearResults}
              className="text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 px-4 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Clear Results
            </button>
          </div>
        )}

        {/* Dashboard */}
        {analysis && <Results analysis={analysis} brandContacts={brandContacts} contactsLoading={contactsLoading} apiKey={apiKey} />}
      </div>
    </ApiKeyGate>
  );
}
