import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import type { BrandContactResult } from "@/lib/types";

export async function POST(req: NextRequest) {
  const { apiKey, brands } = await req.json();

  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key required" }, { status: 401 });
  }

  if (!Array.isArray(brands) || brands.length === 0 || brands.length > 10) {
    return NextResponse.json({ error: "brands must be a non-empty array of up to 10 names" }, { status: 400 });
  }

  // Cannot use getGeminiClient() here — it hardcodes responseMimeType: "application/json"
  // which is incompatible with grounding tools. Instantiate directly.
  const searchModel = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-2.0-flash",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    tools: [{ googleSearchRetrieval: {} } as any],
  });

  const results: BrandContactResult[] = await Promise.all(
    brands.map(async (brandName: string): Promise<BrandContactResult> => {
      try {
        const result = await searchModel.generateContent(
          `Find the official sponsorship or creator partnership page for ${brandName}, and their business contact or inquiries page.`
        );

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const chunks: any[] =
          (result.response.candidates?.[0] as any)?.groundingMetadata
            ?.groundingChunks ?? [];

        const urls: string[] = chunks
          .map((c: any) => c?.web?.uri)
          .filter((u: unknown): u is string => typeof u === "string");

        const sponsorshipUrl =
          urls.find((u) => /creator|partner|sponsor|advertis|brand/i.test(u)) ??
          urls[0] ??
          null;

        const contactUrl =
          urls.find((u) => /contact|inquir|business/i.test(u)) ?? null;

        return { brandName, sponsorshipUrl, contactUrl, searchStatus: "found" };
      } catch {
        return { brandName, sponsorshipUrl: null, contactUrl: null, searchStatus: "error" };
      }
    })
  );

  return NextResponse.json({ results });
}
