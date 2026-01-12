
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAnalysis } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeUrl = async (url: string): Promise<GeminiAnalysis> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze this URL: ${url}. 
      Provide a safety rating (0-100), 3 creative short aliases (3-8 chars), a category (e.g., Tech, Social, News), and a 1-sentence summary of what the link likely is.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safetyRating: { type: Type.NUMBER },
            suggestedAliases: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING } 
            },
            category: { type: Type.STRING },
            summary: { type: Type.STRING }
          },
          required: ["safetyRating", "suggestedAliases", "category", "summary"]
        }
      }
    });

    return JSON.parse(response.text.trim()) as GeminiAnalysis;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return {
      safetyRating: 80,
      suggestedAliases: ["link", "shorty", "go"],
      category: "General",
      summary: "A web link."
    };
  }
};
