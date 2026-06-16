import { requireUser } from "@/lib/guard";
import {
  SWITCHABLE_MODULES,
  CORE_MODULES,
  ADDON_MODULES,
  getModuleSettings,
} from "@/lib/modules";
import { Card, CardHeader, Badge } from "@/components/ui";
import { ModuleToggle } from "@/components/module-toggle";

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = await getModuleSettings(user.id);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div>
        <h1 className="text-xl font-semibold">Modüller</h1>
        <p className="text-sm text-[var(--muted)]">
          Modülerlik = silme değil, feature-flag ile anahtarlama. Çekirdek hep
          açık; gerisini ihtiyacına göre aç.
        </p>
      </div>

      {/* Çekirdek */}
      <Card>
        <CardHeader
          title="Çekirdek"
          subtitle="Her zaman açık — kapatılamaz."
        />
        <div className="p-5 flex flex-wrap gap-2">
          {CORE_MODULES.map((m) => (
            <Badge key={m} tone="info">
              {m}
            </Badge>
          ))}
        </div>
      </Card>

      {/* Anahtarlanabilir */}
      <Card>
        <CardHeader
          title="Anahtarlanabilir Modüller"
          subtitle="Koç aç/kapa yapar."
        />
        <ul className="p-2">
          {SWITCHABLE_MODULES.map((m) => (
            <li
              key={m.key}
              className="flex items-start justify-between gap-4 p-3 rounded-lg hover:bg-slate-50"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium">{m.name}</p>
                <p className="text-xs text-[var(--muted)]">{m.description}</p>
              </div>
              <ModuleToggle moduleKey={m.key} enabled={settings[m.key]} />
            </li>
          ))}
        </ul>
      </Card>

      {/* Eklenti */}
      <Card>
        <CardHeader
          title="Eklenti (sonra)"
          subtitle="Mimari hazır — ileride açılacak."
        />
        <div className="p-5 flex flex-wrap gap-2">
          {ADDON_MODULES.map((m) => (
            <Badge key={m} tone="neutral">
              {m}
            </Badge>
          ))}
        </div>
      </Card>
    </div>
  );
}
