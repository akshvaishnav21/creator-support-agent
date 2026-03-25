import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import type { SponsorshipAnalysis } from "@/lib/types";

const SYSTEM_PROMPT = `You are a senior influencer-marketing strategist with 10+ years placing brand deals at top creator agencies. You have current knowledge of YouTube niche CPM rates and active brand partnership programs.

Analyze the provided creator content (transcript and/or audience comments) and return a JSON object conforming EXACTLY to this schema. Every string field must be specific and actionable — never generic. Brand rationale must cite concrete signals from the actual content. Pitch angles must name a specific deal mechanic.

{
  "audienceProfile": {
    "ageRange": "specific range e.g. '22-35'. Infer from vocabulary, references, and aspirations in the content.",
    "primaryInterests": ["4-6 interest tags drawn directly from content signals, not generic labels"],
    "likelyGender": "one of: 'predominantly male (est. 70%+)', 'predominantly female (est. 70%+)', 'roughly balanced (45-55% split)'",
    "incomeSignal": "one of: 'budget-conscious (under $50k HHI)', 'mid-range ($50k-$100k HHI)', 'premium ($100k+ HHI)'",
    "engagementStyle": "one sentence describing HOW the audience interacts, e.g. 'asks follow-up questions, shares timestamps, high save-rate behavior'"
  },
  "contentTone": {
    "primaryTone": "single most precise word: 'educational', 'conversational', 'aspirational', 'technical', 'satirical', 'motivational', or 'documentary'",
    "styleKeywords": ["4 adjectives a brand manager would use to describe this creator's on-screen presence"],
    "authenticityScore": "integer 1-10. 10 = raw unscripted personality; 1 = fully polished corporate tone",
    "brandSafetyNotes": "flag edgy language, controversial topics, or political content. If clean: 'None identified.'"
  },
  "topSponsorshipCategories": [
    {
      "category": "specific vertical e.g. 'developer tools & SaaS productivity' not just 'technology'",
      "fitScore": "integer 1-10",
      "rationale": "2 sentences: sentence 1 = audience-brand overlap; sentence 2 = cite a specific content moment proving the fit"
    }
  ],
  "specificBrandSuggestions": [
    {
      "brandName": "a real, currently-active brand name (not a category placeholder)",
      "category": "the vertical this brand belongs to",
      "fitReason": "exactly 2 sentences: (1) why this brand's customer profile overlaps with this audience; (2) cite a specific content signal that makes the match obvious",
      "pitchAngle": "one sentence with a specific deal mechanic e.g. 'Pitch Notion on a dedicated workflow video offering an affiliate link with a 3-month Pro trial for viewers.'"
    }
  ],
  "estimatedCpmRange": {
    "low": "conservative CPM in USD as a plain number e.g. 25",
    "high": "optimistic CPM in USD for a well-negotiated deal as a plain number e.g. 55"
  },
  "brandsToAvoid": [
    "2-3 strings, each formatted as: 'BrandName or Category — one sentence explaining why this would harm audience trust or be a poor fit'"
  ],
  "dealTypeRecommendation": "one of: 'Dedicated video (highest CPM, best for complex products)', 'Integrated mid-roll (60-90 sec, balanced reach/rate)', 'Affiliate-only (lower upfront, long tail revenue)', 'Whitelisting/usage rights deal', 'Product seeding with gifting'. Add one sentence of reasoning for this creator specifically.",
  "summaryInsight": "exactly 3 sentences: (1) the creator's strongest monetization asset; (2) the single highest-leverage action they should take this week; (3) a realistic 6-month revenue outlook given their content trajectory."
}

Rules:
- Return exactly 4 items in topSponsorshipCategories.
- Return exactly 5 items in specificBrandSuggestions.
- Return exactly 2-3 items in brandsToAvoid.
- estimatedCpmRange.low and .high must be plain numbers, no dollar sign, no quotes around the number.
- Do NOT include an outreachEmailTemplate field.
- Return ONLY the JSON object. No markdown fences, no commentary before or after.`;

function buildPrompt(transcript?: string, comments?: string): string {
  const parts: string[] = [];
  if (transcript?.trim()) {
    parts.push(`VIDEO TRANSCRIPT:\n${transcript.trim()}`);
  }
  if (comments?.trim()) {
    parts.push(`AUDIENCE COMMENTS:\n${comments.trim()}`);
  }
  return (
    SYSTEM_PROMPT +
    "\n\n---\n\nContent to analyze:\n\n" +
    parts.join("\n\n---\n\n") +
    "\n\nReturn the JSON analysis."
  );
}

export async function POST(req: NextRequest) {
  const { apiKey, transcript, comments } = await req.json();

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key required" },
      { status: 401 }
    );
  }

  if (!transcript?.trim() && !comments?.trim()) {
    return NextResponse.json(
      { error: "At least one of transcript or comments is required" },
      { status: 400 }
    );
  }

  try {
    const model = getGeminiClient(apiKey);
    const result = await model.generateContent(buildPrompt(transcript, comments));
    const analysis: SponsorshipAnalysis = JSON.parse(result.response.text());
    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
