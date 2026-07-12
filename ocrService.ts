import OpenAI from "openai";
import type { ChatCompletionCreateParamsStreaming } from "openai/resources/chat/completions";
import { OcrStyle, OcrMode } from "./types";
import { STYLE_PROMPTS, MODE_PROMPTS } from "./constants";
import { removeThinkingBlocks } from "./ocrTextFilter";

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
 * Helper to convert a File object to a complete data URL. Keeping the browser-
 * supplied MIME type avoids labelling PNG/WebP input as JPEG.
 */
const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Could not encode the selected image."));
        return;
      }
      resolve(reader.result);
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
  signal?: AbortSignal,
): Promise<string> => {
  try {
    if (!file.type.startsWith("image/")) {
      throw new Error("The selected file is not a supported image.");
    }

    if (file.size === 0) {
      throw new Error("The selected image is empty.");
    }

    const imageDataUrl = await fileToDataUrl(file);

    const cleanBaseUrl = baseUrl.replace(/\/$/, "");

    const openai = new OpenAI({
      baseURL: cleanBaseUrl,
      apiKey: "ollama",
      dangerouslyAllowBrowser: true,
    });

    const params = MODE_PARAMS[mode];

    const request: ChatCompletionCreateParamsStreaming & {
      extra_body: typeof params.extra_body;
    } = {
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
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      temperature: params.temperature,
      max_tokens: params.max_tokens,
      stream: true,
      extra_body: params.extra_body,
    };

    const stream = await openai.chat.completions.create(request, { signal });

    let fullText = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      fullText += content;

      const displayText = removeThinkingBlocks(fullText);

      if (onUpdate) {
        onUpdate(displayText);
      }
    }

    return removeThinkingBlocks(fullText);
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    console.error("Ollama OCR Error:", error);
    if (error instanceof Error) {
      throw new Error(`OCR Failed: ${error.message}`);
    }
    throw new Error("An unexpected error occurred during recognition.");
  }
};
