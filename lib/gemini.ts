import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-2.5-flash-preview-04-17",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}
