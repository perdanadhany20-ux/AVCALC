import Link from "next/link";
import { HomeCalculator } from "./home-calculator";
import { CALCULATORS } from "@/lib/present/registry";

const TAGLINE: Record<string, string> = {
  led: "Jumlah kabinet, resolusi total, daya, arus 220 V, dan berat dinding LED.",
  projector: "Jarak proyeksi dari throw ratio dan lumen yang dibutuhkan ruang Anda.",
  camera: "Apakah kamera PTZ bisa membingkai subjek selebar itu dari posisinya.",
  "ceiling-speaker": "Jumlah dan jarak speaker plafon untuk cakupan yang rata.",
  convert: "Meter ke kaki, lux ke foot-candle, nits ke foot-lambert, dB ke rasio.",
};

export default function Home() {
  return (
    <>
      <section aria-labelledby="hero-title">
        <div className="mb-6 max-w-2xl">
          <h1 id="hero-title" className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Berapa besar layarnya?
          </h1>
          <p className="mt-3 text-lg text-muted">
            Masukkan jarak penonton terjauh. Ukuran display minimum langsung muncul, lengkap dengan gambar kerjanya.
          </p>
        </div>
        <HomeCalculator />
      </section>

      <section aria-labelledby="others" className="mt-16">
        <h2 id="others" className="font-display text-2xl font-semibold tracking-tight">
          Kalkulator lainnya
        </h2>
        <ul className="mt-4 grid border-t border-border sm:grid-cols-2">
          {CALCULATORS.filter((c) => c.id !== "screen").map((c) => (
            <li key={c.id} className="border-b border-border sm:odd:border-r sm:odd:pr-6 sm:even:pl-6">
              <Link href={`/kalkulator/${c.slug}`} className="group block py-5">
                <span className="font-display text-lg font-semibold text-line-ink group-hover:underline">{c.title}</span>
                <span className="mt-1 block text-sm text-muted">{TAGLINE[c.id]}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="pro" className="mt-16 grid gap-6 rounded-lg border border-border bg-surface p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8">
        <div className="max-w-2xl">
          <h2 id="pro" className="font-display text-2xl font-semibold tracking-tight">
            Simpan hitungan per ruang, kirim ke klien
          </h2>
          <p className="mt-2 text-muted">
            Akun gratis menyimpan satu project dan mengekspor PDF bertanda air. Pro membuka project tanpa batas, PDF dengan logo dan nama perusahaan Anda, serta link berbagi yang bisa dibuka klien tanpa login.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/signup" className="inline-flex h-10 items-center rounded-md bg-line px-4 text-sm font-medium text-white hover:brightness-110">
            Buat akun gratis
          </Link>
          <Link href="/upgrade" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-sunken">
            Lihat fitur Pro
          </Link>
        </div>
      </section>
    </>
  );
}
