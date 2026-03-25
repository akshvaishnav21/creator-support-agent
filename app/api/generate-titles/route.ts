import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { safeParseJSON, truncate, INPUT_LIMITS } from "@/lib/api-utils";
import type { TitleAnalysis } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert YouTube growth strategist and copywriter who specializes in high-converting video titles and hooks.

Given a video concept (and optional transcript/outline), generate title and hook variations using proven psychological principles.

Return a JSON object with this exact structure:
{
  "titles": [
    {
      "title": "string (the full YouTube video title)",
      "hook": "string (the opening sentence/hook to use in the video or thumbnail subtitle)",
      "psychPrinciple": "string (one of: 'curiosity_gap', 'controversy', 'how_to', 'listicle', 'urgency', 'social_proof', 'story')",
      "score": "number 1-10 (estimated click-through potential)",
      "whyItWorks": "string (1-2 sentences explaining the psychology)"
    }
  ],
  "topPick": "string (the single best title from the list, copied exactly)",
  "audienceAngle": "string (one sentence describing who this content appeals to most)"
}

Generate exactly 15 title variations. Distribute them across the psychological principles:
- curiosity_gap: 3 titles
- how_to: 2 titles
- listicle: 2 titles
- story: 2 titles
- controversy: 2 titles
- urgency: 2 titles
- social_proof: 2 titles

Make titles specific, vivid, and platform-appropriate for YouTube. Avoid clickbait that over-promises.
Return only the JSON object, nothing else.`;

export async function POST(req: NextRequest) {
  const { apiKey, concept, captions } = await req.json();

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key required" },
      { status: 401 }
    );
  }

  if (!concept?.trim()) {
    return NextResponse.json(
      { error: "Video concept is required" },
      { status: 400 }
    );
  }

  const safeConcept = truncate(concept, INPUT_LIMITS.concept);
  const safeCaptions = truncate(captions, INPUT_LIMITS.captions);

  try {
    const model = getGeminiClient(apiKey);

    let prompt = SYSTEM_PROMPT + "\n\n---\n\nVIDEO CONCEPT:\n" + safeConcept.trim();
    if (safeCaptions?.trim()) {
      prompt += "\n\nVIDEO CAPTIONS / OUTLINE:\n" + safeCaptions.trim();
    }
    prompt += "\n\nGenerate the 15 title variations as JSON.";

    const result = await model.generateContent(prompt);
    const analysis = safeParseJSON<TitleAnalysis>(result.response.text());
    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
