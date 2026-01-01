import { OcrStyle } from './types';
import { STYLE_PROMPTS } from './constants';

/**
 * Helper to convert a File object to a Base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve(base64String);
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
    const base64Image = await fileToBase64(file);
    const prompt = STYLE_PROMPTS[style];

    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "qwen3-vl:8b",
        prompt: prompt,
        images: [base64Image],
        think: false,
        stream: false,
        options: {
          temperature: 0,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const text = data.response;

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
    console.error("Ollama OCR Error:", error);
    if (error instanceof Error) {
        throw new Error(`OCR Failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during recognition.");
  }
};