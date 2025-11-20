import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StoryPage } from "../types";

// Initialize Gemini Client
// API Key is expected to be in process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Schema for a single page with choices
const pageSchema = {
  type: Type.OBJECT,
  properties: {
    text: { type: Type.STRING, description: "The story text for this page (2-3 sentences)." },
    imagePrompt: { type: Type.STRING, description: "A detailed prompt for an image generator for this page." },
    choices: { 
      type: Type.ARRAY, 
      items: { type: Type.STRING }, 
      description: "2 or 3 short choices for what happens next. If this is the end of the story, return an empty array." 
    },
    isEnding: { type: Type.BOOLEAN, description: "True if this is the final page of the story." }
  },
  required: ["text", "imagePrompt", "choices", "isEnding"]
};

// 1. Start Interactive Story
export const startInteractiveStory = async (topic: string): Promise<StoryPage> => {
  const prompt = `Start a children's story about: ${topic}. 
  Write the first page. Keep it simple and engaging.
  Provide 2 distinct choices for what the character should do next.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pageSchema
      }
    });
    
    const pageData = JSON.parse(response.text || "{}");
    return pageData as StoryPage;
  } catch (error) {
    console.error("Error starting story:", error);
    throw error;
  }
};

// 2. Continue Interactive Story
export const continueInteractiveStory = async (previousText: string, choice: string, pageCount: number): Promise<StoryPage> => {
  const isFinalPage = pageCount >= 4; // End around page 5
  
  const prompt = `
    Here is the last part of the story: "${previousText}".
    The user chose: "${choice}".
    Write the next page of the story based on this choice.
    ${isFinalPage ? "This should be the final page. Wrap up the story nicely. Do NOT provide choices." : "Provide 2 choices for what happens next."}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: pageSchema
      }
    });
    
    const pageData = JSON.parse(response.text || "{}");
    return pageData as StoryPage;
  } catch (error) {
    console.error("Error continuing story:", error);
    throw error;
  }
};

// 3. Generate Illustration
// Uses imagen-4.0-generate-001
export const generateIllustration = async (imagePrompt: string): Promise<string | null> => {
  try {
    // Enhance prompt for style consistency
    const finalPrompt = `children's book illustration, cute, vibrant colors, whimsical style, high quality: ${imagePrompt}`;
    
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: finalPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1', 
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const base64ImageBytes = response.generatedImages[0].image.imageBytes;
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    return null;
  } catch (error) {
    console.error("Error generating illustration:", error);
    throw error;
  }
};

// 4. Generate Speech (TTS)
// Uses gemini-2.5-flash-preview-tts
export const generateSpeech = async (text: string): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Puck' }, // Puck is a good, friendly voice
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64Audio || null;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

// 5. Chat Bot
// Uses gemini-3-pro-preview
export const sendChatMessage = async (history: {role: string, parts: {text: string}[]}[], newMessage: string): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      history: history,
      config: {
        systemInstruction: "You are a magical, friendly storybook companion named 'Sparkle'. You talk to children in a supportive, encouraging, and simple way. Keep answers relatively short.",
      }
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I didn't quite catch that, friend!";
  } catch (error) {
    console.error("Error in chat:", error);
    return "Oh no! I lost my train of thought. Can you say that again?";
  }
};

// 6. Guessing Game Logic
const gameRoundSchema = {
  type: Type.OBJECT,
  properties: {
    answer: { type: Type.STRING, description: "The animal or object being described." },
    clue: { type: Type.STRING, description: "A simple riddle clue describing the object without naming it." },
    imagePrompt: { type: Type.STRING, description: "Prompt to generate an image of the answer." }
  },
  required: ["answer", "clue", "imagePrompt"]
};

export const startGuessingGameRound = async (): Promise<{answer: string, clue: string, imagePrompt: string}> => {
  const prompt = `Create a simple riddle for a child. Pick a common animal, vehicle, or object. 
  Give a clue that describes it but doesn't name it.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: gameRoundSchema
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error starting game round:", error);
    throw error;
  }
};

const checkAnswerSchema = {
  type: Type.OBJECT,
  properties: {
    correct: { type: Type.BOOLEAN, description: "Whether the user's guess is correct." },
    feedback: { type: Type.STRING, description: "Friendly feedback to the child. If wrong, give a hint." }
  },
  required: ["correct", "feedback"]
};

export const checkGameAnswer = async (target: string, userGuess: string): Promise<{correct: boolean, feedback: string}> => {
  const prompt = `The answer is "${target}". The child guessed "${userGuess}". 
  Is this correct (or very close)? respond in JSON. If wrong, be encouraging and give a tiny hint.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: checkAnswerSchema
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error checking answer:", error);
    return { correct: false, feedback: "I'm having trouble hearing you, try again!" };
  }
};