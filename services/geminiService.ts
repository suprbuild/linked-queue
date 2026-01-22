import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedVariant, Tone } from '../types';

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateLinkedInPosts = async (
  topic: string,
  tone: Tone,
  length: 'Short' | 'Medium' | 'Long',
  instructions: string
): Promise<GeneratedVariant[]> => {
  if (!apiKey) {
    console.error("API Key is missing.");
    return [
      { 
        variant_id: '1', 
        content: `(Mock) Here is a ${tone} post about ${topic}. #LinkedInOut`, 
        headline: `${topic} Insights`,
        tone,
        length
      },
      { 
        variant_id: '2', 
        content: `(Mock) Another perspective on ${topic}. Ideally this comes from Gemini!`, 
        headline: `Re-thinking ${topic}`,
        tone,
        length
      }
    ];
  }

  const prompt = `
    You are an expert LinkedIn ghostwriter. Write a LinkedIn post about: "${topic}".
    Tone: ${tone}.
    Length: ${length}.
    Additional Instructions: ${instructions}.
    
    Create 3 distinct variants.
    Make them engaging, use short paragraphs, and include 3-5 relevant hashtags.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variants: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  headline: { type: Type.STRING, description: "A catchy 1-line summary/hook" },
                  content: { type: Type.STRING, description: "The full post content with emojis and hashtags" }
                }
              }
            }
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("No content generated");

    const parsed = JSON.parse(jsonText);
    
    // Map response to internal GeneratedVariant type
    return (parsed.variants || []).map((v: any) => ({
      variant_id: v.id,
      content: v.content,
      headline: v.headline,
      tone: tone,
      length: length
    }));

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};