import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  const { message, apiKey } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key required" }, { status: 401 });
  }

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction:
      "You are a helpful support agent for YouTube creators. Help them with content strategy, analytics, audience growth, monetization, and any other creator-related questions.",
  });

  const result = await model.generateContent(message);
  const text = result.response.text();

  return NextResponse.json({ reply: text });
}
