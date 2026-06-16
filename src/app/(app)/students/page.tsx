import Link from "next/link";
import { requireUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { totalNet } from "@/lib/yks";
import { TRACK_LABELS, type Track } from "@/lib/yks";
import {
  Card,
  EmptyState,
  LinkButton,
  Badge,
} from "@/components/ui";

export default async function StudentsPage() {
  const user = await requireUser();
  const students = await prisma.student.findMany({
    where: { coachId: user.id, archived: false },
    orderBy: { createdAt: "desc" },
    include: {
      exams: {
        include: { subjects: true },
        orderBy: { date: "desc" },
        take: 1,
      },
      signals: { where: { status: "open" } },
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Öğrenciler</h1>
          <p className="text-sm text-[var(--muted)]">
            {students.length} aktif öğrenci
          </p>
        </div>
        <LinkButton href="/students/new">+ Yeni Öğrenci</LinkButton>
      </div>

      {students.length === 0 ? (
        <Card>
          <EmptyState
            title="Henüz öğrenci yok"
            description="İlk öğrencini ekle, deneme girişiyle analiz ve görüşme gündemi otomatik oluşsun."
            action={<LinkButton href="/students/new">Öğrenci Ekle</LinkButton>}
          />
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {students.map((s) => {
            const last = s.exams[0];
            const lastNet = last ? totalNet(last.subjects) : null;
            const openSignals = s.signals.length;
            const highSignals = s.signals.filter(
              (x) => x.severity === "high"
            ).length;
            return (
              <Link key={s.id} href={`/students/${s.id}`}>
                <Card className="p-5 hover:shadow-md transition h-full">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold">{s.name}</p>
                      <p className="text-xs text-[var(--muted)]">
                        {s.grade ? `${s.grade}. ` : ""}
                        {s.track ? TRACK_LABELS[s.track as Track] : "—"}
                      </p>
                    </div>
                    {openSignals > 0 && (
                      <Badge tone={highSignals > 0 ? "high" : "medium"}>
                        {openSignals} sinyal
                      </Badge>
                    )}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-[var(--muted)]">Son deneme</span>
                    <span className="font-medium">
                      {last
                        ? `${last.type} · ${lastNet?.toFixed(1)} net`
                        : "—"}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
