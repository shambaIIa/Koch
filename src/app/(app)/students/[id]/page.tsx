import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { isModuleEnabled } from "@/lib/modules";
import { totalNet, TRACK_LABELS, type Track } from "@/lib/yks";
import { severityRank } from "@/lib/rules";
import {
  deleteExamAction,
} from "@/actions/exams";
import {
  addTaskAction,
  toggleTaskAction,
  deleteTaskAction,
  addNoteAction,
  deleteNoteAction,
} from "@/actions/plan";
import { dismissSignalAction } from "@/actions/modules";
import {
  Card,
  CardHeader,
  LinkButton,
  Badge,
  StatTile,
  EmptyState,
  Button,
  Input,
} from "@/components/ui";
import { NetTrendChart, type TrendPoint } from "@/components/net-trend-chart";

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

function buildTrend(
  exams: { name: string; date: Date; type: string; subjects: { subject: string; net: number }[] }[],
  type: string
): { data: TrendPoint[]; subjects: string[] } {
  const filtered = exams
    .filter((e) => e.type === type)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const subjectSet = Array.from(
    new Set(filtered.flatMap((e) => e.subjects.map((s) => s.subject)))
  );
  const data: TrendPoint[] = filtered.map((e, i) => {
    const point: TrendPoint = {
      label: `${i + 1}`,
      total: totalNet(e.subjects),
    };
    for (const s of e.subjects) point[s.subject] = s.net;
    return point;
  });
  return { data, subjects: subjectSet };
}

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const student = await prisma.student.findFirst({
    where: { id, coachId: user.id },
    include: {
      exams: {
        include: { subjects: true },
        orderBy: { date: "desc" },
      },
      studyTasks: { orderBy: { createdAt: "desc" } },
      meetingNotes: { orderBy: { date: "desc" } },
      signals: { where: { status: "open" }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!student) notFound();

  const parentEnabled = await isModuleEnabled(user.id, "parent");

  const lastTyt = student.exams.find((e) => e.type === "TYT");
  const lastAyt = student.exams.find((e) => e.type === "AYT");
  const planTotal = student.studyTasks.length;
  const planDone = student.studyTasks.filter((t) => t.status === "done").length;
  const planPct = planTotal > 0 ? Math.round((planDone / planTotal) * 100) : 0;

  const sortedSignals = [...student.signals].sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity)
  );

  const tytTrend = buildTrend(student.exams, "TYT");
  const aytTrend = buildTrend(student.exams, "AYT");

  return (
    <div className="space-y-5">
      <LinkButton href="/students" variant="ghost">
        ← Öğrenciler
      </LinkButton>

      {/* Başlık */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{student.name}</h1>
          <p className="text-sm text-[var(--muted)] mt-0.5">
            {student.grade ? `${student.grade}. sınıf · ` : ""}
            {student.track ? TRACK_LABELS[student.track as Track] : "Alan belirtilmemiş"}
            {student.targetUniversity ? ` · 🎯 ${student.targetUniversity}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          {parentEnabled && (
            <LinkButton href={`/students/${student.id}/veli`} variant="secondary">
              Veli
            </LinkButton>
          )}
          <LinkButton href={`/students/${student.id}/edit`} variant="secondary">
            Düzenle
          </LinkButton>
          <LinkButton href={`/students/${student.id}/exams/new`}>
            + Deneme
          </LinkButton>
        </div>
      </div>

      {/* İstatistikler */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile
          label="Son TYT Net"
          value={lastTyt ? totalNet(lastTyt.subjects).toFixed(1) : "—"}
          hint={student.targetNetTyt ? `Hedef: ${student.targetNetTyt}` : undefined}
        />
        <StatTile
          label="Son AYT Net"
          value={lastAyt ? totalNet(lastAyt.subjects).toFixed(1) : "—"}
          hint={student.targetNetAyt ? `Hedef: ${student.targetNetAyt}` : undefined}
        />
        <StatTile label="Deneme Sayısı" value={student.exams.length} />
        <StatTile
          label="Plan Tamamlama"
          value={`%${planPct}`}
          hint={`${planDone}/${planTotal} görev`}
        />
      </div>

      {/* Görüşme Gündemi (kural motoru çıktısı) */}
      <Card>
        <CardHeader
          title="Görüşme Gündemi"
          subtitle="Kural motorunun ürettiği eyleme dönük sinyaller (YZ'siz)."
        />
        <div className="p-5">
          {sortedSignals.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">
              Açık sinyal yok. Deneme ve plan verisi ekledikçe gündem otomatik
              oluşur.
            </p>
          ) : (
            <ul className="space-y-3">
              {sortedSignals.map((s) => (
                <li
                  key={s.id}
                  className="flex items-start justify-between gap-3 border border-[var(--border)] rounded-lg p-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge tone={severityTone[s.severity]}>
                        {severityLabel[s.severity]}
                      </Badge>
                      <span className="font-medium text-sm">{s.title}</span>
                    </div>
                    <p className="text-sm text-[var(--muted)] mt-1">{s.message}</p>
                    {s.suggestedAction && (
                      <p className="text-sm mt-1.5">
                        <span className="font-medium">Öneri:</span>{" "}
                        {s.suggestedAction}
                      </p>
                    )}
                  </div>
                  <form action={dismissSignalAction.bind(null, s.id, student.id)}>
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

      {/* Analiz: trend grafikleri */}
      {(tytTrend.data.length >= 2 || aytTrend.data.length >= 2) && (
        <div className="grid lg:grid-cols-2 gap-4">
          {tytTrend.data.length >= 2 && (
            <Card>
              <CardHeader title="TYT Net Trendi" />
              <div className="p-4">
                <NetTrendChart data={tytTrend.data} subjects={tytTrend.subjects} />
              </div>
            </Card>
          )}
          {aytTrend.data.length >= 2 && (
            <Card>
              <CardHeader title="AYT Net Trendi" />
              <div className="p-4">
                <NetTrendChart data={aytTrend.data} subjects={aytTrend.subjects} />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Denemeler */}
      <Card>
        <CardHeader
          title="Denemeler"
          action={
            <LinkButton
              href={`/students/${student.id}/exams/new`}
              variant="secondary"
            >
              + Ekle
            </LinkButton>
          }
        />
        <div className="p-5">
          {student.exams.length === 0 ? (
            <EmptyState
              title="Deneme yok"
              description="İlk denemeyi gir; net analizi ve görüşme gündemi otomatik oluşsun."
            />
          ) : (
            <ul className="space-y-3">
              {student.exams.map((e) => (
                <li
                  key={e.id}
                  className="border border-[var(--border)] rounded-lg p-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {e.name}{" "}
                        <Badge tone="neutral">{e.type}</Badge>
                      </p>
                      <p className="text-xs text-[var(--muted)]">
                        {new Date(e.date).toLocaleDateString("tr-TR")}
                        {e.provider ? ` · ${e.provider}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[var(--primary)]">
                        {totalNet(e.subjects).toFixed(1)} net
                      </span>
                      <form
                        action={deleteExamAction.bind(null, student.id, e.id)}
                      >
                        <button
                          type="submit"
                          className="text-xs text-[var(--muted)] hover:text-red-600"
                        >
                          Sil
                        </button>
                      </form>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {e.subjects.map((s) => (
                      <span
                        key={s.id}
                        className="text-xs bg-slate-50 border border-[var(--border)] rounded px-2 py-1"
                      >
                        {s.subject}:{" "}
                        <span className="font-medium">{s.net.toFixed(1)}</span>
                        <span className="text-[var(--muted)]">
                          {" "}
                          ({s.correct}D {s.wrong}Y {s.blank}B)
                        </span>
                      </span>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Çalışma planı */}
        <Card>
          <CardHeader title="Çalışma Planı" subtitle={`%${planPct} tamamlandı`} />
          <div className="p-5 space-y-4">
            <form
              action={addTaskAction.bind(null, student.id)}
              className="flex gap-2"
            >
              <Input name="title" placeholder="Görev ekle…" required />
              <Input name="subject" placeholder="Ders" className="w-28" />
              <Button type="submit">Ekle</Button>
            </form>
            {student.studyTasks.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Henüz görev yok.</p>
            ) : (
              <ul className="space-y-2">
                {student.studyTasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between gap-2"
                  >
                    <form
                      action={toggleTaskAction.bind(null, student.id, t.id)}
                      className="flex items-center gap-2 min-w-0"
                    >
                      <button
                        type="submit"
                        className={`h-4 w-4 rounded border flex items-center justify-center text-[10px] ${
                          t.status === "done"
                            ? "bg-[var(--primary)] border-[var(--primary)] text-white"
                            : "border-slate-300"
                        }`}
                      >
                        {t.status === "done" ? "✓" : ""}
                      </button>
                      <span
                        className={`text-sm truncate ${
                          t.status === "done"
                            ? "line-through text-[var(--muted)]"
                            : ""
                        }`}
                      >
                        {t.title}
                        {t.subject ? (
                          <span className="text-[var(--muted)]"> · {t.subject}</span>
                        ) : null}
                      </span>
                    </form>
                    <form action={deleteTaskAction.bind(null, student.id, t.id)}>
                      <button
                        type="submit"
                        className="text-xs text-[var(--muted)] hover:text-red-600"
                      >
                        Sil
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>

        {/* Görüşme notları */}
        <Card>
          <CardHeader title="Görüşme Notları" />
          <div className="p-5 space-y-4">
            <form
              action={addNoteAction.bind(null, student.id)}
              className="space-y-2"
            >
              <Input name="summary" placeholder="Görüşme özeti…" required />
              <Input name="content" placeholder="Detay (opsiyonel)" />
              <Button type="submit">Not Ekle</Button>
            </form>
            {student.meetingNotes.length === 0 ? (
              <p className="text-sm text-[var(--muted)]">Henüz not yok.</p>
            ) : (
              <ul className="space-y-3">
                {student.meetingNotes.map((n) => (
                  <li
                    key={n.id}
                    className="border border-[var(--border)] rounded-lg p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{n.summary}</p>
                        {n.content && (
                          <p className="text-sm text-[var(--muted)] mt-0.5">
                            {n.content}
                          </p>
                        )}
                        <p className="text-xs text-[var(--muted)] mt-1">
                          {new Date(n.date).toLocaleDateString("tr-TR")}
                        </p>
                      </div>
                      <form
                        action={deleteNoteAction.bind(null, student.id, n.id)}
                      >
                        <button
                          type="submit"
                          className="text-xs text-[var(--muted)] hover:text-red-600"
                        >
                          Sil
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Tehlikeli alan</p>
            <p className="text-xs text-[var(--muted)]">
              Öğrenciyi ve tüm verilerini kalıcı olarak sil.
            </p>
          </div>
          <Link
            href={`/students/${student.id}/edit`}
            className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
          >
            Profili düzenle →
          </Link>
        </div>
      </Card>
    </div>
  );
}
