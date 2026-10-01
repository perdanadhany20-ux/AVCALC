import "@fontsource-variable/inter";
import "@fontsource-variable/space-grotesk";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { UnitsProvider } from "@/components/providers";
import { SiteFooter, SiteHeader } from "@/components/site-header";
import { THEME_SCRIPT } from "@/components/toggles";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "AVCalc: kalkulator desain ruang AV", template: "%s | AVCalc" },
  description:
    "Kalkulator gratis untuk desainer dan integrator AV: ukuran layar, LED video wall, proyektor, kamera PTZ, speaker plafon, dan konversi satuan.",
  openGraph: { type: "website", locale: "id_ID", siteName: "AVCalc" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F3F5F9" },
    { media: "(prefers-color-scheme: dark)", color: "#0F1A2B" },
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-surface focus:px-3 focus:py-2">
          Lewati ke konten
        </a>
        <UnitsProvider>
          <SiteHeader />
          <main id="main" className="mx-auto max-w-6xl px-4 pt-8">
            {children}
          </main>
          <SiteFooter />
        </UnitsProvider>
      </body>
    </html>
  );
}
