import { prisma } from "./prisma";
import { totalNet } from "./yks";

// ---- Veli modülü: nötr özet üretimi ----
// Kural: veli net/hata kırılımı/görüşme notu GÖRMEZ. Sadece "çalıştı mı / gidişat".
// MVP: sadece itme (push) — ayrı login yok. Üç seviyeli görünürlük kontrolü uygulanır.

export type TrendLabel = "yükseliş" | "stabil" | "dikkat";

function trendFromNets(totals: number[]): TrendLabel {
  if (totals.length < 2) return "stabil";
  const delta = totals[totals.length - 1] - totals[0];
  if (delta >= 3) return "yükseliş";
  if (delta <= -3) return "dikkat";
  return "stabil";
}

export interface ParentSummaryData {
  studentName: string;
  periodStart: Date;
  periodEnd: Date;
  planProgressText: string | null;
  examParticipationText: string | null;
  trendText: string | null;
  content: string;
}

// Öğrencinin son 7 günündeki nötr özetini üretir. Net sayıları metne girmez.
export async function buildWeeklySummary(
  studentId: string
): Promise<ParentSummaryData | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId },
    include: {
      parentVisibility: true,
      exams: { include: { subjects: true }, orderBy: { date: "desc" }, take: 5 },
      studyTasks: true,
    },
  });
  if (!student) return null;

  const vis = student.parentVisibility;
  // Hesap + öğrenci seviyesi kontrol
  if (vis && (!vis.accountEnabled || !vis.shareEnabled)) return null;

  const now = new Date();
  const periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  // İçerik seviyesi kontrolleri
  let planProgressText: string | null = null;
  if (!vis || vis.showPlanProgress) {
    const total = student.studyTasks.length;
    const done = student.studyTasks.filter((t) => t.status === "done").length;
    if (total > 0) {
      const pct = Math.round((done / total) * 100);
      const word = pct >= 70 ? "büyük ölçüde tamamlandı" : pct >= 40 ? "kısmen ilerledi" : "geride kaldı";
      planProgressText = `Bu hafta çalışma planı ${word}.`;
    } else {
      planProgressText = "Bu hafta için tanımlı çalışma planı bulunmuyor.";
    }
  }

  let examParticipationText: string | null = null;
  const recentExams = student.exams.filter((e) => e.date >= periodStart);
  if (!vis || vis.showExamParticipation) {
    if (recentExams.length > 0) {
      examParticipationText = `Bu hafta ${recentExams.length} denemeye katıldı.`;
    } else {
      examParticipationText = "Bu hafta deneme kaydı bulunmuyor.";
    }
  }

  let trendText: string | null = null;
  if (!vis || vis.showTrend) {
    const totals = [...student.exams]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map((e) => totalNet(e.subjects));
    const label = trendFromNets(totals.slice(-3));
    trendText = `Genel gidişat: ${label}.`;
  }

  const parts = [planProgressText, examParticipationText, trendText].filter(
    Boolean
  ) as string[];
  const content =
    parts.length > 0
      ? `Sayın veli, ${student.name} için haftalık özet: ${parts.join(" ")}`
      : `Sayın veli, bu hafta paylaşılacak güncelleme bulunmuyor.`;

  return {
    studentName: student.name,
    periodStart,
    periodEnd: now,
    planProgressText,
    examParticipationText,
    trendText,
    content,
  };
}
