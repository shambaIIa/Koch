"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { EXAM_TEMPLATES, calcNet, type ExamType } from "@/lib/yks";
import { Button, Input, Label, Select } from "@/components/ui";

export function ExamForm({
  studentId,
  action,
}: {
  studentId: string;
  action: (
    studentId: string,
    formData: FormData
  ) => Promise<{ error?: string } | void>;
}) {
  const [type, setType] = useState<ExamType>("TYT");
  const [values, setValues] = useState<
    Record<string, { correct: number; wrong: number }>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const subjects = EXAM_TEMPLATES[type];

  function update(subject: string, field: "correct" | "wrong", v: string) {
    const num = Math.max(0, Number(v) || 0);
    setValues((prev) => {
      const current = prev[subject] ?? { correct: 0, wrong: 0 };
      return { ...prev, [subject]: { ...current, [field]: num } };
    });
  }

  const totalNet = useMemo(() => {
    return subjects.reduce((acc, s) => {
      const v = values[s.subject] ?? { correct: 0, wrong: 0 };
      return acc + calcNet(v.correct, v.wrong);
    }, 0);
  }, [subjects, values]);

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set(
      "subjects",
      JSON.stringify(
        subjects.map((s) => ({
          subject: s.subject,
          questionCount: s.questionCount,
        }))
      )
    );
    startTransition(async () => {
      const res = await action(studentId, formData);
      if (res?.error) setError(res.error);
      else router.push(`/students/${studentId}`);
    });
  }

  return (
    <form action={onSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="sm:col-span-1">
          <Label htmlFor="type">Tip</Label>
          <Select
            id="type"
            name="type"
            value={type}
            onChange={(e) => setType(e.target.value as ExamType)}
          >
            <option value="TYT">TYT</option>
            <option value="AYT">AYT</option>
          </Select>
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor="name">Deneme Adı *</Label>
          <Input id="name" name="name" placeholder="örn. 3D Deneme 5" required />
        </div>
        <div className="sm:col-span-1">
          <Label htmlFor="date">Tarih</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="provider">Yayın / Sağlayıcı</Label>
        <Input id="provider" name="provider" placeholder="opsiyonel" />
      </div>

      <div className="border border-[var(--border)] rounded-lg overflow-hidden">
        <div className="grid grid-cols-12 bg-slate-50 text-xs font-medium text-[var(--muted)] px-3 py-2">
          <div className="col-span-5">Ders</div>
          <div className="col-span-2 text-center">Doğru</div>
          <div className="col-span-2 text-center">Yanlış</div>
          <div className="col-span-3 text-right">Net</div>
        </div>
        {subjects.map((s) => {
          const v = values[s.subject] ?? { correct: 0, wrong: 0 };
          const net = calcNet(v.correct, v.wrong);
          const over = v.correct + v.wrong > s.questionCount;
          return (
            <div
              key={s.subject}
              className="grid grid-cols-12 items-center px-3 py-2 border-t border-[var(--border)] gap-2"
            >
              <div className="col-span-5">
                <p className="text-sm font-medium">{s.subject}</p>
                <p className="text-xs text-[var(--muted)]">
                  {s.questionCount} soru
                </p>
              </div>
              <div className="col-span-2">
                <Input
                  name={`correct_${s.subject}`}
                  type="number"
                  min={0}
                  max={s.questionCount}
                  value={v.correct || ""}
                  onChange={(e) => update(s.subject, "correct", e.target.value)}
                  className="text-center"
                />
              </div>
              <div className="col-span-2">
                <Input
                  name={`wrong_${s.subject}`}
                  type="number"
                  min={0}
                  max={s.questionCount}
                  value={v.wrong || ""}
                  onChange={(e) => update(s.subject, "wrong", e.target.value)}
                  className="text-center"
                />
              </div>
              <div
                className={`col-span-3 text-right font-semibold ${
                  over ? "text-red-600" : ""
                }`}
              >
                {net.toFixed(2)}
              </div>
            </div>
          );
        })}
        <div className="grid grid-cols-12 items-center px-3 py-2.5 border-t border-[var(--border)] bg-slate-50">
          <div className="col-span-9 text-sm font-semibold">Toplam Net</div>
          <div className="col-span-3 text-right font-bold text-[var(--primary)]">
            {totalNet.toFixed(2)}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Kaydediliyor…" : "Denemeyi Kaydet"}
      </Button>
    </form>
  );
}
