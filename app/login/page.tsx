import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Masuk", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl font-bold tracking-tight">Masuk</h1>
      <p className="mt-2 mb-6 text-muted">Simpan hasil kalkulator ke project dan ekspor PDF.</p>
      <div className="rounded-lg border border-border bg-surface p-5">
        <AuthForm mode="login" />
      </div>
    </div>
  );
}
