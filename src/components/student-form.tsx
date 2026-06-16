"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui";
import { TRACK_LABELS } from "@/lib/yks";

type Values = {
  name?: string;
  grade?: string | null;
  track?: string | null;
  targetUniversity?: string | null;
  targetNetTyt?: number | null;
  targetNetAyt?: number | null;
  notes?: string | null;
};

export function StudentForm({
  action,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<{ error?: string } | void>;
  initial?: Values;
  submitLabel: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await action(formData);
      if (res?.error) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Ad Soyad *</Label>
        <Input id="name" name="name" defaultValue={initial?.name ?? ""} required />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="grade">Sınıf</Label>
          <Input
            id="grade"
            name="grade"
            placeholder="12, mezun…"
            defaultValue={initial?.grade ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="track">Alan</Label>
          <Select id="track" name="track" defaultValue={initial?.track ?? ""}>
            <option value="">Seçiniz</option>
            {Object.entries(TRACK_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <div>
        <Label htmlFor="targetUniversity">Hedef Üniversite / Bölüm</Label>
        <Input
          id="targetUniversity"
          name="targetUniversity"
          placeholder="örn. Boğaziçi - Bilgisayar Müh."
          defaultValue={initial?.targetUniversity ?? ""}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="targetNetTyt">Hedef TYT Net</Label>
          <Input
            id="targetNetTyt"
            name="targetNetTyt"
            type="number"
            step="0.25"
            placeholder="örn. 95"
            defaultValue={initial?.targetNetTyt ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="targetNetAyt">Hedef AYT Net</Label>
          <Input
            id="targetNetAyt"
            name="targetNetAyt"
            type="number"
            step="0.25"
            placeholder="örn. 70"
            defaultValue={initial?.targetNetAyt ?? ""}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="notes">Notlar</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Genel notlar, özel durumlar…"
          defaultValue={initial?.notes ?? ""}
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Kaydediliyor…" : submitLabel}
        </Button>
      </div>
    </form>
  );
}
