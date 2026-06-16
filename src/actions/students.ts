"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { evaluateStudent } from "@/lib/rules";

const studentSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter"),
  grade: z.string().optional(),
  track: z.string().optional(),
  targetUniversity: z.string().optional(),
  targetNetTyt: z.string().optional(),
  targetNetAyt: z.string().optional(),
  notes: z.string().optional(),
});

function parseNum(v?: string): number | null {
  if (!v || v.trim() === "") return null;
  const n = Number(v.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function createStudentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = studentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }
  const d = parsed.data;
  const student = await prisma.student.create({
    data: {
      coachId: user.id,
      name: d.name,
      grade: d.grade || null,
      track: d.track || null,
      targetUniversity: d.targetUniversity || null,
      targetNetTyt: parseNum(d.targetNetTyt),
      targetNetAyt: parseNum(d.targetNetAyt),
      notes: d.notes || null,
    },
  });
  // Veli görünürlük varsayılanı (modül kapalı olsa da hazır dursun)
  await prisma.parentVisibility.create({ data: { studentId: student.id } });

  revalidatePath("/students");
  redirect(`/students/${student.id}`);
}

export async function updateStudentAction(studentId: string, formData: FormData) {
  const user = await requireUser();
  const owned = await prisma.student.findFirst({
    where: { id: studentId, coachId: user.id },
    select: { id: true },
  });
  if (!owned) return { error: "Öğrenci bulunamadı." };

  const parsed = studentSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  await prisma.student.update({
    where: { id: studentId },
    data: {
      name: d.name,
      grade: d.grade || null,
      track: d.track || null,
      targetUniversity: d.targetUniversity || null,
      targetNetTyt: parseNum(d.targetNetTyt),
      targetNetAyt: parseNum(d.targetNetAyt),
      notes: d.notes || null,
    },
  });
  await evaluateStudent(user.id, studentId);
  revalidatePath(`/students/${studentId}`);
  redirect(`/students/${studentId}`);
}

export async function deleteStudentAction(studentId: string) {
  const user = await requireUser();
  await prisma.student.deleteMany({
    where: { id: studentId, coachId: user.id },
  });
  revalidatePath("/students");
  redirect("/students");
}
