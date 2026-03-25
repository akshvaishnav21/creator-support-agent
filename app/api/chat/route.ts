import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { GEMINI_MODEL } from "@/lib/gemini";
import { truncate, INPUT_LIMITS } from "@/lib/api-utils";

export async function POST(req: NextRequest) {
  const { message, apiKey } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key required" }, { status: 401 });
  }

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const safeMessage = truncate(message, INPUT_LIMITS.message);

  try {
    const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
      model: GEMINI_MODEL,
      systemInstruction:
        "You are a helpful support agent for YouTube creators. Help them with content strategy, analytics, audience growth, monetization, and any other creator-related questions.",
    });

    const result = await model.generateContent(safeMessage);
    const text = result.response.text();

    return NextResponse.json({ reply: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Chat failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
