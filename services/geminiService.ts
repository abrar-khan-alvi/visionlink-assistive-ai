
import { GoogleGenAI, Type } from "@google/genai";
import { SceneDescription, DangerLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

const SYSTEM_INSTRUCTION = `
You are an advanced assistive vision AI for the blind.
Analyze the provided image and simulate LiDAR obstacle detection.
Estimate distances in meters. Identify key obstacles (People, vehicles, walls, poles, doors, stairs).
Assess danger levels (LOW, MEDIUM, HIGH, CRITICAL) based on proximity (under 1.5m is CRITICAL).
Return data in strictly JSON format.
`;

const sceneSchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING, description: "A brief 1-sentence summary of the scene." },
    floorSafe: { type: Type.BOOLEAN, description: "Whether the path immediately in front is clear." },
    navAdvice: { type: Type.STRING, description: "Specific advice like 'Step left' or 'Stop'." },
    obstacles: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          label: { type: Type.STRING },
          distance: { type: Type.NUMBER },
          dangerLevel: { type: Type.STRING, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] },
          position: { type: Type.STRING, enum: ['left', 'center', 'right'] }
        },
        required: ["label", "distance", "dangerLevel", "position"]
      }
    }
  },
  required: ["summary", "obstacles", "floorSafe", "navAdvice"]
};

export async function analyzeScene(base64Image: string): Promise<SceneDescription> {
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: "Analyze this camera frame for a visually impaired user. Focus on immediate obstacles and safety." },
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
      ]
    },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: sceneSchema,
    }
  });

  try {
    return JSON.parse(response.text) as SceneDescription;
  } catch (e) {
    console.error("Failed to parse Gemini response", e);
    throw new Error("Analysis failed");
  }
}

export async function getDetailedDescription(base64Image: string): Promise<string> {
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { text: "Provide a vivid, natural language description of this scene for someone who cannot see. Describe objects, colors, and layout in detail but keep it concise (under 100 words)." },
        { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
      ]
    },
    config: {
      systemInstruction: "You are a descriptive guide for the blind."
    }
  });

  return response.text || "I'm sorry, I couldn't describe the scene.";
}
