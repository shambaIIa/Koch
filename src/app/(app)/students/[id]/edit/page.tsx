import { notFound } from "next/navigation";
import { requireUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { updateStudentAction, deleteStudentAction } from "@/actions/students";
import { Card, CardHeader, LinkButton, Button } from "@/components/ui";
import { StudentForm } from "@/components/student-form";

export default async function EditStudentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: { id, coachId: user.id },
  });
  if (!student) notFound();

  const update = updateStudentAction.bind(null, student.id);
  const remove = deleteStudentAction.bind(null, student.id);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <LinkButton href={`/students/${student.id}`} variant="ghost">
        ← {student.name}
      </LinkButton>
      <Card>
        <CardHeader title="Profili Düzenle" />
        <div className="p-5">
          <StudentForm
            action={update}
            submitLabel="Kaydet"
            initial={{
              name: student.name,
              grade: student.grade,
              track: student.track,
              targetUniversity: student.targetUniversity,
              targetNetTyt: student.targetNetTyt,
              targetNetAyt: student.targetNetAyt,
              notes: student.notes,
            }}
          />
        </div>
      </Card>

      <Card className="p-5 border-red-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-red-700">Öğrenciyi sil</p>
            <p className="text-xs text-[var(--muted)]">
              Tüm denemeler, plan ve notlar kalıcı olarak silinir.
            </p>
          </div>
          <form action={remove}>
            <Button variant="danger" type="submit">
              Sil
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
