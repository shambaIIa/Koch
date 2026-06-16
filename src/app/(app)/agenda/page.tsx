import Link from "next/link";
import { requireUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { severityRank } from "@/lib/rules";
import { dismissSignalAction } from "@/actions/modules";
import { Card, CardHeader, Badge, Button, EmptyState } from "@/components/ui";

const severityTone: Record<string, "high" | "medium" | "low" | "info"> = {
  high: "high",
  medium: "medium",
  low: "low",
  info: "info",
};
const severityLabel: Record<string, string> = {
  high: "Yüksek",
  medium: "Orta",
  low: "Düşük",
  info: "Olumlu",
};

export default async function AgendaPage() {
  const user = await requireUser();
  const signals = await prisma.signal.findMany({
    where: { coachId: user.id, status: "open" },
    include: { student: { select: { id: true, name: true } } },
  });

  const sorted = signals.sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity)
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Görüşme Gündemi</h1>
        <p className="text-sm text-[var(--muted)]">
          Tüm öğrencilerden gelen açık sinyaller, önceliğe göre.
        </p>
      </div>

      <Card>
        <CardHeader title={`${sorted.length} açık sinyal`} />
        <div className="p-5">
          {sorted.length === 0 ? (
            <EmptyState
              title="Gündem boş"
              description="Deneme ve plan verisi girdikçe kural motoru burada öncelikli aksiyonları toplar."
            />
          ) : (
            <ul className="space-y-3">
              {sorted.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-3 border border-[var(--border)] rounded-lg p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone={severityTone[s.severity]}>
                        {severityLabel[s.severity]}
                      </Badge>
                      <Link
                        href={`/students/${s.student.id}`}
                        className="text-sm font-medium text-[var(--primary)] hover:underline"
                      >
                        {s.student.name}
                      </Link>
                      <span className="text-sm font-medium">· {s.title}</span>
                    </div>
                    <p className="text-sm text-[var(--muted)] mt-1">
                      {s.message}
                    </p>
                    {s.suggestedAction && (
                      <p className="text-sm mt-1.5">
                        <span className="font-medium">Öneri:</span>{" "}
                        {s.suggestedAction}
                      </p>
                    )}
                  </div>
                  <form
                    action={dismissSignalAction.bind(null, s.id, s.student.id)}
                  >
                    <Button variant="ghost" type="submit" className="shrink-0">
                      Kapat
                    </Button>
                  </form>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}
