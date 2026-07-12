export type Theme = "system" | "light" | "dark";

export interface OllamaSettings {
  baseUrl: string;
  model: string;
  theme: Theme;
}

export interface SettingsValidationResult {
  value: OllamaSettings | null;
  errors: {
    baseUrl?: string;
    model?: string;
  };
}

const isSupportedBaseUrl = (value: string): boolean => {
  if (value.startsWith("/") && !value.startsWith("//")) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

export const validateOllamaSettings = (
  settings: OllamaSettings,
): SettingsValidationResult => {
  const baseUrl = settings.baseUrl.trim();
  const model = settings.model.trim();
  const errors: SettingsValidationResult["errors"] = {};

  if (!baseUrl) {
    errors.baseUrl = "Base URL is required.";
  } else if (!isSupportedBaseUrl(baseUrl)) {
    errors.baseUrl = "Use an http(s) URL or a same-origin path beginning with /.";
  }

  if (!model) {
    errors.model = "Model name is required.";
  }

  if (errors.baseUrl || errors.model) {
    return { value: null, errors };
  }

  return {
    value: { baseUrl, model, theme: settings.theme },
    errors,
  };
};
