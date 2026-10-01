import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = { title: "Daftar", robots: { index: false } };

export default function SignupPage() {
  return (
    <div className="mx-auto max-w-sm">
      <h1 className="font-display text-3xl font-bold tracking-tight">Buat akun gratis</h1>
      <p className="mt-2 mb-6 text-muted">Satu project gratis selamanya. Upgrade kapan saja.</p>
      <div className="rounded-lg border border-border bg-surface p-5">
        <AuthForm mode="signup" />
      </div>
    </div>
  );
}
