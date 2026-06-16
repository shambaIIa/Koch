import { notFound } from "next/navigation";
import { requireUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { createExamAction } from "@/actions/exams";
import { Card, CardHeader, LinkButton } from "@/components/ui";
import { ExamForm } from "@/components/exam-form";

export default async function NewExamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: { id, coachId: user.id },
    select: { id: true, name: true },
  });
  if (!student) notFound();

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <LinkButton href={`/students/${student.id}`} variant="ghost">
        ← {student.name}
      </LinkButton>
      <Card>
        <CardHeader
          title="Deneme Girişi"
          subtitle="Doğru/yanlış gir, net otomatik hesaplanır. Kayıtta analiz ve gündem güncellenir."
        />
        <div className="p-5">
          <ExamForm studentId={student.id} action={createExamAction} />
        </div>
      </Card>
    </div>
  );
}
