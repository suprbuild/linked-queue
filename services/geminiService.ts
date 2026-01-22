
import { GoogleGenAI, Type } from "@google/genai";
import { GeneratedVariant, Tone, ProfileAuditResult } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateLinkedInPosts = async (
  topic: string,
  tone: Tone,
  length: 'Short' | 'Medium' | 'Long',
  instructions: string
): Promise<GeneratedVariant[]> => {
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
      model: 'gemini-3-flash-preview',
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
                  headline: { type: Type.STRING },
                  content: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
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

export const auditLinkedInProfile = async (headline: string, about: string): Promise<ProfileAuditResult> => {
  const prompt = `
    Analyze this LinkedIn Personal Brand profile:
    Headline: "${headline}"
    About Section: "${about}"
    
    Evaluate it for personal branding impact. Be critical but constructive.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            analysis: {
              type: Type.OBJECT,
              properties: {
                clarity: { type: Type.STRING },
                keywords: { type: Type.STRING },
                cta: { type: Type.STRING },
                impact: { type: Type.STRING }
              },
              required: ["clarity", "keywords", "cta", "impact"]
            },
            suggestions: {
              type: Type.OBJECT,
              properties: {
                headlines: { type: Type.ARRAY, items: { type: Type.STRING } },
                about_intro: { type: Type.STRING }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Audit Error:", error);
    throw error;
  }
};

export const generatePostImage = async (topic: string): Promise<string> => {
  const prompt = `A professional, minimalist, high-quality flat illustration for a LinkedIn post about: ${topic}. 
  Modern colors, corporate but artistic style, clean lines, no text.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [{ text: prompt }],
      config: {
        imageConfig: {
          aspectRatio: "16:9",
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data found in response");
  } catch (error) {
    console.error("Image Generation Error:", error);
    throw error;
  }
};
