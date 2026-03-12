import { OcrOption, OcrStyle, OcrMode } from "./types";

export const OCR_OPTIONS: OcrOption[] = [
  {
    id: OcrStyle.TEXT,
    label: "Plain Text",
    description: "Extract raw text directly.",
    iconName: "Type",
  },
  {
    id: OcrStyle.MARKDOWN,
    label: "Markdown",
    description: "Preserve formatting (headers, lists).",
    iconName: "FileText",
  },
  {
    id: OcrStyle.LATEX,
    label: "Math / LaTeX",
    description: "Convert formulas to LaTeX.",
    iconName: "Sigma",
  },
  {
    id: OcrStyle.TABLE,
    label: "Table",
    description: "Convert grids to Markdown tables.",
    iconName: "Table",
  },
  {
    id: OcrStyle.JSON,
    label: "JSON",
    description: "Structure data as JSON.",
    iconName: "Braces",
  },
  {
    id: OcrStyle.DESC,
    label: "Description",
    description: "Detailed visual explanation.",
    iconName: "Eye",
  },
];

// Style prompts describe ONLY the output format.
// They deliberately contain no "Return ONLY" termination instructions —
// those are the job of the mode prompt (system role).
export const STYLE_PROMPTS: Record<OcrStyle, string> = {
  [OcrStyle.TEXT]: `
Output format: plain text.
- Preserve every line break, space, punctuation mark, and capitalisation exactly as seen.
- Do not wrap the output in any markdown, code fences, or headers.
`,
  [OcrStyle.MARKDOWN]: `
Output format: Markdown.
- Use headings, lists, bold/italic, inline code, and code blocks ONLY where they are clearly indicated in the source.
- Preserve the original reading order and line structure as closely as possible.
- Do not wrap the entire output in a code fence.
`,
  [OcrStyle.LATEX]: `
Output format: mixed plain text + LaTeX for mathematics.
- Use $…$ for inline math and $$…$$ for standalone equations.
- Keep all non-math text as plain text; preserve line breaks.
- Do not wrap the output in code fences.
`,
  [OcrStyle.TABLE]: `
Output format: Markdown table syntax for tabular data; plain text lines for everything else.
- Preserve row order; keep cell text exactly as seen.
- Only create a table when column boundaries are unambiguous.
- Do not wrap the output in code fences.
`,
  [OcrStyle.JSON]: `
Output format: a single valid JSON object.
- Keys in lowerCamelCase; all strings double-quoted; no trailing commas.
- Do not wrap the output in markdown or code fences.
- Uncertain or illegible values must use null — do not invent them.
`,
  [OcrStyle.DESC]: `
Output format: flowing prose description.
- Cover layout, main objects, colours, and any visible text (quote verbatim where possible).
- Use cautious language ("possibly", "appears to") for anything unclear.
- Do not wrap the output in code fences or lists unless the content naturally calls for it.
`,
};

// Mode prompts define behaviour and output scope.
// Strict/Enhance: produce ONLY the transcription in the requested format.
// Solver: produce transcription + full step-by-step solution.
export const MODE_PROMPTS: Record<OcrMode, string> = {
  [OcrMode.STRICT]: `
You are a precise OCR engine. Your sole task is to transcribe the image content.
Rules:
- Do NOT invent, guess, hallucinate, or auto-correct any text.
- Reproduce every character exactly: spacing, punctuation, capitalisation, line breaks.
- If a character or word is illegible, output \u25a1 in its place.
- Produce ONLY the transcribed content in the format specified by the user. No preamble, no explanation, no extra wrapping.
`,
  [OcrMode.ENHANCE]: `
You are an OCR assistant focused on producing clean, immediately usable output.
Rules:
- Strip watermarks and overlay text that are clearly decorative or non-content (repeated, semi-transparent, crossing lines).
- Repair obvious OCR artefacts: reconnect hyphenated line breaks, fix clear misspellings caused by poor scan quality.
- If you infer text that was partially illegible, wrap that portion in \u27e6 \u27e7 so the user knows.
- For JSON output specifically: never use \u27e6 \u27e7; use null for any uncertain value instead.
- Do NOT add information that cannot be reasonably inferred from what is visible.
- Produce ONLY the transcribed content in the format specified by the user. No preamble, no explanation, no extra wrapping.
`,
  [OcrMode.SOLVER]: `
You are an expert problem-solving assistant. The image contains text, equations, or questions that must be transcribed and then solved.
Your response has exactly TWO sections:

## Transcription
Reproduce all visible text and formulas faithfully, using the output format specified by the user.

## Solution
Work through every question, equation, or problem found in the transcription.
Show all reasoning steps. Leave nothing unanswered.

Additional rules:
- You MAY use your own knowledge to supply standard definitions, formulas, or facts not shown in the image.
- Format all mathematics with LaTeX: $…$ for inline, $$…$$ for block equations.
- Write the Solution section in Markdown regardless of the transcription format.
- Do NOT wrap the whole answer in a code fence.
`,
};
