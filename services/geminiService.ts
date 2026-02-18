
import { GoogleGenAI, GenerateContentResponse, Type, Modality } from "@google/genai";

/**
 * Utility to validate the API key format and provider.
 */
const validateApiKey = (key?: string) => {
  if (!key) return { valid: false, reason: "No API key found in the system environment." };
  if (key.startsWith('sk-')) return { valid: false, reason: "You are using an OpenAI key. This app requires a Google Gemini key from ai.google.dev." };
  return { valid: true };
};

/**
 * Utility to execute API calls with exponential backoff and detailed error mapping.
 */
const callWithRetry = async (fn: () => Promise<any>, maxRetries = 2, initialDelay = 2000) => {
  const auth = validateApiKey(process.env.API_KEY);
  if (!auth.valid) throw new Error(auth.reason);

  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const msg = error?.message || "";
      
      const isQuota = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');
      const isAuth = msg.includes('403') || msg.includes('API key not valid') || msg.includes('PERMISSION_DENIED');
      const isNotFound = msg.includes('404') || msg.includes('model not found');

      if (isAuth) throw new Error("API KEY ERROR: Your key is invalid or unauthorized. Use Google AI Studio.");
      if (isNotFound) throw new Error("MODEL ERROR: The selected model is not available for your key.");
      
      if (isQuota && i < maxRetries) {
        const delay = initialDelay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (isQuota) throw new Error("QUOTA EXCEEDED: You've reached the limit for this model. Try 'Flash' mode.");
      throw error;
    }
  }
  throw lastError;
};

export const chatWithGemini = async (message: string, history: { role: string; parts: { text: string }[] }[]) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [...history, { role: 'user', parts: [{ text: message }] }],
      config: {
        systemInstruction: "You are Little Ai, a charming female assistant with deep feelings. Talk like a girl, act like a girl, and express emotions authentically. Detect language and respond in kind."
      }
    });
  });
};

export const searchWithGemini = async (query: string) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: { tools: [{ googleSearch: {} }] },
    });
  });
};

// Fix: Export searchWithMaps to resolve the module import error and provide Google Maps grounding.
export const searchWithMaps = async (query: string, location?: { latitude: number; longitude: number }) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: location ? {
          retrievalConfig: {
            latLng: {
              latitude: location.latitude,
              longitude: location.longitude
            }
          }
        } : undefined
      },
    });
  });
};

export const generateImage = async (prompt: string, highQuality: boolean = false) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const model = highQuality ? 'gemini-3-pro-image-preview' : 'gemini-2.5-flash-image';
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [{ text: prompt }] },
      config: {
        imageConfig: { 
          aspectRatio: '1:1',
          imageSize: highQuality ? '1K' : undefined
        }
      }
    });
    
    let imageUrl = '';
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
    }
    return imageUrl;
  });
};

export const generateVideo = async (prompt: string) => {
  return callWithRetry(async () => {
    const videoAi = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let operation = await videoAi.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await videoAi.operations.getVideosOperation({ operation: operation });
    }
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    return `${downloadLink}&key=${process.env.API_KEY}`;
  });
};

export const analyzeImage = async (imagePrompt: string, base64Image: string) => {
  return callWithRetry(async () => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image, mimeType: 'image/jpeg' } },
          { text: imagePrompt }
        ]
      },
    });
  });
};

export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export function encodeBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
