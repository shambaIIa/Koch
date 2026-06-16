// YKS alan adı sabitleri (sadece YKS — karar A)

export type ExamType = "TYT" | "AYT";

export type Track = "sayisal" | "esit" | "sozel" | "dil";

export const TRACK_LABELS: Record<Track, string> = {
  sayisal: "Sayısal",
  esit: "Eşit Ağırlık",
  sozel: "Sözel",
  dil: "Dil",
};

export interface SubjectTemplate {
  subject: string;
  questionCount: number;
}

// Deneme tipine göre varsayılan ders şablonları
export const EXAM_TEMPLATES: Record<ExamType, SubjectTemplate[]> = {
  TYT: [
    { subject: "Türkçe", questionCount: 40 },
    { subject: "Sosyal Bilimler", questionCount: 20 },
    { subject: "Temel Matematik", questionCount: 40 },
    { subject: "Fen Bilimleri", questionCount: 20 },
  ],
  AYT: [
    { subject: "Matematik", questionCount: 40 },
    { subject: "Fen Bilimleri", questionCount: 40 },
    { subject: "Edebiyat-Sosyal-1", questionCount: 40 },
    { subject: "Sosyal Bilimler-2", questionCount: 40 },
  ],
};

// YKS net = doğru - yanlış/4
export function calcNet(correct: number, wrong: number): number {
  const net = correct - wrong / 4;
  return Math.round(net * 100) / 100;
}

export function totalNet(subjects: { net: number }[]): number {
  const sum = subjects.reduce((acc, s) => acc + s.net, 0);
  return Math.round(sum * 100) / 100;
}
