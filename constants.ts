import { OcrOption, OcrStyle } from './types';

export const OCR_OPTIONS: OcrOption[] = [
  {
    id: OcrStyle.TEXT,
    label: 'Plain Text',
    description: 'Extract raw text directly.',
    iconName: 'Type',
  },
  {
    id: OcrStyle.MARKDOWN,
    label: 'Markdown',
    description: 'Preserve formatting (headers, lists).',
    iconName: 'FileText',
  },
  {
    id: OcrStyle.LATEX,
    label: 'Math / LaTeX',
    description: 'Convert formulas to LaTeX.',
    iconName: 'Sigma',
  },
  {
    id: OcrStyle.TABLE,
    label: 'Table',
    description: 'Convert grids to Markdown tables.',
    iconName: 'Table',
  },
  {
    id: OcrStyle.JSON,
    label: 'JSON',
    description: 'Structure data as JSON.',
    iconName: 'Braces',
  },
  {
    id: OcrStyle.DESC,
    label: 'Description',
    description: 'Detailed visual explanation.',
    iconName: 'Eye',
  },
];

export const STYLE_PROMPTS: Record<OcrStyle, string> = {
  [OcrStyle.TEXT]: "Extract all legible text from this image exactly as it appears. Do not add any conversational filler or markdown formatting unless it is part of the original text. Return only the raw string.",
  [OcrStyle.MARKDOWN]: "Analyze this image and transcribe the content into a well-structured Markdown document. Identify headers, lists, bold text, and code blocks. Return only the markdown content.",
  [OcrStyle.LATEX]: "Identify all mathematical expressions and formulas in this image. Transcribe them into valid LaTeX format. If there is surrounding text, include it as plain text mixed with the LaTeX. Return only the content.",
  [OcrStyle.TABLE]: "Detect any tables in this image. Transcribe them specifically using Markdown table syntax. If there is text outside the table, transcribe it as plain text. Return only the markdown.",
  [OcrStyle.JSON]: "Analyze the structured data in this image (such as receipts, forms, or key-value pairs). extract the information and format it as a valid, flat or nested JSON object. Use lowerCamelCase for keys. Return only the JSON string, no code blocks.",
  [OcrStyle.DESC]: "Provide a detailed and comprehensive textual description of this image. Describe the layout, colors, objects, text content visually, and any artistic style or context.",
};
