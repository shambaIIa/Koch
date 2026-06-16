import Link from "next/link";
import { requireUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { totalNet } from "@/lib/yks";
import { severityRank } from "@/lib/rules";
import {
  Card,
  CardHeader,
  StatTile,
  LinkButton,
  Badge,
  EmptyState,
} from "@/components/ui";

const severityTone: Record<string, "high" | "medium" | "low" | "info"> = {
  high: "high",
  medium: "medium",
  low: "low",
  info: "info",
};

export default async function DashboardPage() {
  const user = await requireUser();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [studentCount, examsThisWeek, openSignals, recentExams] =
    await Promise.all([
      prisma.student.count({ where: { coachId: user.id, archived: false } }),
      prisma.exam.count({
        where: { coachId: user.id, date: { gte: weekAgo } },
      }),
      prisma.signal.findMany({
        where: { coachId: user.id, status: "open" },
        include: { student: { select: { id: true, name: true } } },
      }),
      prisma.exam.findMany({
        where: { coachId: user.id },
        include: {
          subjects: true,
          student: { select: { id: true, name: true } },
        },
        orderBy: { date: "desc" },
        take: 5,
      }),
    ]);

  const highCount = openSignals.filter((s) => s.severity === "high").length;
  const topSignals = [...openSignals]
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Merhaba, {user.name}</h1>
          <p className="text-sm text-[var(--muted)]">
            Koçluk panelinin güncel durumu.
          </p>
        </div>
        <LinkButton href="/students/new">+ Yeni Öğrenci</LinkButton>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="Öğrenci" value={studentCount} />
        <StatTile label="Bu hafta deneme" value={examsThisWeek} />
        <StatTile label="Açık sinyal" value={openSignals.length} />
        <StatTile
          label="Yüksek öncelik"
          value={highCount}
          hint="acil görüşme"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Gündem */}
        <Card>
          <CardHeader
            title="Öncelikli Gündem"
            action={
              <Link
                href="/agenda"
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Tümü
              </Link>
            }
          />
          <div className="p-5">
            {topSignals.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">
                Açık sinyal yok. Deneme girişiyle gündem otomatik oluşur.
              </p>
            ) : (
              <ul className="space-y-3">
                {topSignals.map((s) => (
                  <li key={s.id} className="flex items-start gap-2">
                    <Badge tone={severityTone[s.severity]}>
                      {s.severity === "high"
                        ? "!"
                        : s.severity === "medium"
                        ? "•"
                        : "·"}
                    </Badge>
                    <div className="min-w-0">
                      <Link
                        href={`/students/${s.student.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {s.student.name}
                      </Link>
                      <span className="text-sm"> · {s.title}</span>
                      {s.suggestedAction && (
                        <p className="text-xs text-[var(--muted)]">
                          {s.suggestedAction}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Son denemeler */}
        <Card>
          <CardHeader
            title="Son Denemeler"
            action={
              <Link
                href="/students"
                className="text-sm text-[var(--primary)] hover:underline"
              >
                Öğrenciler
              </Link>
            }
          />
          <div className="p-5">
            {recentExams.length === 0 ? (
              <EmptyState
                title="Henüz deneme yok"
                description="İlk öğrencini ekleyip deneme gir."
                action={
                  <LinkButton href="/students/new">Başla</LinkButton>
                }
              />
            ) : (
              <ul className="space-y-2">
                {recentExams.map((e) => (
                  <li
                    key={e.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <Link
                      href={`/students/${e.student.id}`}
                      className="font-medium hover:underline truncate"
                    >
                      {e.student.name}
                    </Link>
                    <span className="text-[var(--muted)] truncate px-2">
                      {e.name}
                    </span>
                    <span className="font-semibold whitespace-nowrap">
                      {e.type} · {totalNet(e.subjects).toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
