/**
 * Aktifkan/perpanjang akun Pro.
 * Pakai: pnpm pro:grant <email> <bulan>
 * Membaca NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY dari .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { computeProUntil } from "../lib/pro";

async function main() {
  const [email, monthsArg] = process.argv.slice(2);
  const months = Number(monthsArg);
  if (!email || !Number.isInteger(months) || months < 1 || months > 120) {
    console.error("Pakai: pnpm pro:grant <email> <bulan>   (bulan: 1–120)");
    process.exit(1);
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("NEXT_PUBLIC_SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib ada di .env.local");
    process.exit(1);
  }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  let userId: string | null = null;
  for (let page = 1; page <= 50 && !userId; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    userId = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase())?.id ?? null;
    if (data.users.length < 1000) break;
  }
  if (!userId) {
    console.error(`User dengan email ${email} tidak ditemukan.`);
    process.exit(1);
  }

  const { data: profile, error: readErr } = await db.from("profiles").select("plan, pro_until").eq("id", userId).single();
  if (readErr) throw readErr;
  const proUntil = computeProUntil(profile, months, new Date());
  const { error } = await db.from("profiles").update({ plan: "pro", pro_until: proUntil.toISOString() }).eq("id", userId);
  if (error) throw error;
  console.log(`Pro aktif untuk ${email} sampai ${proUntil.toISOString().slice(0, 10)}.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
