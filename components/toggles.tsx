"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { useUnits } from "./providers";
import { cn } from "@/lib/utils";

export function UnitToggle({ className }: { className?: string }) {
  const { units, setUnits } = useUnits();
  return (
    <div role="group" aria-label="Sistem satuan" className={cn("inline-flex rounded-md border border-border bg-surface p-0.5 text-xs", className)}>
      {(["metric", "imperial"] as const).map((u) => (
        <button
          key={u}
          type="button"
          aria-pressed={units === u}
          onClick={() => setUnits(u)}
          className={cn("rounded px-2.5 py-1 font-medium", units === u ? "bg-line text-white" : "text-muted hover:text-ink")}
        >
          {u === "metric" ? "Metrik" : "Imperial"}
        </button>
      ))}
    </div>
  );
}

export function ThemeToggle() {
  const [dark, setDark] = useState<boolean | null>(null);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const toggle = () => {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    setDark(next);
    try {
      localStorage.setItem("avcalc:theme", next ? "dark" : "light");
    } catch {
      /* abaikan */
    }
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink"
      aria-label={dark ? "Gunakan tema terang" : "Gunakan tema gelap"}
    >
      {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export const THEME_SCRIPT = `try{var t=localStorage.getItem("avcalc:theme");if(t==="dark"||(!t&&matchMedia("(prefers-color-scheme: dark)").matches))document.documentElement.classList.add("dark")}catch(e){}`;
