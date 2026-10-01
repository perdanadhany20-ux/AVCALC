import type { MetadataRoute } from "next";
import { CALCULATORS } from "@/lib/present/registry";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: now, changeFrequency: "monthly", priority: 1 },
    ...CALCULATORS.map((c) => ({
      url: `${SITE_URL}/kalkulator/${c.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.9,
    })),
    { url: `${SITE_URL}/upgrade`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
  ];
}
