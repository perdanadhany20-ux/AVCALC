import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Link tidak tersedia</h1>
      <p className="mt-2 text-muted">Link ini sudah dinonaktifkan, kedaluwarsa, atau salah ketik. Minta link baru ke pengirimnya.</p>
      <Link href="/" className="mt-4 inline-block text-sm font-medium text-line-ink hover:underline">Buka kalkulator AVCalc</Link>
    </div>
  );
}
