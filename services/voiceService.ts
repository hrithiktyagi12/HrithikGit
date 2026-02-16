
import { GoogleGenAI, Modality } from "@google/genai";

// Native synthesis for low-latency combat sounds
export const shout = (text: string, pitch = 1) => {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.pitch = pitch;
  utterance.rate = 1.2;
  utterance.volume = 0.5;
  window.speechSynthesis.speak(utterance);
};

export const playGeminiVoice = async (text: string) => {
  try {
    // Create a new GoogleGenAI instance right before making an API call
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Say with intensity and style: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (base64Audio) {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      // Decode base64 to binary manually as per guidelines
      const binaryString = atob(base64Audio);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      const dataInt16 = new Int16Array(bytes.buffer);
      const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
      const channelData = buffer.getChannelData(0);
      for (let i = 0; i < dataInt16.length; i++) {
        channelData[i] = dataInt16[i] / 32768.0;
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.connect(audioContext.destination);
      source.start();
    }
  } catch (error) {
    console.warn("Gemini TTS failed, falling back to local synthesis");
    shout(text, 0.8);
  }
};
