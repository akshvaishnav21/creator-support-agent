import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import type { SponsorshipAnalysis } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert YouTube sponsorship strategist with deep knowledge of influencer marketing, audience psychology, and brand partnerships.

Analyze the provided creator content and return a JSON object with this exact structure:
{
  "audienceProfile": {
    "ageRange": "string (e.g. '18-34')",
    "primaryInterests": ["array of 3-5 interest strings"],
    "likelyGender": "string (e.g. 'mixed', 'predominantly male', 'predominantly female')",
    "incomeSignal": "string (one of: 'budget-conscious', 'mid-range', 'premium')",
    "engagementStyle": "string (one sentence describing how the audience interacts)"
  },
  "contentTone": {
    "primaryTone": "string (e.g. 'educational', 'entertaining', 'motivational', 'technical')",
    "styleKeywords": ["array of 3-4 adjectives"],
    "authenticityScore": "number 1-10",
    "brandSafetyNotes": "string (any concerns or 'None identified')"
  },
  "topSponsorshipCategories": [
    {
      "category": "string",
      "fitScore": "number 1-10",
      "rationale": "string (1-2 sentences)"
    }
  ],
  "specificBrandSuggestions": [
    {
      "brandName": "string",
      "category": "string",
      "fitReason": "string (2-3 sentences)",
      "pitchAngle": "string (one sentence on how the creator should approach the brand)"
    }
  ],
  "summaryInsight": "string (2-3 sentences executive summary for the creator)"
}

Return exactly 4 items in topSponsorshipCategories and exactly 5 items in specificBrandSuggestions.
Return only the JSON object, nothing else.`;

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
