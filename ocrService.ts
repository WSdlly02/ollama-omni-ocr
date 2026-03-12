import OpenAI from "openai";
import { OcrStyle, OcrMode } from "./types";
import { STYLE_PROMPTS, MODE_PROMPTS } from "./constants";

const MODE_PARAMS = {
  [OcrMode.STRICT]: {
    temperature: 0.1,
    max_tokens: 16384,
    extra_body: {
      think: false,
      options: {
        seed: 42,
        num_ctx: 16384,
        repeat_penalty: 1.1,
        top_k: 20,
        top_p: 0.8,
        min_p: 0,
      },
    },
  },
  [OcrMode.ENHANCE]: {
    temperature: 0.7,
    max_tokens: 16384,
    extra_body: {
      think: false,
      options: {
        seed: 42,
        num_ctx: 16384,
        repeat_penalty: 1.1,
        top_k: 40,
        top_p: 0.9,
        min_p: 0.05,
      },
    },
  },
  [OcrMode.SOLVER]: {
    temperature: 0.6,
    max_tokens: 32768,
    extra_body: {
      think: true, // enable chain-of-thought for problem solving
      options: {
        seed: undefined,
        num_ctx: 32768,
        repeat_penalty: 1.05,
        top_k: 50,
        top_p: 0.95,
        min_p: 0.02,
      },
    },
  },
};

/**
 * Helper to convert a File object to a Base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(",")[1];
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

/**
 * Performs OCR on the provided image file using the specified style.
 * Supports streaming output via the onUpdate callback.
 */
export const performOCR = async (
  file: File,
  baseUrl: string = `${window.location.origin}/ollama/v1`,
  model: string = "qwen3-vl:8b-instruct",
  style: OcrStyle,
  mode: OcrMode,
  onUpdate?: (text: string) => void,
): Promise<string> => {
  try {
    const base64Image = await fileToBase64(file);

    const cleanBaseUrl = baseUrl.replace(/\/$/, "");

    const openai = new OpenAI({
      baseURL: cleanBaseUrl,
      apiKey: "ollama",
      dangerouslyAllowBrowser: true,
    });

    const params = MODE_PARAMS[mode];

    // @ts-ignore - Using any to allow extra_body and streaming parameters for Ollama
    const stream = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: MODE_PROMPTS[mode].trim(), // system prompt based on mode
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: STYLE_PROMPTS[style].trim(),
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: params.temperature,
      max_tokens: params.max_tokens,
      stream: true,
      extra_body: params.extra_body,
    });

    let fullText = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullText += content;

      // Clean up thinking tags
      let displayText = fullText
        .replace(/<think>[\s\S]*?<\/think>/g, "")
        .trimStart();

      if (onUpdate) {
        onUpdate(displayText);
      }
    }

    // Final cleanup
    // Removed code block stripping. Only stripping think tags.
    let cleanText = fullText.replace(/<think>[\s\S]*?<\/think>/g, "").trim();

    return cleanText;
  } catch (error) {
    console.error("Ollama OCR Error:", error);
    if (error instanceof Error) {
      throw new Error(`OCR Failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during recognition.");
  }
};
