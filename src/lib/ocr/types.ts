// ---- OCR kapalı döngü (Faz 3) — pluggable sağlayıcı arayüzü ----
// MVP: stub. Sonra VisionProvider (Google Cloud Vision), ardından özel OmrProvider.
// Akış: yükle → parse → düşük güven ise koç düzeltir → onayda deneme + kural motoru tetiklenir.

import type { ExamType } from "../yks";

export interface ParsedSubjectResult {
  subject: string;
  questionCount: number;
  correct: number;
  wrong: number;
  blank: number;
}

export interface ParsedExamResult {
  examType: ExamType;
  subjects: ParsedSubjectResult[];
  confidence: number; // 0..1
}

export interface OcrProvider {
  readonly name: string;
  parse(input: { imageBase64?: string; storageKey?: string; examType: ExamType }): Promise<ParsedExamResult>;
}

export const CONFIDENCE_REVIEW_THRESHOLD = 0.85;
