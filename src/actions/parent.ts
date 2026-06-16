"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { buildWeeklySummary } from "@/lib/parent";

async function owns(coachId: string, studentId: string) {
  const s = await prisma.student.findFirst({
    where: { id: studentId, coachId },
    select: { id: true },
  });
  return Boolean(s);
}

export async function updateParentVisibilityAction(
  studentId: string,
  formData: FormData
) {
  const user = await requireUser();
  if (!(await owns(user.id, studentId))) return;

  const data = {
    accountEnabled: formData.get("accountEnabled") === "on",
    shareEnabled: formData.get("shareEnabled") === "on",
    showPlanProgress: formData.get("showPlanProgress") === "on",
    showExamParticipation: formData.get("showExamParticipation") === "on",
    showTrend: formData.get("showTrend") === "on",
  };

  await prisma.parentVisibility.upsert({
    where: { studentId },
    create: { studentId, ...data },
    update: data,
  });
  revalidatePath(`/students/${studentId}/veli`);
}

export async function saveParentContactAction(
  studentId: string,
  formData: FormData
) {
  const user = await requireUser();
  if (!(await owns(user.id, studentId))) return;
  const name = String(formData.get("parentName") || "").trim();
  const contactEmail = String(formData.get("contactEmail") || "").trim() || null;
  if (!name) return;
  await prisma.parent.upsert({
    where: { studentId },
    create: { studentId, name, contactEmail },
    update: { name, contactEmail },
  });
  revalidatePath(`/students/${studentId}/veli`);
}

// Haftalık nötr özeti üret ve kaydet (push modeli simülasyonu).
export async function generateWeeklySummaryAction(studentId: string) {
  const user = await requireUser();
  if (!(await owns(user.id, studentId))) return;
  const summary = await buildWeeklySummary(studentId);
  if (!summary) return;
  await prisma.weeklySummary.create({
    data: {
      studentId,
      periodStart: summary.periodStart,
      periodEnd: summary.periodEnd,
      content: summary.content,
      sentAt: new Date(),
    },
  });
  revalidatePath(`/students/${studentId}/veli`);
}
