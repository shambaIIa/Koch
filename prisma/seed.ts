import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { evaluateStudent } from "../src/lib/rules";

const prisma = new PrismaClient();

// Demo veri: sinyal üreten gerçekçi deneme geçmişleri.
const SUBJECTS_TYT = [
  { subject: "Türkçe", questionCount: 40 },
  { subject: "Sosyal Bilimler", questionCount: 20 },
  { subject: "Temel Matematik", questionCount: 40 },
  { subject: "Fen Bilimleri", questionCount: 20 },
];

function net(correct: number, wrong: number) {
  return Math.round((correct - wrong / 4) * 100) / 100;
}

async function main() {
  const email = "demo@koch.app";
  await prisma.user.deleteMany({ where: { email } });

  const coach = await prisma.user.create({
    data: {
      email,
      name: "Demo Koç",
      passwordHash: await bcrypt.hash("demo1234", 10),
      role: "coach",
      moduleSettings: {
        create: [
          { moduleKey: "parent", enabled: true },
          { moduleKey: "motivation", enabled: false },
          { moduleKey: "library", enabled: false },
          { moduleKey: "video", enabled: false },
          { moduleKey: "notifications", enabled: false },
        ],
      },
    },
  });

  // Öğrenci 1: matematik düşüşte, boş oranı yüksek
  const s1 = await prisma.student.create({
    data: {
      coachId: coach.id,
      name: "Elif Yılmaz",
      grade: "12",
      track: "sayisal",
      targetUniversity: "ODTÜ - Elektrik-Elektronik Müh.",
      targetNetTyt: 100,
      targetNetAyt: 70,
      parentVisibility: { create: {} },
      parent: { create: { name: "Ayşe Yılmaz", contactEmail: "veli1@ornek.com" } },
    },
  });

  const elifMatNets = [
    { correct: 34, wrong: 4 }, // mat güçlü başlıyor
    { correct: 28, wrong: 8 },
    { correct: 22, wrong: 6 }, // düşüş
  ];
  const baseDates = [21, 14, 7];
  for (let i = 0; i < 3; i++) {
    const mat = elifMatNets[i];
    await prisma.exam.create({
      data: {
        coachId: coach.id,
        studentId: s1.id,
        name: `Deneme ${i + 1}`,
        type: "TYT",
        provider: "3D",
        date: new Date(Date.now() - baseDates[i] * 24 * 60 * 60 * 1000),
        subjects: {
          create: [
            { subject: "Türkçe", questionCount: 40, correct: 32, wrong: 4, blank: 4, net: net(32, 4) },
            { subject: "Sosyal Bilimler", questionCount: 20, correct: 15, wrong: 3, blank: 2, net: net(15, 3) },
            {
              subject: "Temel Matematik",
              questionCount: 40,
              correct: mat.correct,
              wrong: mat.wrong,
              blank: 40 - mat.correct - mat.wrong,
              net: net(mat.correct, mat.wrong),
            },
            { subject: "Fen Bilimleri", questionCount: 20, correct: 8, wrong: 2, blank: 10, net: net(8, 2) }, // yüksek boş
          ],
        },
      },
    });
  }

  await prisma.studyTask.createMany({
    data: [
      { coachId: coach.id, studentId: s1.id, title: "Türev 50 soru", subject: "Matematik", status: "done" },
      { coachId: coach.id, studentId: s1.id, title: "Paragraf 2 deneme", subject: "Türkçe", status: "pending" },
      { coachId: coach.id, studentId: s1.id, title: "Fizik tekrar", subject: "Fen", status: "pending" },
    ],
  });

  // Öğrenci 2: genel yükseliş
  const s2 = await prisma.student.create({
    data: {
      coachId: coach.id,
      name: "Mert Demir",
      grade: "mezun",
      track: "esit",
      targetUniversity: "Boğaziçi - İşletme",
      targetNetTyt: 95,
      parentVisibility: { create: {} },
    },
  });
  const mertNet = [
    [22, 18, 20, 6],
    [26, 18, 24, 8],
    [30, 19, 28, 10],
  ];
  for (let i = 0; i < 3; i++) {
    const v = mertNet[i];
    await prisma.exam.create({
      data: {
        coachId: coach.id,
        studentId: s2.id,
        name: `Deneme ${i + 1}`,
        type: "TYT",
        date: new Date(Date.now() - baseDates[i] * 24 * 60 * 60 * 1000),
        subjects: {
          create: SUBJECTS_TYT.map((sub, idx) => ({
            subject: sub.subject,
            questionCount: sub.questionCount,
            correct: v[idx],
            wrong: 2,
            blank: sub.questionCount - v[idx] - 2,
            net: net(v[idx], 2),
          })),
        },
      },
    });
  }

  // Kural motorunu çalıştır → sinyaller + görüşme gündemi
  await evaluateStudent(coach.id, s1.id);
  await evaluateStudent(coach.id, s2.id);

  console.log("Seed tamam. Giriş: demo@koch.app / demo1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
