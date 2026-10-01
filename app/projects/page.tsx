import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { NotConfigured } from "@/components/not-configured";
import { CreateProjectForm } from "@/components/projects/forms";
import { formatDate } from "@/lib/dates";
import { createClient, getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isProActive, type Profile } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Proyek saya", robots: { index: false } };
export const dynamic = "force-dynamic";

type Row = { id: string; name: string; client_name: string | null; updated_at: string; rooms: { calculations: { count: number }[] }[] };

export default async function ProjectsPage() {
  if (!isSupabaseConfigured()) return <NotConfigured />;
  const user = await getUser();
  if (!user) redirect("/login?next=/projects");
  const supabase = await createClient();
  const [{ data: profile }, { data }] = await Promise.all([
    supabase.from("profiles").select("plan, pro_until, full_name").eq("id", user.id).single<Pick<Profile, "plan" | "pro_until" | "full_name">>(),
    supabase.from("projects").select("id, name, client_name, updated_at, rooms(calculations(count))").order("updated_at", { ascending: false }),
  ]);
  const projects = (data ?? []) as Row[];
  const isPro = isProActive(profile);
  const limitReached = !isPro && projects.length >= 1;

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Proyek saya</h1>
          <p className="mt-1 text-muted">
            {isPro ? "Akun Pro" : "Akun gratis: 1 project"}
            {profile?.pro_until && isPro ? `, aktif sampai ${formatDate(profile.pro_until)}` : ""}.{" "}
            <Link href="/settings" className="text-line-ink hover:underline">Pengaturan</Link>
          </p>
        </div>
      </header>

      <section aria-labelledby="new-project" className="rounded-lg border border-border bg-surface p-5">
        <h2 id="new-project" className="mb-4 font-display text-lg font-semibold">Project baru</h2>
        <CreateProjectForm limitReached={limitReached} />
        {limitReached ? (
          <p className="mt-3 text-sm text-muted">
            Akun gratis sudah memakai 1 project. <Link href="/upgrade" className="text-line-ink hover:underline">Upgrade ke Pro</Link> untuk project tanpa batas.
          </p>
        ) : null}
      </section>

      <section aria-labelledby="list">
        <h2 id="list" className="sr-only">Daftar project</h2>
        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-8 text-center">
            <p className="font-medium">Belum ada project.</p>
            <p className="mt-1 text-sm text-muted">Buat project di atas, atau buka kalkulator lalu tekan “Simpan ke project”.</p>
            <Link href="/kalkulator/ukuran-layar" className="mt-4 inline-flex h-10 items-center rounded-md bg-line px-4 text-sm font-medium text-white">
              Buka kalkulator ukuran layar
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
            {projects.map((p) => {
              const calcs = p.rooms.reduce((n, r) => n + (r.calculations[0]?.count ?? 0), 0);
              return (
                <li key={p.id}>
                  <Link href={`/projects/${p.id}`} className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 hover:bg-sunken">
                    <span>
                      <span className="font-display text-lg font-semibold">{p.name}</span>
                      {p.client_name ? <span className="ml-2 text-sm text-muted">{p.client_name}</span> : null}
                    </span>
                    <span className="num text-sm text-muted">
                      {p.rooms.length} ruang, {calcs} kalkulasi, diubah {formatDate(p.updated_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
