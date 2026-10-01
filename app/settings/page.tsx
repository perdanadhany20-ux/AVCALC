import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NotConfigured } from "@/components/not-configured";
import { LogoUpload } from "@/components/settings/logo-upload";
import { ProfileForm } from "@/components/settings/profile-form";
import { UnitToggle } from "@/components/toggles";
import { formatDate } from "@/lib/dates";
import { createClient, getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isProActive, type Profile } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Pengaturan", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  if (!isSupabaseConfigured()) return <NotConfigured />;
  const user = await getUser();
  if (!user) redirect("/login?next=/settings");
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single<Profile>();
  const isPro = isProActive(profile);
  let preview: string | null = null;
  if (profile?.logo_path) {
    const { data } = await supabase.storage.from("logos").createSignedUrl(profile.logo_path, 3600);
    preview = data?.signedUrl ?? null;
  }

  return (
    <div className="grid max-w-3xl gap-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Pengaturan</h1>
        <p className="mt-1 text-muted">{user.email}</p>
      </header>

      <section aria-labelledby="plan" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-5">
        <div>
          <h2 id="plan" className="font-display text-lg font-semibold">{isPro ? "Akun Pro" : "Akun gratis"}</h2>
          <p className="text-sm text-muted">
            {isPro
              ? profile?.pro_until
                ? `Aktif sampai ${formatDate(profile.pro_until)}.`
                : "Aktif tanpa batas waktu."
              : "1 project, PDF dengan tanda air, tanpa link berbagi."}
          </p>
        </div>
        {!isPro ? (
          <Link href="/upgrade" className="inline-flex h-10 items-center rounded-md bg-line px-4 text-sm font-medium text-white hover:brightness-110">
            Upgrade ke Pro
          </Link>
        ) : null}
      </section>

      <section aria-labelledby="profile" className="rounded-lg border border-border bg-surface p-5">
        <h2 id="profile" className="mb-4 font-display text-lg font-semibold">Profil</h2>
        <ProfileForm fullName={profile?.full_name ?? ""} companyName={profile?.company_name ?? ""} />
      </section>

      <section aria-labelledby="logo" className="rounded-lg border border-border bg-surface p-5">
        <h2 id="logo" className="font-display text-lg font-semibold">Logo perusahaan</h2>
        <p className="mb-4 text-sm text-muted">{isPro ? "Dipakai di sampul PDF dan halaman berbagi." : "Bisa diunggah sekarang, dipakai di PDF setelah upgrade ke Pro."}</p>
        <LogoUpload userId={user.id} previewUrl={preview} />
      </section>

      <section aria-labelledby="units" className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-surface p-5">
        <div>
          <h2 id="units" className="font-display text-lg font-semibold">Satuan</h2>
          <p className="text-sm text-muted">Disimpan di browser ini. Perhitungan internal selalu metrik; PDF selalu metrik.</p>
        </div>
        <UnitToggle />
      </section>

      <form action="/auth/signout" method="post">
        <button type="submit" className="text-sm font-medium text-danger hover:underline">Keluar</button>
      </form>
    </div>
  );
}
