import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isProActive, type CalculationRow, type Profile, type ProjectRow, type RoomRow, type ShareLinkRow } from "@/lib/supabase/types";

export const SLUG_RE = /^[A-Za-z0-9]{10}$/;

export type SharedProject = {
  project: ProjectRow;
  rooms: (RoomRow & { calculations: CalculationRow[] })[];
  owner: Pick<Profile, "company_name" | "full_name">;
  logoUrl: string | null;
  expiresAt: string | null;
};

/**
 * Membaca project untuk halaman share publik. Tabel tidak dibuka ke anon; route server ini
 * memvalidasi slug (aktif, belum kedaluwarsa, pemilik masih Pro) lalu membaca dengan service role.
 */
export async function loadSharedProject(slug: string): Promise<SharedProject | null> {
  if (!SLUG_RE.test(slug) || !isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const db = createAdminClient();
  const { data: link } = await db.from("share_links").select("*").eq("slug", slug).maybeSingle<ShareLinkRow>();
  if (!link || !link.is_active) return null;
  if (link.expires_at && new Date(link.expires_at) <= new Date()) return null;

  const { data: project } = await db.from("projects").select("*").eq("id", link.project_id).maybeSingle<ProjectRow>();
  if (!project) return null;
  const { data: owner } = await db.from("profiles").select("*").eq("id", project.user_id).single<Profile>();
  if (!isProActive(owner)) return null;

  const { data: rooms } = await db.from("rooms").select("*, calculations(*)").eq("project_id", project.id).order("created_at");
  let logoUrl: string | null = null;
  if (owner?.logo_path) {
    const { data } = await db.storage.from("logos").createSignedUrl(owner.logo_path, 3600);
    logoUrl = data?.signedUrl ?? null;
  }
  return {
    project,
    rooms: ((rooms ?? []) as SharedProject["rooms"]).map((r) => ({
      ...r,
      calculations: [...r.calculations].sort((a, b) => a.created_at.localeCompare(b.created_at)),
    })),
    owner: { company_name: owner?.company_name ?? null, full_name: owner?.full_name ?? null },
    logoUrl,
    expiresAt: link.expires_at,
  };
}
