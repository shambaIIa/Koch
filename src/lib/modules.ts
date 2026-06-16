import { prisma } from "./prisma";

// Modüler mimari: çekirdek her zaman açık; anahtarlanabilir modüller feature-flag arkasında.

export type SwitchableModuleKey =
  | "parent"
  | "motivation"
  | "library"
  | "video"
  | "notifications";

export interface ModuleDef {
  key: SwitchableModuleKey;
  name: string;
  description: string;
  layer: "switchable";
}

export const SWITCHABLE_MODULES: ModuleDef[] = [
  {
    key: "parent",
    name: "Veli Paneli",
    description:
      "Veliye haftalık nötr gidişat özeti (net/hata kırılımı paylaşılmaz). Sadece itme modeli.",
    layer: "switchable",
  },
  {
    key: "motivation",
    name: "Motivasyon",
    description: "Pozitif pekiştirme mesajları ve hedef hatırlatıcıları.",
    layer: "switchable",
  },
  {
    key: "library",
    name: "Kaynak Kütüphanesi",
    description: "Öğrenciye atanan kaynak ve doküman havuzu.",
    layer: "switchable",
  },
  {
    key: "video",
    name: "Video Görüşme",
    description: "Online görüşme planlama ve bağlantı yönetimi.",
    layer: "switchable",
  },
  {
    key: "notifications",
    name: "Bildirim Merkezi",
    description: "Deneme ve plan bildirimlerinin merkezi yönetimi.",
    layer: "switchable",
  },
];

// Çekirdek modüller (her zaman açık) — referans amaçlı.
export const CORE_MODULES = [
  "Koç & Öğrenci Rolleri",
  "Öğrenci Profili",
  "Çalışma Planı",
  "Deneme Analizi",
  "Görüşme Notları",
  "Koç Dashboard",
];

// Eklenti modüller (sonra) — mimari hazır.
export const ADDON_MODULES = [
  "YZ Modelleri",
  "AI Koç Asistanı",
  "Kurum Yönetimi",
  "LMS",
];

export async function getModuleSettings(
  coachId: string
): Promise<Record<SwitchableModuleKey, boolean>> {
  const rows = await prisma.moduleSetting.findMany({ where: { coachId } });
  const map = Object.fromEntries(
    SWITCHABLE_MODULES.map((m) => [m.key, false])
  ) as Record<SwitchableModuleKey, boolean>;
  for (const r of rows) {
    if (r.moduleKey in map) {
      map[r.moduleKey as SwitchableModuleKey] = r.enabled;
    }
  }
  return map;
}

export async function isModuleEnabled(
  coachId: string,
  key: SwitchableModuleKey
): Promise<boolean> {
  const row = await prisma.moduleSetting.findUnique({
    where: { coachId_moduleKey: { coachId, moduleKey: key } },
  });
  return row?.enabled ?? false;
}

export async function setModuleEnabled(
  coachId: string,
  key: SwitchableModuleKey,
  enabled: boolean
): Promise<void> {
  await prisma.moduleSetting.upsert({
    where: { coachId_moduleKey: { coachId, moduleKey: key } },
    create: { coachId, moduleKey: key, enabled },
    update: { enabled },
  });
}
