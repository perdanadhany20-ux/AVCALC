/** Tanggal akhir Pro baru: diperpanjang dari pro_until jika masih aktif, atau dari sekarang. */
export function computeProUntil(
  profile: { plan: string; pro_until: string | null } | null,
  months: number,
  now: Date,
): Date {
  const current = profile?.plan === "pro" && profile.pro_until ? new Date(profile.pro_until) : null;
  const base = current && current > now ? current : now;
  const d = new Date(base);
  const day = d.getUTCDate();
  d.setUTCMonth(d.getUTCMonth() + months);
  // 31 Jan + 1 bulan → akhir Februari, bukan awal Maret.
  if (d.getUTCDate() < day) d.setUTCDate(0);
  return d;
}
