import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient } from "@/lib/gemini";
import { safeParseJSON, truncate, INPUT_LIMITS } from "@/lib/api-utils";
import type { CommentAnalysis } from "@/lib/types";

const SYSTEM_PROMPT = `You are an expert audience research analyst specializing in YouTube creator analytics and community intelligence.

Analyze the provided YouTube comments and return a JSON object with this exact structure:
{
  "topicClusters": [
    {
      "topic": "string (clear topic name)",
      "commentCount": "number (estimated count of comments about this topic)",
      "sentiment": "string (one of: 'positive', 'negative', 'mixed')",
      "keyQuotes": ["array of 2-3 representative short quotes from the comments"]
    }
  ],
  "sentimentBreakdown": {
    "positive": "number (percentage 0-100)",
    "negative": "number (percentage 0-100)",
    "neutral": "number (percentage 0-100)"
  },
  "futureVideoIdeas": [
    {
      "title": "string (compelling YouTube video title)",
      "evidenceQuotes": ["array of 1-2 quotes from comments requesting/implying this topic"],
      "demandScore": "number 1-10 (how strongly the audience wants this)"
    }
  ],
  "topComplaints": [
    {
      "complaint": "string (what the audience is frustrated about)",
      "frequency": "string (e.g. 'mentioned by ~30% of commenters')"
    }
  ],
  "appreciationHighlights": ["array of 3 strings describing what the audience loves most"],
  "summaryInsight": "string (2-3 sentences executive summary for the creator)"
}

Return 3-6 topic clusters, exactly 5 future video ideas, exactly 3 top complaints, and exactly 3 appreciation highlights.
The sentimentBreakdown percentages must sum to 100.
Return only the JSON object, nothing else.`;

export async function POST(req: NextRequest) {
  const { apiKey, comments } = await req.json();

  if (!apiKey) {
    return NextResponse.json(
      { error: "Gemini API key required" },
      { status: 401 }
    );
  }

  if (!comments?.trim()) {
    return NextResponse.json(
      { error: "Comments are required" },
      { status: 400 }
    );
  }

  const safeComments = truncate(comments, INPUT_LIMITS.comments);

  try {
    const model = getGeminiClient(apiKey);
    const prompt =
      SYSTEM_PROMPT +
      "\n\n---\n\nYOUTUBE COMMENTS TO ANALYZE:\n\n" +
      safeComments.trim() +
      "\n\nReturn the JSON analysis.";

    const result = await model.generateContent(prompt);
    const analysis = safeParseJSON<CommentAnalysis>(result.response.text());
    return NextResponse.json({ analysis });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
