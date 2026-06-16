"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import { evaluateStudent } from "@/lib/rules";

async function owns(coachId: string, studentId: string) {
  const s = await prisma.student.findFirst({
    where: { id: studentId, coachId },
    select: { id: true },
  });
  return Boolean(s);
}

export async function addTaskAction(studentId: string, formData: FormData) {
  const user = await requireUser();
  if (!(await owns(user.id, studentId))) return;
  const title = String(formData.get("title") || "").trim();
  if (!title) return;
  const subject = String(formData.get("subject") || "").trim() || null;
  const dueStr = String(formData.get("dueDate") || "");

  await prisma.studyTask.create({
    data: {
      coachId: user.id,
      studentId,
      title,
      subject,
      dueDate: dueStr ? new Date(dueStr) : null,
    },
  });
  await evaluateStudent(user.id, studentId);
  revalidatePath(`/students/${studentId}`);
}

export async function toggleTaskAction(studentId: string, taskId: string) {
  const user = await requireUser();
  if (!(await owns(user.id, studentId))) return;
  const task = await prisma.studyTask.findFirst({
    where: { id: taskId, coachId: user.id },
  });
  if (!task) return;
  const done = task.status !== "done";
  await prisma.studyTask.update({
    where: { id: taskId },
    data: { status: done ? "done" : "pending", completedAt: done ? new Date() : null },
  });
  await evaluateStudent(user.id, studentId);
  revalidatePath(`/students/${studentId}`);
}

export async function deleteTaskAction(studentId: string, taskId: string) {
  const user = await requireUser();
  if (!(await owns(user.id, studentId))) return;
  await prisma.studyTask.deleteMany({ where: { id: taskId, coachId: user.id } });
  await evaluateStudent(user.id, studentId);
  revalidatePath(`/students/${studentId}`);
}

export async function addNoteAction(studentId: string, formData: FormData) {
  const user = await requireUser();
  if (!(await owns(user.id, studentId))) return;
  const summary = String(formData.get("summary") || "").trim();
  if (!summary) return;
  const content = String(formData.get("content") || "").trim() || null;
  await prisma.meetingNote.create({
    data: { coachId: user.id, studentId, summary, content },
  });
  revalidatePath(`/students/${studentId}`);
}

export async function deleteNoteAction(studentId: string, noteId: string) {
  const user = await requireUser();
  if (!(await owns(user.id, studentId))) return;
  await prisma.meetingNote.deleteMany({ where: { id: noteId, coachId: user.id } });
  revalidatePath(`/students/${studentId}`);
}
