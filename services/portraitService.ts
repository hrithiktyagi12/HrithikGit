
import { GoogleGenAI } from "@google/genai";

export const generateFighterPortrait = async (fighterName: string, description: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `A cinematic, high-detail character portrait of a Tekken-style fighting game candidate named ${fighterName}. ${description}. 3D render, Unreal Engine 5 style, dramatic lighting, intense gaze, professional martial arts attire, dark background with neon highlights.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Portrait Generation Failed:", error);
    // Return a high-quality placeholder from a CDN if generation fails
    return `https://picsum.photos/seed/${fighterName}/512/512?grayscale`;
  }
};
