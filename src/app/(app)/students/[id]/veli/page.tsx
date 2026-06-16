import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { isModuleEnabled } from "@/lib/modules";
import { buildWeeklySummary } from "@/lib/parent";
import {
  updateParentVisibilityAction,
  saveParentContactAction,
  generateWeeklySummaryAction,
} from "@/actions/parent";
import {
  Card,
  CardHeader,
  LinkButton,
  Button,
  Input,
  Label,
} from "@/components/ui";

function Toggle({
  name,
  label,
  desc,
  checked,
}: {
  name: string;
  label: string;
  desc: string;
  checked: boolean;
}) {
  return (
    <label className="flex items-start gap-3 py-2.5 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        className="mt-1 h-4 w-4 accent-[var(--primary)]"
      />
      <span>
        <span className="text-sm font-medium block">{label}</span>
        <span className="text-xs text-[var(--muted)]">{desc}</span>
      </span>
    </label>
  );
}

export default async function ParentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const enabled = await isModuleEnabled(user.id, "parent");
  if (!enabled) redirect("/settings");

  const student = await prisma.student.findFirst({
    where: { id, coachId: user.id },
    include: {
      parent: true,
      parentVisibility: true,
      weeklySummaries: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!student) notFound();

  const vis = student.parentVisibility;
  const preview = await buildWeeklySummary(student.id);

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <LinkButton href={`/students/${student.id}`} variant="ghost">
        ← {student.name}
      </LinkButton>

      <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
        Veli bir <strong>izleyicidir</strong>, müdahale eden değil. Net tablosu,
        hata kırılımı ve görüşme notları paylaşılmaz — yalnızca nötr “çalıştı mı
        / gidişat” özeti. MVP: sadece itme (haftalık özet), ayrı veli girişi yok.
      </div>

      {/* Veli iletişim */}
      <Card>
        <CardHeader title="Veli İletişim" />
        <form
          action={saveParentContactAction.bind(null, student.id)}
          className="p-5 space-y-3"
        >
          <div>
            <Label htmlFor="parentName">Veli Adı</Label>
            <Input
              id="parentName"
              name="parentName"
              defaultValue={student.parent?.name ?? ""}
              required
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">E-posta (özet gönderimi)</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              defaultValue={student.parent?.contactEmail ?? ""}
            />
          </div>
          <Button type="submit">Kaydet</Button>
        </form>
      </Card>

      {/* Üç seviyeli görünürlük */}
      <Card>
        <CardHeader
          title="Görünürlük Kontrolü"
          subtitle="Üç seviye: hesap → öğrenci → içerik."
        />
        <form
          action={updateParentVisibilityAction.bind(null, student.id)}
          className="p-5"
        >
          <div className="divide-y divide-[var(--border)]">
            <Toggle
              name="accountEnabled"
              label="Hesap seviyesi: veli bildirimleri açık"
              desc="Kapatılırsa bu veliye hiç özet gitmez."
              checked={vis?.accountEnabled ?? true}
            />
            <Toggle
              name="shareEnabled"
              label="Öğrenci seviyesi: bu öğrenci için paylaşım açık"
              desc="Öğrenci bazında paylaşımı durdurabilirsin."
              checked={vis?.shareEnabled ?? true}
            />
            <Toggle
              name="showPlanProgress"
              label="İçerik: çalışma planı gidişatı"
              desc="“Plan büyük ölçüde tamamlandı” gibi nötr ifade."
              checked={vis?.showPlanProgress ?? true}
            />
            <Toggle
              name="showExamParticipation"
              label="İçerik: deneme katılımı"
              desc="Kaç denemeye katıldığı (net paylaşılmaz)."
              checked={vis?.showExamParticipation ?? true}
            />
            <Toggle
              name="showTrend"
              label="İçerik: genel gidişat"
              desc="yükseliş / stabil / dikkat (sayısal net yok)."
              checked={vis?.showTrend ?? true}
            />
          </div>
          <div className="mt-4">
            <Button type="submit">Görünürlüğü Kaydet</Button>
          </div>
        </form>
      </Card>

      {/* Önizleme + öğrenci şeffaflığı */}
      <Card>
        <CardHeader
          title="Velinin Göreceği Özet (önizleme)"
          subtitle="Öğrenci de bunu görür — şeffaflık veri kalitesini artırır."
        />
        <div className="p-5 space-y-3">
          {preview ? (
            <div className="rounded-lg bg-slate-50 border border-[var(--border)] p-4 text-sm">
              {preview.content}
            </div>
          ) : (
            <p className="text-sm text-[var(--muted)]">
              Görünürlük kapalı — şu an veliye özet gönderilmiyor.
            </p>
          )}
          <form action={generateWeeklySummaryAction.bind(null, student.id)}>
            <Button type="submit" variant="secondary" disabled={!preview}>
              Haftalık özeti gönder (push)
            </Button>
          </form>
        </div>
      </Card>

      {/* Gönderilen özetler */}
      {student.weeklySummaries.length > 0 && (
        <Card>
          <CardHeader title="Gönderilen Özetler" />
          <ul className="p-5 space-y-2">
            {student.weeklySummaries.map((w) => (
              <li
                key={w.id}
                className="text-sm border border-[var(--border)] rounded-lg p-3"
              >
                <p>{w.content}</p>
                <p className="text-xs text-[var(--muted)] mt-1">
                  {new Date(w.createdAt).toLocaleString("tr-TR")}
                </p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
