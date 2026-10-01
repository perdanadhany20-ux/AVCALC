import { FileDown, Trash2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { NotConfigured } from "@/components/not-configured";
import { CalcCard } from "@/components/projects/calc-card";
import { ConfirmSubmit } from "@/components/projects/confirm-submit";
import { CopyButton } from "@/components/projects/copy-button";
import { AddRoomForm, CreateShareLinkForm, EditProjectForm } from "@/components/projects/forms";
import { deleteProject, deleteRoom, setShareLinkActive } from "../actions";
import { formatDate, formatDateTime } from "@/lib/dates";
import { SITE_URL } from "@/lib/site";
import { createClient, getUser } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isProActive, type CalculationRow, type Profile, type ProjectRow, type RoomRow, type ShareLinkRow } from "@/lib/supabase/types";

export const metadata: Metadata = { title: "Project", robots: { index: false } };
export const dynamic = "force-dynamic";

type Room = RoomRow & { calculations: CalculationRow[] };

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return <NotConfigured />;
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const user = await getUser();
  if (!user) redirect(`/login?next=/projects/${id}`);
  const supabase = await createClient();
  const [{ data: project }, { data: rooms }, { data: links }, { data: profile }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle<ProjectRow>(),
    supabase.from("rooms").select("*, calculations(*)").eq("project_id", id).order("created_at"),
    supabase.from("share_links").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("plan, pro_until").eq("id", user.id).single<Pick<Profile, "plan" | "pro_until">>(),
  ]);
  if (!project) notFound();
  const isPro = isProActive(profile);
  const roomList = ((rooms ?? []) as Room[]).map((r) => ({
    ...r,
    calculations: [...r.calculations].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  }));
  const shareLinks = (links ?? []) as ShareLinkRow[];
  const now = new Date();

  return (
    <div className="grid gap-8">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/projects" className="hover:text-ink hover:underline">Proyek saya</Link> / <span className="text-ink">{project.name}</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{project.name}</h1>
          <p className="mt-1 text-muted">
            {project.client_name ? `${project.client_name}, ` : ""}dibuat {formatDate(project.created_at)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/projects/${project.id}/pdf`} className="inline-flex h-10 items-center gap-2 rounded-md bg-line px-4 text-sm font-medium text-white hover:brightness-110">
            <FileDown className="h-4 w-4" aria-hidden /> Ekspor PDF{isPro ? "" : " (tanda air)"}
          </a>
          <form action={deleteProject}>
            <input type="hidden" name="id" value={project.id} />
            <ConfirmSubmit message="Hapus project ini beserta semua ruang dan kalkulasinya?" className="h-10 px-4">
              <Trash2 className="h-4 w-4" aria-hidden /> Hapus project
            </ConfirmSubmit>
          </form>
        </div>
      </header>

      <details className="rounded-lg border border-border bg-surface">
        <summary className="cursor-pointer px-5 py-3 text-sm font-medium select-none">Ubah detail project</summary>
        <div className="border-t border-border p-5">
          <EditProjectForm project={project} />
        </div>
      </details>

      <section aria-labelledby="rooms-title" className="grid gap-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="rooms-title" className="font-display text-2xl font-semibold tracking-tight">Ruang</h2>
          <Link href="/kalkulator/ukuran-layar" className="text-sm font-medium text-line-ink hover:underline">
            Tambah kalkulasi dari kalkulator
          </Link>
        </div>
        {roomList.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted">
            Belum ada ruang. Tambahkan ruang di bawah, lalu simpan hasil kalkulator ke ruang tersebut.
          </p>
        ) : (
          roomList.map((room) => (
            <section key={room.id} aria-labelledby={`room-${room.id}`} className="grid gap-3">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-2">
                <h3 id={`room-${room.id}`} className="font-display text-lg font-semibold">{room.name}</h3>
                <form action={deleteRoom}>
                  <input type="hidden" name="id" value={room.id} />
                  <input type="hidden" name="project_id" value={project.id} />
                  <ConfirmSubmit message={`Hapus ruang "${room.name}" dan semua kalkulasinya?`} className="h-8 px-3" aria-label={`Hapus ruang ${room.name}`}>
                    <Trash2 className="h-3.5 w-3.5" aria-hidden /> Hapus ruang
                  </ConfirmSubmit>
                </form>
              </div>
              {room.calculations.length === 0 ? (
                <p className="text-sm text-muted">Belum ada kalkulasi di ruang ini.</p>
              ) : (
                room.calculations.map((c) => (
                  <CalcCard
                    key={c.id}
                    id={c.id}
                    projectId={project.id}
                    calculator={c.calculator}
                    input={c.input}
                    output={c.output}
                    createdAt={formatDateTime(c.created_at)}
                  />
                ))
              )}
            </section>
          ))
        )}
        <div className="rounded-lg border border-border bg-surface p-5">
          <AddRoomForm projectId={project.id} />
        </div>
      </section>

      <section aria-labelledby="share-title" className="grid gap-4 rounded-lg border border-border bg-surface p-5">
        <div>
          <h2 id="share-title" className="font-display text-xl font-semibold">Bagikan ke klien</h2>
          <p className="mt-1 text-sm text-muted">Klien bisa membuka link tanpa login dan hanya bisa melihat, tidak mengubah.{isPro ? "" : " Fitur Pro."}</p>
        </div>
        <CreateShareLinkForm projectId={project.id} isPro={isPro} />
        {shareLinks.length ? (
          <ul className="divide-y divide-border border-t border-border">
            {shareLinks.map((l) => {
              const expired = l.expires_at !== null && new Date(l.expires_at) <= now;
              const url = `${SITE_URL}/s/${l.slug}`;
              const status = !l.is_active ? "Nonaktif" : expired ? "Kedaluwarsa" : l.expires_at ? `Aktif sampai ${formatDate(l.expires_at)}` : "Aktif tanpa batas";
              return (
                <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <a href={url} className="num block truncate text-sm font-medium text-line-ink hover:underline" target="_blank" rel="noreferrer">{url}</a>
                    <span className={`text-xs ${l.is_active && !expired ? "text-ok-ink" : "text-muted"}`}>{status}</span>
                  </div>
                  <div className="flex gap-2">
                    {l.is_active && !expired ? <CopyButton text={url} /> : null}
                    <form action={setShareLinkActive}>
                      <input type="hidden" name="id" value={l.id} />
                      <input type="hidden" name="project_id" value={project.id} />
                      <input type="hidden" name="active" value={l.is_active ? "false" : "true"} />
                      <button type="submit" className="inline-flex h-8 items-center rounded-md border border-border px-3 text-sm hover:bg-sunken">
                        {l.is_active ? "Nonaktifkan" : "Aktifkan lagi"}
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : null}
      </section>
    </div>
  );
}
