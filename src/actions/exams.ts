"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { calcNet, type ExamType } from "@/lib/yks";
import { evaluateStudent } from "@/lib/rules";

async function assertOwnership(coachId: string, studentId: string) {
  const owned = await prisma.student.findFirst({
    where: { id: studentId, coachId },
    select: { id: true },
  });
  return Boolean(owned);
}

// Deneme manuel girişi: her ders için D/Y/B → net otomatik.
export async function createExamAction(studentId: string, formData: FormData) {
  const user = await requireUser();
  if (!(await assertOwnership(user.id, studentId))) {
    return { error: "Öğrenci bulunamadı." };
  }

  const name = String(formData.get("name") || "").trim();
  const type = String(formData.get("type") || "TYT") as ExamType;
  const provider = String(formData.get("provider") || "").trim();
  const dateStr = String(formData.get("date") || "");
  const subjectsRaw = String(formData.get("subjects") || "[]");

  if (!name) return { error: "Deneme adı gerekli." };

  let subjects: { subject: string; questionCount: number }[] = [];
  try {
    subjects = JSON.parse(subjectsRaw);
  } catch {
    return { error: "Ders verisi okunamadı." };
  }

  const subjectData = subjects.map((s) => {
    const correct = Number(formData.get(`correct_${s.subject}`) || 0);
    const wrong = Number(formData.get(`wrong_${s.subject}`) || 0);
    const answered = correct + wrong;
    const blank = Math.max(0, s.questionCount - answered);
    return {
      subject: s.subject,
      questionCount: s.questionCount,
      correct,
      wrong,
      blank,
      net: calcNet(correct, wrong),
    };
  });

  // Doğrulama: cevaplanan soru toplam soruyu aşmasın
  for (const s of subjectData) {
    if (s.correct + s.wrong > s.questionCount) {
      return {
        error: `${s.subject}: doğru + yanlış (${
          s.correct + s.wrong
        }) soru sayısını (${s.questionCount}) aşamaz.`,
      };
    }
  }

  await prisma.exam.create({
    data: {
      coachId: user.id,
      studentId,
      name,
      type,
      provider: provider || null,
      date: dateStr ? new Date(dateStr) : new Date(),
      subjects: { create: subjectData },
    },
  });

  // Kapalı döngü: deneme girildi → kural motoru → görüşme gündemi güncellenir.
  await evaluateStudent(user.id, studentId);

  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function deleteExamAction(studentId: string, examId: string) {
  const user = await requireUser();
  if (!(await assertOwnership(user.id, studentId))) return;
  await prisma.exam.deleteMany({ where: { id: examId, coachId: user.id } });
  await evaluateStudent(user.id, studentId);
  revalidatePath(`/students/${studentId}`);
}
