import type { OcrProvider, ParsedExamResult } from "./types";
import { EXAM_TEMPLATES, calcNet } from "../yks";

// Stub sağlayıcı: gerçek OCR yerine düşük güvenli, düzenlenebilir bir taslak üretir.
// Faz 3'te VisionProvider ile değiştirilir; arayüz aynı kalır (kapalı döngü mimarisi).
export class StubOcrProvider implements OcrProvider {
  readonly name = "stub";

  async parse(input: {
    examType: "TYT" | "AYT";
  }): Promise<ParsedExamResult> {
    const template = EXAM_TEMPLATES[input.examType];
    const subjects = template.map((t) => ({
      subject: t.subject,
      questionCount: t.questionCount,
      correct: 0,
      wrong: 0,
      blank: t.questionCount,
    }));
    // Düşük güven → her zaman koç düzeltmesine düşer (MVP davranışı)
    return {
      examType: input.examType,
      subjects,
      confidence: 0.4,
    };
  }
}

// Not: VisionProvider (Faz 3) eklenince burada seçilecek.
export function getOcrProvider(): OcrProvider {
  // const provider = process.env.OCR_PROVIDER;
  // if (provider === "vision") return new VisionOcrProvider();
  return new StubOcrProvider();
}

export { calcNet };
