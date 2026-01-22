
import { GeneratedVariant, Tone } from '../types';

export const generateLinkedInPostsDeepSeek = async (
  apiKey: string,
  topic: string,
  tone: Tone,
  length: 'Short' | 'Medium' | 'Long',
  instructions: string
): Promise<GeneratedVariant[]> => {
  if (!apiKey) {
    throw new Error("DeepSeek API Key is missing.");
  }

  const cleanKey = apiKey.trim();

  const systemPrompt = `
    You are an expert LinkedIn ghostwriter. 
    You must output JSON only.
    Create 3 distinct variants of a LinkedIn post.
    Structure the response as a JSON object with a key "variants" containing an array of objects.
    Each object must have:
    - "id": string (unique id like "1", "2")
    - "headline": string (A catchy 1-line summary/hook)
    - "content": string (The full post content with emojis and hashtags)
  `;

  const userPrompt = `
    Topic: "${topic}"
    Tone: ${tone}
    Length: ${length}
    Additional Instructions: ${instructions}
    
    Make them engaging, use short paragraphs, and include 3-5 relevant hashtags.
  `;

  try {
    // We use corsproxy.io to bypass browser CORS restrictions for this client-side integration.
    // In production, use a backend proxy or Supabase Edge Function.
    const proxyUrl = 'https://corsproxy.io/?';
    const targetUrl = 'https://api.deepseek.com/chat/completions';
    
    const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cleanKey}`
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7
      })
    });

    if (!response.ok) {
      let errorMessage = "DeepSeek API failed";
      try {
        const errData = await response.json();
        errorMessage = errData.error?.message || errorMessage;
      } catch (e) {
        // failed to parse json error, use status text
        errorMessage = `HTTP ${response.status} ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    let contentString = data.choices[0].message.content;
    
    // Sanitize markdown code blocks if present
    contentString = contentString.replace(/^```json\s*/, '').replace(/^```\s*/, '').replace(/\s*```$/, '');

    const parsed = JSON.parse(contentString);

    // Map response to internal GeneratedVariant type
    return (parsed.variants || []).map((v: any) => ({
      variant_id: v.id,
      content: v.content,
      headline: v.headline,
      tone: tone,
      length: length
    }));

  } catch (error: any) {
    console.error("DeepSeek Generation Error:", error);
    throw new Error(error.message || "Failed to generate content");
  }
};
