import { GoogleGenAI } from "@google/genai";
import { DishAnalysisResult, LocationData, GroundingChunk } from '../types';
import { PROMPTS } from '../constants';

export class GeminiService {
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
      const model = 'gemini-2.5-flash';
      
      const parts: any[] = [
        {
          inlineData: {
            mimeType: mimeType,
            data: base64Image
          }
        },
        {
          text: PROMPTS.IDENTIFY_DISH
        }
      ];

      // Configuration for Maps Grounding
      const tools: any[] = [{ googleMaps: {} }];
      
      let toolConfig = undefined;
      if (location) {
        toolConfig = {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        };
      }

      const response = await this.ai.models.generateContent({
        model,
        contents: { parts },
        config: {
          tools,
          toolConfig
        }
      });

      const text = response.text || "I couldn't identify the dish or find places.";
      
      // Parse out a potential title (first line)
      const lines = text.split('\n');
      const dishName = lines[0].replace(/[*#]/g, '').trim();
      const description = lines.slice(1).join('\n').trim();

      // Extract Grounding Chunks (Maps Data)
      const rawGroundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      
      // Enrich chunks with phone numbers extracted from text
      const groundingChunks: GroundingChunk[] = rawGroundingChunks.map((chunk: any) => {
        if (chunk.maps?.title) {
          // Look for the title in the text, then scan the subsequent text for a phone number
          const titleIndex = text.indexOf(chunk.maps.title);
          if (titleIndex !== -1) {
            // Look ahead 300 characters for a phone pattern
            const snippet = text.slice(titleIndex, titleIndex + 300);
            const phoneMatch = snippet.match(/Phone:\s*([+\d\s()-]+)/i);
            
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
      throw new Error("Failed to analyze dish. Please check your API key and connection.");
    }
  }
}