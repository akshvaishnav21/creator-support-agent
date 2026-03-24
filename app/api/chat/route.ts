import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@/lib/anthropic";

// TODO: implement streaming response
export async function POST(req: NextRequest) {
  const { message } = await req.json();

  if (!message) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system:
      "You are a helpful support agent for YouTube creators. Help them with content strategy, analytics, audience growth, monetization, and any other creator-related questions.",
    messages: [{ role: "user", content: message }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  return NextResponse.json({ reply: text });
}
