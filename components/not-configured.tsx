export function NotConfigured() {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Supabase belum dikonfigurasi</h1>
      <p className="mt-2 text-muted">
        Kalkulator tetap bisa dipakai tanpa login. Untuk menyimpan project, isi <code>NEXT_PUBLIC_SUPABASE_URL</code> dan{" "}
        <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code> di <code>.env.local</code> (lihat README).
      </p>
    </div>
  );
}
