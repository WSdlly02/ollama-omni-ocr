export enum OcrStyle {
  TEXT = 't',
  MARKDOWN = 'md',
  LATEX = 'f',
  TABLE = 'table',
  JSON = 'json',
  DESC = 'desc'
}

export interface OcrOption {
  id: OcrStyle;
  label: string;
  description: string;
  iconName: string;
}

export interface OcrResult {
  text: string;
  style: OcrStyle;
  timestamp: number;
}
