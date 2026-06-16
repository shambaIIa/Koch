"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/guard";
import {
  setModuleEnabled,
  type SwitchableModuleKey,
} from "@/lib/modules";

export async function toggleModuleAction(
  key: SwitchableModuleKey,
  enabled: boolean
) {
  const user = await requireUser();
  await setModuleEnabled(user.id, key, enabled);
  revalidatePath("/settings");
}

// Görüşme gündemi: sinyal durumunu güncelle
export async function dismissSignalAction(signalId: string, studentId: string) {
  const user = await requireUser();
  await prisma.signal.updateMany({
    where: { id: signalId, coachId: user.id },
    data: { status: "dismissed" },
  });
  revalidatePath(`/students/${studentId}`);
  revalidatePath("/agenda");
  revalidatePath("/dashboard");
}
