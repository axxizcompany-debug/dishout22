
import { GoogleGenAI } from "@google/genai";
import { DishAnalysisResult, LocationData, GroundingChunk } from '../types';

export class AIService {
  private ai: GoogleGenAI;

  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async identifyDishAndFindPlaces(
    base64Image: string,
    mimeType: string,
    location?: LocationData
  ): Promise<DishAnalysisResult> {
    try {
      const prompt = `Identify this dish. Provide a catchy title and a brief flavor profile. 
      Then, find 3 highly-rated restaurants nearby that serve this specific dish or cuisine using the Google Maps tool.
      
      CRITICAL: For each restaurant, you MUST provide its official phone number in international format (e.g., +971...) and its website or map link.
      Format your response such that after the restaurant name, you include "Phone: [number]".`;

      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType,
              },
            },
            {
              text: prompt,
            },
          ],
        },
        config: {
          tools: [{ googleMaps: {} }],
          toolConfig: {
            retrievalConfig: {
              latLng: location ? {
                latitude: location.latitude,
                longitude: location.longitude,
              } : undefined
            }
          }
        },
      });

      const text = response.text || "I couldn't identify the dish.";
      
      // Basic text parsing for UI
      const lines = text.split('\n').filter(l => l.trim().length > 0);
      const dishName = lines[0]?.replace(/[*#]/g, '').trim() || "Unknown Dish";
      const description = lines.slice(1, 4).join(' ').trim() || "Delicious culinary creation identified.";

      // Extract native Google Maps grounding chunks
      const rawChunks: any[] = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

      // Enrich chunks with phone numbers extracted from the generated text
      const groundingChunks: GroundingChunk[] = rawChunks.map((chunk: any) => {
        if (chunk.maps?.title) {
          const title = chunk.maps.title;
          // Look for the title in the text to find the nearby phone number
          const titleIndex = text.indexOf(title);
          if (titleIndex !== -1) {
            // Scan 300 characters after the title for a phone pattern
            const snippet = text.slice(titleIndex, titleIndex + 400);
            // Regex for international phone numbers or standard phone formats
            const phoneMatch = snippet.match(/Phone:\s*([+\d\s()-]{8,})/i) || snippet.match(/(\+\d{1,3}[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/);
            
            if (phoneMatch && phoneMatch[1]) {
              return {
                ...chunk,
                maps: {
                  ...chunk.maps,
                  phoneNumber: phoneMatch[1].trim()
                }
              };
            }
          }
        }
        return chunk;
      });

      return {
        dishName,
        description,
        groundingChunks,
        rawText: text
      };

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error("Failed to analyze dish. Please ensure your API_KEY is a valid Google Gemini key.");
    }
  }
}
