import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { safeParseJSON } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const { apiKey, brandName, pitchAngle, audienceProfile, contentTone } =
    await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key required" }, { status: 401 });
  }

  if (!brandName) {
    return NextResponse.json({ error: "brandName is required" }, { status: 400 });
  }

  const prompt = `You are a creator partnership specialist writing cold outreach emails on behalf of YouTube creators.

Write a cold outreach email from a creator to ${brandName} proposing a sponsorship deal.

Context:
- Brand: ${brandName}
- Pitch angle: ${pitchAngle ?? "general sponsorship inquiry"}
- Audience age range: ${audienceProfile?.ageRange ?? "unknown"}
- Audience income level: ${audienceProfile?.incomeSignal ?? "unknown"}
- Content tone: ${contentTone?.primaryTone ?? "unknown"}
- Authenticity score: ${contentTone?.authenticityScore ?? "unknown"}/10

Return a JSON object with a single field:
{ "email": "the complete email as a string with \\n for line breaks" }

Email requirements:
- Line 1: subject line prefixed with "Subject:"
- Blank line after subject
- Body under 200 words
- Use [Creator Name], [Channel Name], [Subscriber Count] as placeholders
- Reference ${brandName} by name
- Tie the pitch to the audience profile above
- Friendly, direct, no fluff, no hollow compliments
- End with a clear call to action (e.g. "Would you be open to a 15-min call next week?")

Return ONLY the JSON object.`;

  try {
    const model = getGeminiClient(apiKey);
    const result = await model.generateContent(prompt);
    const { email } = safeParseJSON<{ email: string }>(result.response.text());
    return NextResponse.json({ email });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Email generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
