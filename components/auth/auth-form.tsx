"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/lib/safe-next";

type Mode = "login" | "signup";

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const [method, setMethod] = useState<"password" | "magic">("password");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  if (!isSupabaseConfigured()) {
    return <p className="text-sm text-muted">Login belum aktif: isi variabel Supabase di <code>.env.local</code> (lihat README).</p>;
  }

  const next = () => safeNext(new URLSearchParams(window.location.search).get("next"));
  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next())}`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    setInfo(null);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: callback(), data: { full_name: String(fd.get("full_name") ?? "").trim() } },
        });
        if (error) throw error;
        if (data.session) {
          router.replace(next());
          router.refresh();
        } else setInfo("Akun dibuat. Buka email Anda dan klik tautan konfirmasi untuk masuk.");
      } else if (method === "magic") {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: callback(), shouldCreateUser: true } });
        if (error) throw error;
        setInfo("Tautan masuk sudah dikirim. Buka email Anda di perangkat ini.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace(next());
        router.refresh();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(
        /invalid login/i.test(msg)
          ? "Email atau password salah."
          : /already registered/i.test(msg)
            ? "Email ini sudah terdaftar. Masuk dengan email tersebut."
            : /password/i.test(msg)
              ? "Password minimal 8 karakter."
              : msg,
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {mode === "login" ? (
        <div role="tablist" aria-label="Cara masuk" className="grid grid-cols-2 rounded-md border border-border p-0.5 text-sm">
          {(["password", "magic"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={method === m}
              onClick={() => setMethod(m)}
              className={method === m ? "rounded bg-sunken py-1.5 font-medium" : "py-1.5 text-muted hover:text-ink"}
            >
              {m === "password" ? "Password" : "Tautan email"}
            </button>
          ))}
        </div>
      ) : (
        <div className="grid gap-1.5">
          <Label htmlFor="full_name">Nama lengkap</Label>
          <Input id="full_name" name="full_name" autoComplete="name" required />
        </div>
      )}
      <div className="grid gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      {mode === "signup" || method === "password" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" minLength={8} autoComplete={mode === "signup" ? "new-password" : "current-password"} required />
        </div>
      ) : null}
      {error ? <p role="alert" className="text-sm font-medium text-danger">{error}</p> : null}
      {info ? <p role="status" className="text-sm text-ok-ink">{info}</p> : null}
      <Button type="submit" disabled={pending}>
        {mode === "signup" ? "Buat akun" : method === "magic" ? "Kirim tautan masuk" : "Masuk"}
      </Button>
      <p className="text-sm text-muted">
        {mode === "signup" ? (
          <>Sudah punya akun? <Link className="font-medium text-line-ink hover:underline" href="/login">Masuk</Link></>
        ) : (
          <>Belum punya akun? <Link className="font-medium text-line-ink hover:underline" href="/signup">Daftar gratis</Link></>
        )}
      </p>
    </form>
  );
}
