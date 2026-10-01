"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCalcById, run } from "@/lib/present/registry";
import type { Values } from "@/lib/present/types";
import { randomSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isProActive, type Profile } from "@/lib/supabase/types";

export type ActionResult<T = undefined> =
  | { ok: true; data?: T }
  | { ok: false; error: string; code?: "login" | "limit" | "pro" | "invalid" | "db" };

const LIMIT_MSG = "Akun gratis hanya bisa memiliki 1 project. Upgrade ke Pro untuk project tanpa batas.";

async function session() {
  if (!isSupabaseConfigured()) return { supabase: null, user: null } as const;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return { supabase, user: data.user } as const;
}

function dbError(e: { message: string; code?: string } | null): ActionResult<never> {
  if (!e) return { ok: false, error: "Terjadi kesalahan.", code: "db" };
  if (e.message.includes("FREE_PROJECT_LIMIT")) return { ok: false, error: LIMIT_MSG, code: "limit" };
  if (e.code === "42501") return { ok: false, error: "Fitur ini khusus akun Pro.", code: "pro" };
  return { ok: false, error: "Gagal menyimpan. Coba lagi.", code: "db" };
}

const name = z.string().trim().min(1, "Wajib diisi").max(120, "Maksimal 120 karakter");
const optText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const uuid = z.string().uuid();

export type SaveTargets = {
  loggedIn: boolean;
  isPro: boolean;
  projects: { id: string; name: string; rooms: { id: string; name: string }[] }[];
};

export async function getSaveTargets(): Promise<SaveTargets> {
  const { supabase, user } = await session();
  if (!supabase || !user) return { loggedIn: false, isPro: false, projects: [] };
  const [{ data: profile }, { data: projects }] = await Promise.all([
    supabase.from("profiles").select("plan, pro_until").eq("id", user.id).single<Pick<Profile, "plan" | "pro_until">>(),
    supabase.from("projects").select("id, name, rooms(id, name, created_at)").order("updated_at", { ascending: false }),
  ]);
  return {
    loggedIn: true,
    isPro: isProActive(profile),
    projects: (projects ?? []).map((p: { id: string; name: string; rooms: { id: string; name: string; created_at: string }[] }) => ({
      id: p.id,
      name: p.name,
      rooms: [...p.rooms].sort((a, b) => a.created_at.localeCompare(b.created_at)).map(({ id, name }) => ({ id, name })),
    })),
  };
}

const saveSchema = z.object({
  calculator: z.string(),
  input: z.record(z.unknown()),
  roomId: uuid.optional(),
  projectId: uuid.optional(),
  newRoomName: name.optional(),
  newProjectName: name.optional(),
  clientName: optText(120),
});

export async function saveCalculation(payload: z.input<typeof saveSchema>): Promise<ActionResult<{ projectId: string }>> {
  const { supabase, user } = await session();
  if (!supabase || !user) return { ok: false, error: "Masuk dulu untuk menyimpan.", code: "login" };
  const p = saveSchema.safeParse(payload);
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid.", code: "invalid" };
  const def = getCalcById(p.data.calculator);
  if (!def) return { ok: false, error: "Kalkulator tidak dikenal.", code: "invalid" };
  // Hasil dihitung ulang di server; output dari browser tidak dipercaya.
  const r = run(def, p.data.input as Values);
  if (!r.ok) return { ok: false, error: "Input kalkulator tidak valid.", code: "invalid" };

  let projectId = p.data.projectId;
  let roomId = p.data.roomId;

  if (!roomId) {
    if (!projectId) {
      if (!p.data.newProjectName) return { ok: false, error: "Isi nama project.", code: "invalid" };
      const { data, error } = await supabase
        .from("projects")
        .insert({ name: p.data.newProjectName, client_name: p.data.clientName })
        .select("id")
        .single<{ id: string }>();
      if (error || !data) return dbError(error);
      projectId = data.id;
    }
    if (!p.data.newRoomName) return { ok: false, error: "Isi nama ruang.", code: "invalid" };
    const { data, error } = await supabase.from("rooms").insert({ project_id: projectId, name: p.data.newRoomName }).select("id").single<{ id: string }>();
    if (error || !data) return dbError(error);
    roomId = data.id;
  } else {
    const { data } = await supabase.from("rooms").select("project_id").eq("id", roomId).single<{ project_id: string }>();
    if (!data) return { ok: false, error: "Ruang tidak ditemukan.", code: "invalid" };
    projectId = data.project_id;
  }

  const { error } = await supabase
    .from("calculations")
    .insert({ room_id: roomId, calculator: def.id, input: r.input, output: r.output as object });
  if (error) return dbError(error);
  await supabase.from("projects").update({ updated_at: new Date().toISOString() }).eq("id", projectId);
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  return { ok: true, data: { projectId: projectId! } };
}

export async function createProject(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await session();
  if (!supabase || !user) return { ok: false, error: "Masuk dulu.", code: "login" };
  const p = z.object({ name, client_name: optText(120) }).safeParse({ name: fd.get("name"), client_name: fd.get("client_name") ?? undefined });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid.", code: "invalid" };
  const { data, error } = await supabase.from("projects").insert(p.data).select("id").single<{ id: string }>();
  if (error || !data) return dbError(error);
  revalidatePath("/projects");
  redirect(`/projects/${data.id}`);
}

export async function updateProject(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await session();
  if (!supabase || !user) return { ok: false, error: "Masuk dulu.", code: "login" };
  const p = z
    .object({ id: uuid, name, client_name: optText(120), notes: optText(4000) })
    .safeParse({ id: fd.get("id"), name: fd.get("name"), client_name: fd.get("client_name") ?? undefined, notes: fd.get("notes") ?? undefined });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid.", code: "invalid" };
  const { id, ...rest } = p.data;
  const { error } = await supabase.from("projects").update(rest).eq("id", id);
  if (error) return dbError(error);
  revalidatePath(`/projects/${id}`);
  return { ok: true };
}

export async function deleteProject(fd: FormData) {
  const { supabase } = await session();
  const id = uuid.safeParse(fd.get("id"));
  if (supabase && id.success) await supabase.from("projects").delete().eq("id", id.data);
  revalidatePath("/projects");
  redirect("/projects");
}

export async function createRoom(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await session();
  if (!supabase || !user) return { ok: false, error: "Masuk dulu.", code: "login" };
  const p = z.object({ project_id: uuid, name }).safeParse({ project_id: fd.get("project_id"), name: fd.get("name") });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid.", code: "invalid" };
  const { error } = await supabase.from("rooms").insert(p.data);
  if (error) return dbError(error);
  revalidatePath(`/projects/${p.data.project_id}`);
  return { ok: true };
}

export async function deleteRoom(fd: FormData) {
  const { supabase } = await session();
  const p = z.object({ id: uuid, project_id: uuid }).safeParse({ id: fd.get("id"), project_id: fd.get("project_id") });
  if (!supabase || !p.success) return;
  await supabase.from("rooms").delete().eq("id", p.data.id);
  revalidatePath(`/projects/${p.data.project_id}`);
}

export async function deleteCalculation(fd: FormData) {
  const { supabase } = await session();
  const p = z.object({ id: uuid, project_id: uuid }).safeParse({ id: fd.get("id"), project_id: fd.get("project_id") });
  if (!supabase || !p.success) return;
  await supabase.from("calculations").delete().eq("id", p.data.id);
  revalidatePath(`/projects/${p.data.project_id}`);
}

const EXPIRY_DAYS = { never: null, "7": 7, "30": 30, "90": 90 } as const;

export async function createShareLink(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const { supabase, user } = await session();
  if (!supabase || !user) return { ok: false, error: "Masuk dulu.", code: "login" };
  const p = z
    .object({ project_id: uuid, expiry: z.enum(["never", "7", "30", "90"]) })
    .safeParse({ project_id: fd.get("project_id"), expiry: fd.get("expiry") ?? "never" });
  if (!p.success) return { ok: false, error: "Data tidak valid.", code: "invalid" };
  const days = EXPIRY_DAYS[p.data.expiry];
  const expires_at = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const { error } = await supabase.from("share_links").insert({ project_id: p.data.project_id, slug: randomSlug(), expires_at });
    if (!error) {
      revalidatePath(`/projects/${p.data.project_id}`);
      return { ok: true };
    }
    if (error.code !== "23505") return dbError(error);
  }
  return { ok: false, error: "Gagal membuat link. Coba lagi.", code: "db" };
}

export async function setShareLinkActive(fd: FormData) {
  const { supabase } = await session();
  const p = z
    .object({ id: uuid, project_id: uuid, active: z.enum(["true", "false"]) })
    .safeParse({ id: fd.get("id"), project_id: fd.get("project_id"), active: fd.get("active") });
  if (!supabase || !p.success) return;
  await supabase.from("share_links").update({ is_active: p.data.active === "true" }).eq("id", p.data.id);
  revalidatePath(`/projects/${p.data.project_id}`);
}
