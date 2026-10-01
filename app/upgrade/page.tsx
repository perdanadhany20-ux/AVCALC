import { Check, Minus } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fitur Pro",
  description: "Bandingkan akun gratis dan Pro AVCalc: project tanpa batas, PDF bermerek, dan link berbagi untuk klien.",
  alternates: { canonical: "/upgrade" },
};

const ROWS: [string, boolean | string, boolean | string][] = [
  ["Semua kalkulator tanpa login", true, true],
  ["Link hasil kalkulator lewat URL", true, true],
  ["Project tersimpan", "1 project", "Tanpa batas"],
  ["Ruang & kalkulasi per project", "Tanpa batas", "Tanpa batas"],
  ["Ekspor PDF", "Dengan tanda air", "Bermerek: logo & nama perusahaan Anda"],
  ["Link berbagi untuk klien (tanpa login)", false, true],
];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <Check className="mx-auto h-5 w-5 text-ok-ink" aria-label="Ya" />;
  if (v === false) return <Minus className="mx-auto h-5 w-5 text-muted" aria-label="Tidak" />;
  return <span>{v}</span>;
}

export default function UpgradePage() {
  const email = process.env.CONTACT_EMAIL ?? "halo@example.com";
  const subject = encodeURIComponent("Upgrade AVCalc Pro");
  return (
    <div className="grid max-w-3xl gap-8">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">AVCalc Pro</h1>
        <p className="mt-2 text-muted">Untuk integrator yang mengirim hasil desain ke klien: simpan per ruang, ekspor PDF atas nama perusahaan sendiri, dan bagikan lewat link.</p>
      </header>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <table className="w-full min-w-[520px] text-sm">
          <caption className="sr-only">Perbandingan akun gratis dan Pro</caption>
          <thead>
            <tr className="border-b border-border text-left">
              <th scope="col" className="p-4 font-medium text-muted">Fitur</th>
              <th scope="col" className="p-4 text-center font-display font-semibold">Gratis</th>
              <th scope="col" className="p-4 text-center font-display font-semibold text-line-ink">Pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {ROWS.map(([label, free, pro]) => (
              <tr key={label}>
                <th scope="row" className="p-4 text-left font-normal">{label}</th>
                <td className="p-4 text-center"><Cell v={free} /></td>
                <td className="p-4 text-center font-medium"><Cell v={pro} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <a href={`mailto:${email}?subject=${subject}`} className="inline-flex h-11 items-center rounded-md bg-line px-5 text-sm font-medium text-white hover:brightness-110">
          Hubungi kami
        </a>
        <p className="text-sm text-muted">Sertakan email akun Anda. Pro diaktifkan manual setelah konfirmasi.</p>
      </div>
    </div>
  );
}
