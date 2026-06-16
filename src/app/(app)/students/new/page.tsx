import { requireUser } from "@/lib/guard";
import { createStudentAction } from "@/actions/students";
import { Card, CardHeader, LinkButton } from "@/components/ui";
import { StudentForm } from "@/components/student-form";

export default async function NewStudentPage() {
  await requireUser();
  return (
    <div className="max-w-xl mx-auto space-y-4">
      <LinkButton href="/students" variant="ghost">
        ← Öğrenciler
      </LinkButton>
      <Card>
        <CardHeader
          title="Yeni Öğrenci"
          subtitle="Sade başlangıç: sadece ad zorunlu, gerisini sonra doldurabilirsin."
        />
        <div className="p-5">
          <StudentForm action={createStudentAction} submitLabel="Öğrenci Ekle" />
        </div>
      </Card>
    </div>
  );
}
