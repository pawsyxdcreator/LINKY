
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiAnalysis, LinkData } from "../types";

// Obtenemos la API Key de forma segura
const getApiKey = () => {
  try {
    // Verificamos si process existe para evitar crashes en hosting estático
    return (typeof process !== 'undefined' && process.env?.API_KEY) ? process.env.API_KEY : "";
  } catch {
    return "";
  }
};

const ai = new GoogleGenAI({ apiKey: getApiKey() });

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

export const createLinkyChat = (links: LinkData[]) => {
  const linksContext = links.map(l => `- ${l.originalUrl} (Code: ${l.shortCode}, Category: ${l.category})`).join('\n');
  
  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `You are Linky AI, the premium assistant for the LINKY URL shortener. 
      Your goal is to help users manage their links, suggest marketing strategies, and analyze their digital presence.
      
      User's current links:\n${linksContext || 'No links created yet.'}
      
      Be professional, helpful, and concise. Use emojis occasionally. Use Markdown for formatting.`,
    },
  });
};
