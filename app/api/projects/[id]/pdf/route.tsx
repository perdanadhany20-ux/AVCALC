import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { registerPdfFonts } from "@/lib/pdf/fonts";
import { ProjectPdf, type PdfData } from "@/lib/pdf/project-pdf";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { isProActive, type CalculationRow, type Profile, type ProjectRow, type RoomRow } from "@/lib/supabase/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Room = RoomRow & { calculations: CalculationRow[] };

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 503 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Masuk dulu" }, { status: 401 });

  // RLS memastikan hanya pemilik yang bisa membaca project ini.
  const [{ data: project }, { data: rooms }, { data: profile }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).maybeSingle<ProjectRow>(),
    supabase.from("rooms").select("*, calculations(*)").eq("project_id", id).order("created_at"),
    supabase.from("profiles").select("*").eq("id", auth.user.id).single<Profile>(),
  ]);
  if (!project) return NextResponse.json({ error: "Tidak ditemukan" }, { status: 404 });

  const pro = isProActive(profile);
  let logoDataUri: string | null = null;
  if (pro && profile?.logo_path) {
    const { data: blob } = await supabase.storage.from("logos").download(profile.logo_path);
    if (blob) logoDataUri = `data:${blob.type || "image/png"};base64,${Buffer.from(await blob.arrayBuffer()).toString("base64")}`;
  }

  const data: PdfData = {
    project: { name: project.name, client_name: project.client_name, notes: project.notes },
    rooms: ((rooms ?? []) as Room[]).map((r) => ({
      name: r.name,
      calculations: [...r.calculations]
        .sort((a, b) => a.created_at.localeCompare(b.created_at))
        .map((c) => ({ calculator: c.calculator, input: c.input, output: c.output })),
    })),
    branding: {
      pro,
      companyName: pro ? profile?.company_name ?? null : null,
      preparedBy: (pro ? profile?.company_name : null) ?? profile?.full_name ?? auth.user.email ?? null,
      logoDataUri,
    },
    generatedAt: new Date(),
  };

  registerPdfFonts();
  const buffer = await renderToBuffer(<ProjectPdf data={data} />);
  const filename = `${project.name.replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 60) || "project"}.pdf`;
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
