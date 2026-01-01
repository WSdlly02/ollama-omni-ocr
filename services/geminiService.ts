import { GoogleGenAI } from "@google/genai";
import { OcrStyle } from '../types';
import { STYLE_PROMPTS } from '../constants';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Helper to convert a File object to a Base64 string suitable for the API.
 */
const fileToPart = (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Performs OCR on the provided image file using the specified style.
 */
export const performOCR = async (file: File, style: OcrStyle): Promise<string> => {
  try {
    const imagePart = await fileToPart(file);
    const prompt = STYLE_PROMPTS[style];

    // Using gemini-3-flash-preview for speed and good vision capabilities on text tasks
    const model = 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [imagePart, { text: prompt }],
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No text generated from the model.");
    }
    
    // Clean up potential markdown code fences if the model adds them (often happens with JSON/Markdown requests)
    // We want to return the raw content for the user to copy.
    let cleanText = text.trim();
    
    // Simple heuristic to remove wrapping ```json ... ``` or ```markdown ... ``` if present
    if (cleanText.startsWith('```') && cleanText.endsWith('```')) {
        const firstLineBreak = cleanText.indexOf('\n');
        if (firstLineBreak !== -1) {
            cleanText = cleanText.substring(firstLineBreak + 1, cleanText.length - 3).trim();
        }
    }

    return cleanText;

  } catch (error) {
    console.error("Gemini OCR Error:", error);
    if (error instanceof Error) {
        throw new Error(`OCR Failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during recognition.");
  }
};
