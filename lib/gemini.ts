import { GoogleGenerativeAI } from "@google/generative-ai";

export function getGeminiClient(apiKey: string) {
  return new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-2.0-flash",
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
}
