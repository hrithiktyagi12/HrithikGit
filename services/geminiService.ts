
import { GoogleGenAI } from "@google/genai";

export interface GameStateContext {
  playerHP: number;
  opponentHP: number;
  distance: number;
  playerLastMoves: string[];
  opponentLastMoves: string[];
  round: number;
}

export const getAIStrategy = async (context: GameStateContext): Promise<{ strategy: string; level: number }> => {
  try {
    // Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Analyze this Tekken game state. 
        P1 HP: ${context.playerHP}, AI HP: ${context.opponentHP}, Distance: ${context.distance}.
        Recent P1 moves: ${context.playerLastMoves.join(', ')}.
        Provide:
        1. A one-word strategy (AGGRESSIVE, DEFENSIVE, BAIT, EVASIVE).
        2. A difficulty level (1-10) based on how well P1 is playing. 1 is easy, 10 is impossible.
        Format: STRATEGY,LEVEL
      `,
      config: {
        maxOutputTokens: 20,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });

    const parts = response.text.trim().split(',');
    const strategy = parts[0]?.toUpperCase() || 'NORMAL';
    const level = parseInt(parts[1]) || 5;
    
    return { strategy, level: Math.max(1, Math.min(10, level)) };
  } catch (error) {
    return { strategy: 'NORMAL', level: 5 };
  }
};

export const getCoachCommentary = async (context: GameStateContext): Promise<string> => {
  try {
    // Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `
        Pro Tekken coach advice (max 8 words).
        Player HP: ${context.playerHP}, CPU HP: ${context.opponentHP}.
        Action: P1 just used ${context.playerLastMoves.slice(-2).join(' then ')}.
      `,
      config: {
        maxOutputTokens: 40,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    return response.text.trim();
  } catch (error) {
    return "Keep your guard up!";
  }
};

export const getVictorySlogan = async (winnerName: string): Promise<string> => {
  try {
    // Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Generate a short, cool victory shout for ${winnerName}. Max 5 words.`,
      config: { maxOutputTokens: 20 }
    });
    return response.text.trim();
  } catch (error) {
    return "I am the champion!";
  }
};
