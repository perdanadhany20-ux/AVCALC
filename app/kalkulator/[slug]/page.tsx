import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalculatorPageClient } from "./client";
import { CALCULATORS, getCalcBySlug } from "@/lib/present/registry";

export const dynamicParams = false;

export function generateStaticParams() {
  return CALCULATORS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const def = getCalcBySlug((await params).slug);
  if (!def) return {};
  return {
    title: def.title,
    description: def.metaDescription,
    alternates: { canonical: `/kalkulator/${def.slug}` },
    openGraph: { title: `${def.title} | AVCalc`, description: def.metaDescription, url: `/kalkulator/${def.slug}` },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const def = getCalcBySlug((await params).slug);
  if (!def) notFound();
  return (
    <>
      <header className="mb-6 max-w-2xl">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{def.title}</h1>
        <p className="mt-2 text-muted">{def.intro}</p>
      </header>
      <CalculatorPageClient id={def.id} />
    </>
  );
}
