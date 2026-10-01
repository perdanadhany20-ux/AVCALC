import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CalcCard } from "@/components/projects/calc-card";
import { formatDate, formatDateTime } from "@/lib/dates";
import { loadSharedProject } from "@/lib/share";

export const dynamic = "force-dynamic";

const load = cache(loadSharedProject);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const data = await load((await params).slug);
  return { title: data ? data.project.name : "Link tidak tersedia", robots: { index: false, follow: false } };
}

export default async function SharedPage({ params }: { params: Promise<{ slug: string }> }) {
  const data = await load((await params).slug);
  if (!data) notFound();
  const { project, rooms, owner, logoUrl, expiresAt } = data;
  const by = owner.company_name ?? owner.full_name;

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-border pb-6">
        <div>
          <p className="text-sm text-muted">Kalkulasi desain ruang AV{by ? ` dari ${by}` : ""}</p>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight sm:text-4xl">{project.name}</h1>
          <p className="mt-1 text-muted">
            {project.client_name ? `Untuk ${project.client_name}. ` : ""}Diperbarui {formatDate(project.updated_at)}.
            {expiresAt ? ` Link berlaku sampai ${formatDate(expiresAt)}.` : ""}
          </p>
        </div>
        {logoUrl ? (
          <div className="flex h-16 items-center rounded-md bg-white px-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logoUrl} alt={by ? `Logo ${by}` : "Logo"} className="max-h-12 max-w-48 object-contain" />
          </div>
        ) : null}
      </header>

      {project.notes ? <p className="max-w-3xl whitespace-pre-line">{project.notes}</p> : null}

      {rooms.map((room) => (
        <section key={room.id} aria-labelledby={`r-${room.id}`} className="grid gap-3">
          <h2 id={`r-${room.id}`} className="border-b border-border pb-2 font-display text-xl font-semibold">{room.name}</h2>
          {room.calculations.length === 0 ? <p className="text-sm text-muted">Belum ada kalkulasi.</p> : null}
          {room.calculations.map((c) => (
            <CalcCard key={c.id} id={c.id} calculator={c.calculator} input={c.input} output={c.output} createdAt={formatDateTime(c.created_at)} readOnly />
          ))}
        </section>
      ))}

      <p className="text-sm text-muted">
        Nilai bertanda Estimasi adalah perkiraan rule of thumb. Desain final mengacu ke standar AVIXA dan datasheet perangkat.
      </p>
    </div>
  );
}
