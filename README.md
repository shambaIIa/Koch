# Koç Paneli — Bireysel Deneme-Koçluğu Platformu

Bireysel özel ders koçu için **modüler** YKS deneme analizi ve koçluk platformu.
Fark yaratan çekirdek fikir: deneme verisini koçluk akışına gömerek
**"gir → otomatik analiz → görüşme gündemine düş"** döngüsünü tek yerde kapatmak;
bunu **YZ'siz kural motoru** ve **bireysel koça sadelik** destekler.

## Teknoloji
- **Next.js 16** (App Router, RSC, Server Actions) + **TypeScript**
- **Prisma** + **SQLite** (geliştirme; şema Postgres'e taşınabilir)
- **Tailwind CSS v4** + hafif kendi UI bileşenleri
- **Recharts** (net trend grafikleri), **Zod** (doğrulama)
- **jose** (imzalı oturum cookie) + **bcryptjs** (şifre)

## Kurulum
```bash
npm install
npm run db:push     # SQLite şemasını oluştur
npm run db:seed     # demo koç + öğrenci + denemeler + sinyaller
npm run dev         # http://localhost:3000
```

Demo giriş: **demo@koch.app / demo1234**

Diğer komutlar:
```bash
npm run build       # üretim derlemesi + tip kontrolü
npm run db:studio   # Prisma Studio (veri görüntüleme)
```

## Mimari
- **Çoklu kiracı**: her koç bir kiracı. İzolasyon veri katmanında `coachId`
  ile sağlanır (her sorgu koça göre filtrelenir). Postgres'e geçişte RLS'e
  haritalanır.
- **Modüler katmanlar** (`src/lib/modules.ts`):
  - *Çekirdek* (hep açık): roller, öğrenci profili, çalışma planı, deneme
    analizi, görüşme notları, dashboard.
  - *Anahtarlanabilir* (feature-flag, `module_settings`): veli paneli,
    motivasyon, kaynak kütüphanesi, video, bildirim merkezi.
  - *Eklenti* (sonra, mimari hazır): YZ asistanı, kurum yönetimi, LMS.
- **Kural motoru** (`src/lib/rules.ts`): deklaratif, eşik tabanlı sinyaller →
  görüşme gündemi. `evaluateStudent` deneme/plan değiştikçe tetiklenir.
- **OCR kapalı döngü** (Faz 3 hazır, `src/lib/ocr/`): pluggable `OcrProvider`
  arayüzü; şu an `StubOcrProvider`, sonra Google Vision, ardından özel OMR.
- **Veli modülü** (`src/lib/parent.ts`): nötr özet (net/hata kırılımı yok),
  üç seviyeli görünürlük (hesap/öğrenci/içerik), öğrenci şeffaflığı.

## Yol Haritası
- **Faz 0 — Temel** ✅: kurulum, auth, kiracı izolasyonu, feature-flag, tasarım.
- **Faz 1 — Çekirdek MVP** ✅: roller, profil, manuel deneme + net analizi,
  trend grafikleri, çalışma planı, görüşme notları, dashboard.
- **Faz 2 — Kural Motoru** ✅: deklaratif sinyaller + otomatik görüşme gündemi.
- **Faz 3 — OCR Kapalı Döngü** 🔌: `OcrProvider` arayüzü ve `OcrJob` modeli
  hazır; Vision entegrasyonu eklenecek.
- **Faz 4 — Anahtarlanabilir Modüller** ◐: veli haftalık nötr özet (push) +
  görünürlük kontrolü uygulandı; diğer modüller flag iskeleti hazır.
- **Faz 5 — Eklenti**: YZ/kurum/LMS (kapsam dışı, mimari hazır).

## Klasör yapısı
```
prisma/schema.prisma     # veri modeli
prisma/seed.ts           # demo veri + kural motoru çalıştırma
src/lib/                 # prisma, auth, yks, modules, rules, parent, ocr
src/actions/             # server actions (auth, students, exams, plan, parent, modules)
src/components/          # UI + form/grafik client bileşenleri
src/app/(app)/           # korumalı uygulama (dashboard, students, agenda, settings)
src/app/login, register  # kimlik doğrulama
```

## Karar notları
- Sadece **YKS** (TYT/AYT). Faz 1 **tam manuel** giriş; OCR Faz 3'te
  **önce bulut servisi (Vision)**, OMR sonra.
- Birincil müşteri **bireysel koç** — kurum/admin katmanı çekirdek dışı eklenti.
