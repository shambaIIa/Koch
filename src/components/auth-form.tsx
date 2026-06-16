"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { loginAction, registerAction, type AuthState } from "@/actions/auth";
import { Button, Input, Label } from "@/components/ui";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Lütfen bekleyin…" : label}
    </Button>
  );
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const action = mode === "login" ? loginAction : registerAction;
  const [state, formAction] = useActionState<AuthState, FormData>(
    action,
    undefined
  );

  return (
    <form action={formAction} className="space-y-4">
      {mode === "register" && (
        <div>
          <Label htmlFor="name">Ad Soyad</Label>
          <Input id="name" name="name" placeholder="Koç adınız" required />
        </div>
      )}
      <div>
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="ornek@eposta.com"
          required
        />
      </div>
      <div>
        <Label htmlFor="password">Şifre</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
        />
      </div>

      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <SubmitButton label={mode === "login" ? "Giriş Yap" : "Hesap Oluştur"} />

      <p className="text-sm text-center text-[var(--muted)]">
        {mode === "login" ? (
          <>
            Hesabın yok mu?{" "}
            <Link href="/register" className="text-[var(--primary)] font-medium">
              Kayıt ol
            </Link>
          </>
        ) : (
          <>
            Zaten hesabın var mı?{" "}
            <Link href="/login" className="text-[var(--primary)] font-medium">
              Giriş yap
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
