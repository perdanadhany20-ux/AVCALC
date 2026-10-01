"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult } from "@/app/projects/actions";
import { createClient } from "@/lib/supabase/server";

const optText = z.string().trim().max(120, "Maksimal 120 karakter").transform((v) => (v ? v : null));

export async function updateProfile(_prev: ActionResult | null, fd: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: "Masuk dulu.", code: "login" };
  const p = z.object({ full_name: optText, company_name: optText }).safeParse({
    full_name: fd.get("full_name") ?? "",
    company_name: fd.get("company_name") ?? "",
  });
  if (!p.success) return { ok: false, error: p.error.issues[0]?.message ?? "Data tidak valid.", code: "invalid" };
  const { error } = await supabase.from("profiles").update(p.data).eq("id", data.user.id);
  if (error) return { ok: false, error: "Gagal menyimpan profil.", code: "db" };
  revalidatePath("/settings");
  return { ok: true };
}

/** Simpan path logo yang sudah diunggah ke Storage (path wajib di folder milik user). */
export async function setLogo(path: string | null): Promise<ActionResult> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, error: "Masuk dulu.", code: "login" };
  if (path !== null && !new RegExp(`^${data.user.id}/[A-Za-z0-9._-]+$`).test(path)) {
    return { ok: false, error: "Path logo tidak valid.", code: "invalid" };
  }
  const { data: old } = await supabase.from("profiles").select("logo_path").eq("id", data.user.id).single<{ logo_path: string | null }>();
  const { error } = await supabase.from("profiles").update({ logo_path: path }).eq("id", data.user.id);
  if (error) return { ok: false, error: "Gagal menyimpan logo.", code: "db" };
  if (old?.logo_path && old.logo_path !== path) await supabase.storage.from("logos").remove([old.logo_path]);
  revalidatePath("/settings");
  return { ok: true };
}
