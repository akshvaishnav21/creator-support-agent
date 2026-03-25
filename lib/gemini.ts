import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-3-flash-preview",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}
