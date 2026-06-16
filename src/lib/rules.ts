import { prisma } from "./prisma";
import { totalNet } from "./yks";

// ---- Kural motoru (YZ'siz, deklaratif) ----
// Öğrencinin deneme geçmişi + plan tamamlama + hedeflerinden eyleme dönük sinyaller üretir.
// Sinyaller "görüşme gündemi" kaynağıdır. dedupeKey ile tek açık sinyal garanti edilir.

export type Severity = "info" | "low" | "medium" | "high";

export interface SignalCandidate {
  type: string;
  scope: "subject" | "overall" | "behavioral";
  severity: Severity;
  title: string;
  message: string;
  suggestedAction?: string;
  payload?: Record<string, unknown>;
  dedupeKey: string;
}

// Eşikler — ileride koç bazında ayarlanabilir (config-driven niyeti).
const THRESHOLDS = {
  netDeclineDrop: 3, // net düşüşü eşiği
  netImproveGain: 3,
  highBlankRatio: 0.25,
  volatilityStd: 6,
  targetGap: 8,
  planCompletionLow: 0.5,
  dataGapDays: 21,
};

function std(values: number[]): number {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance =
    values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

type ExamWithSubjects = {
  id: string;
  type: string;
  date: Date;
  subjects: { subject: string; questionCount: number; net: number; correct: number; wrong: number; blank: number }[];
};

export function computeSignals(input: {
  exams: ExamWithSubjects[];
  planCompletionRate: number;
  planTaskCount: number;
  targetNetTyt: number | null;
  targetNetAyt: number | null;
}): SignalCandidate[] {
  const { exams, planCompletionRate, planTaskCount, targetNetTyt, targetNetAyt } =
    input;
  const candidates: SignalCandidate[] = [];

  // Tarihe göre artan sırala
  const sorted = [...exams].sort((a, b) => a.date.getTime() - b.date.getTime());
  if (sorted.length === 0) return candidates;

  const latest = sorted[sorted.length - 1];

  // 9. Veri boşluğu (behavioral)
  const daysSince = Math.floor(
    (Date.now() - latest.date.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (daysSince > THRESHOLDS.dataGapDays) {
    candidates.push({
      type: "data_gap",
      scope: "behavioral",
      severity: "low",
      title: "Uzun süredir deneme yok",
      message: `Son deneme ${daysSince} gün önce girildi. Analiz güncelliği için yeni deneme önerilir.`,
      suggestedAction: "Bu hafta bir deneme planla ve sonucu sisteme gir.",
      dedupeKey: "data_gap",
    });
  }

  // Ders bazlı sinyaller — son denemelerden subject seti
  const subjects = Array.from(
    new Set(sorted.flatMap((e) => e.subjects.map((s) => s.subject)))
  );

  const subjectTrend: Record<string, number> = {};

  for (const subject of subjects) {
    // bu derse ait netler (denemeye göre)
    const series = sorted
      .map((e) => e.subjects.find((s) => s.subject === subject))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    if (series.length === 0) continue;

    const nets = series.map((s) => s.net);
    const last3 = nets.slice(-3);
    const trend = last3.length >= 2 ? last3[last3.length - 1] - last3[0] : 0;
    subjectTrend[subject] = trend;

    // 1. Net düşüş trendi
    if (last3.length >= 2 && trend <= -THRESHOLDS.netDeclineDrop) {
      candidates.push({
        type: "net_decline",
        scope: "subject",
        severity: trend <= -6 ? "high" : "medium",
        title: `${subject}: net düşüşü`,
        message: `${subject} son ${last3.length} denemede ${Math.abs(
          trend
        ).toFixed(1)} net düştü.`,
        suggestedAction: `${subject} için son denemedeki yanlış konuları görüşmede ele al; tekrar planı çıkar.`,
        payload: { subject, trend, nets: last3 },
        dedupeKey: `net_decline:${subject}`,
      });
    }

    // 2. Net yükseliş (pozitif pekiştirme)
    if (last3.length >= 2 && trend >= THRESHOLDS.netImproveGain) {
      candidates.push({
        type: "net_improve",
        scope: "subject",
        severity: "info",
        title: `${subject}: net yükselişi`,
        message: `${subject} son ${last3.length} denemede ${trend.toFixed(
          1
        )} net arttı. Pozitif pekiştir.`,
        suggestedAction: `${subject}'teki ilerlemeyi görüşmede takdir et; ivmeyi koru.`,
        payload: { subject, trend, nets: last3 },
        dedupeKey: `net_improve:${subject}`,
      });
    }

    // En güncel deneme bu derste var mı?
    const latestSub = latest.subjects.find((s) => s.subject === subject);
    if (latestSub && latestSub.questionCount > 0) {
      const blankRatio = latestSub.blank / latestSub.questionCount;
      // 3. Yüksek boş oranı
      if (blankRatio > THRESHOLDS.highBlankRatio) {
        candidates.push({
          type: "high_blank",
          scope: "subject",
          severity: blankRatio > 0.4 ? "high" : "medium",
          title: `${subject}: yüksek boş oranı`,
          message: `${subject} son denemede %${Math.round(
            blankRatio * 100
          )} boş. Bilgi eksiği veya zaman yönetimi sinyali.`,
          suggestedAction: `${subject} için eksik konu mu, hız mı belirle; soru çözüm temposu çalışması ekle.`,
          payload: { subject, blankRatio, blank: latestSub.blank },
          dedupeKey: `high_blank:${subject}`,
        });
      }

      // 4. Yüksek yanlış oranı (dikkat/hız)
      if (
        latestSub.wrong > latestSub.correct &&
        latestSub.net < latestSub.questionCount * 0.3
      ) {
        candidates.push({
          type: "high_wrong",
          scope: "subject",
          severity: "medium",
          title: `${subject}: yanlış > doğru`,
          message: `${subject} son denemede yanlış sayısı doğruyu geçti ve net düşük. Dikkat/hız veya eksik konu.`,
          suggestedAction: `${subject} yanlışlarını birlikte analiz et; dikkat hatası mı konu eksiği mi ayrıştır.`,
          payload: {
            subject,
            wrong: latestSub.wrong,
            correct: latestSub.correct,
          },
          dedupeKey: `high_wrong:${subject}`,
        });
      }
    }

    // 5. Dalgalanma / tutarsızlık
    if (nets.length >= 3) {
      const sd = std(nets.slice(-4));
      if (sd > THRESHOLDS.volatilityStd) {
        candidates.push({
          type: "volatility",
          scope: "subject",
          severity: "low",
          title: `${subject}: tutarsız performans`,
          message: `${subject} netleri dalgalı (sapma ${sd.toFixed(
            1
          )}). İstikrar çalışması gerekebilir.`,
          suggestedAction: `${subject} için düzenli tekrar ve sabit deneme rutini öner.`,
          payload: { subject, std: sd },
          dedupeKey: `volatility:${subject}`,
        });
      }
    }
  }

  // 6. Hedef-gerçek farkı (overall)
  const last3Exams = sorted.slice(-3);
  const tytExams = last3Exams.filter((e) => e.type === "TYT");
  const aytExams = last3Exams.filter((e) => e.type === "AYT");

  function avgTotal(exs: ExamWithSubjects[]): number | null {
    if (exs.length === 0) return null;
    const totals = exs.map((e) => totalNet(e.subjects));
    return totals.reduce((a, b) => a + b, 0) / totals.length;
  }

  const avgTyt = avgTotal(tytExams);
  if (targetNetTyt != null && avgTyt != null) {
    const gap = targetNetTyt - avgTyt;
    if (gap > THRESHOLDS.targetGap) {
      candidates.push({
        type: "target_gap",
        scope: "overall",
        severity: gap > 20 ? "high" : "medium",
        title: "TYT hedefinin gerisinde",
        message: `TYT ortalaması (${avgTyt.toFixed(
          1
        )}) hedeften (${targetNetTyt}) ${gap.toFixed(1)} net geride.`,
        suggestedAction:
          "Hedefe giden ders bazlı ara hedefler koy; en yüksek getirili dersi önceliklendir.",
        payload: { target: targetNetTyt, avg: avgTyt, gap },
        dedupeKey: "target_gap:TYT",
      });
    }
  }
  const avgAyt = avgTotal(aytExams);
  if (targetNetAyt != null && avgAyt != null) {
    const gap = targetNetAyt - avgAyt;
    if (gap > THRESHOLDS.targetGap) {
      candidates.push({
        type: "target_gap",
        scope: "overall",
        severity: gap > 20 ? "high" : "medium",
        title: "AYT hedefinin gerisinde",
        message: `AYT ortalaması (${avgAyt.toFixed(
          1
        )}) hedeften (${targetNetAyt}) ${gap.toFixed(1)} net geride.`,
        suggestedAction:
          "AYT alan derslerinde zayıf konulara yoğunlaş; haftalık net hedefi belirle.",
        payload: { target: targetNetAyt, avg: avgAyt, gap },
        dedupeKey: "target_gap:AYT",
      });
    }
  }

  // 7. Plan-performans kopukluğu (behavioral)
  const overallTrend =
    sorted.length >= 2
      ? totalNet(latest.subjects) - totalNet(sorted[Math.max(0, sorted.length - 3)].subjects)
      : 0;
  if (
    planTaskCount > 0 &&
    planCompletionRate < THRESHOLDS.planCompletionLow &&
    overallTrend < 0
  ) {
    candidates.push({
      type: "plan_gap",
      scope: "behavioral",
      severity: "high",
      title: "Plan uyumu düşük + net düşüşü",
      message: `Çalışma planı tamamlama %${Math.round(
        planCompletionRate * 100
      )} ve genel net düşüyor. Plan-performans kopukluğu.`,
      suggestedAction:
        "Planı gerçekçi boyuta küçült; tamamlanan görevle net ilişkisini öğrenciyle konuş.",
      payload: { planCompletionRate, overallTrend },
      dedupeKey: "plan_gap",
    });
  }

  // 10. Branş dengesi (overall) — bir ders yükselirken diğeri düşüyor
  const rising = Object.entries(subjectTrend).filter(([, t]) => t >= THRESHOLDS.netImproveGain);
  const falling = Object.entries(subjectTrend).filter(([, t]) => t <= -THRESHOLDS.netDeclineDrop);
  if (rising.length > 0 && falling.length > 0) {
    candidates.push({
      type: "balance",
      scope: "overall",
      severity: "low",
      title: "Branş dengesi bozuluyor",
      message: `${rising[0][0]} yükselirken ${falling[0][0]} düşüyor. Odak dengesini gözden geçir.`,
      suggestedAction:
        "Çalışma süresini branşlar arasında yeniden dağıt; ihmal edilen derse zaman ayır.",
      payload: { rising: rising.map((r) => r[0]), falling: falling.map((f) => f[0]) },
      dedupeKey: "balance",
    });
  }

  return candidates;
}

const SEVERITY_RANK: Record<Severity, number> = {
  high: 3,
  medium: 2,
  low: 1,
  info: 0,
};

export function severityRank(s: string): number {
  return SEVERITY_RANK[(s as Severity)] ?? 0;
}

// Öğrenci için sinyalleri hesapla ve veritabanını senkronize et.
export async function evaluateStudent(coachId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, coachId },
    include: {
      exams: { include: { subjects: true }, orderBy: { date: "asc" } },
      studyTasks: true,
    },
  });
  if (!student) return;

  const planTaskCount = student.studyTasks.length;
  const planDone = student.studyTasks.filter((t) => t.status === "done").length;
  const planCompletionRate = planTaskCount > 0 ? planDone / planTaskCount : 0;

  const candidates = computeSignals({
    exams: student.exams.map((e) => ({
      id: e.id,
      type: e.type,
      date: e.date,
      subjects: e.subjects.map((s) => ({
        subject: s.subject,
        questionCount: s.questionCount,
        net: s.net,
        correct: s.correct,
        wrong: s.wrong,
        blank: s.blank,
      })),
    })),
    planCompletionRate,
    planTaskCount,
    targetNetTyt: student.targetNetTyt,
    targetNetAyt: student.targetNetAyt,
  });

  const candidateKeys = new Set(candidates.map((c) => c.dedupeKey));

  // Upsert aday sinyaller
  for (const c of candidates) {
    await prisma.signal.upsert({
      where: { studentId_dedupeKey: { studentId, dedupeKey: c.dedupeKey } },
      create: {
        coachId,
        studentId,
        type: c.type,
        scope: c.scope,
        severity: c.severity,
        title: c.title,
        message: c.message,
        suggestedAction: c.suggestedAction,
        payload: c.payload ? JSON.stringify(c.payload) : null,
        dedupeKey: c.dedupeKey,
        status: "open",
      },
      update: {
        type: c.type,
        scope: c.scope,
        severity: c.severity,
        title: c.title,
        message: c.message,
        suggestedAction: c.suggestedAction,
        payload: c.payload ? JSON.stringify(c.payload) : null,
        // Kullanıcı elle kapattıysa (dismissed) tekrar açma; sadece açık olanları güncel tut.
      },
    });
  }

  // Artık geçerli olmayan açık sinyalleri "resolved" yap.
  const openSignals = await prisma.signal.findMany({
    where: { studentId, status: "open" },
  });
  for (const s of openSignals) {
    if (!candidateKeys.has(s.dedupeKey)) {
      await prisma.signal.update({
        where: { id: s.id },
        data: { status: "resolved" },
      });
    }
  }
}
