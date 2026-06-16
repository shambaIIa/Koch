import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { Card } from "@/components/ui";
import { AuthForm } from "@/components/auth-form";

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--primary)] text-white font-bold text-lg">
            K
          </div>
          <h1 className="text-xl font-semibold mt-3">Hesap Oluştur</h1>
          <p className="text-sm text-[var(--muted)]">
            5 dakikada kur, ilk öğrencini ekle.
          </p>
        </div>
        <Card className="p-6">
          <AuthForm mode="register" />
        </Card>
      </div>
    </main>
  );
}
