"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { UnitSystem } from "@/lib/units";

const KEY = "avcalc:units";
const Ctx = createContext<{ units: UnitSystem; setUnits: (u: UnitSystem) => void }>({
  units: "metric",
  setUnits: () => {},
});

export function UnitsProvider({ children }: { children: ReactNode }) {
  const [units, setState] = useState<UnitSystem>("metric");
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(KEY);
      if (saved === "imperial" || saved === "metric") setState(saved);
    } catch {
      /* localStorage tidak tersedia */
    }
  }, []);
  const setUnits = useCallback((u: UnitSystem) => {
    setState(u);
    try {
      window.localStorage.setItem(KEY, u);
    } catch {
      /* abaikan */
    }
  }, []);
  return <Ctx.Provider value={{ units, setUnits }}>{children}</Ctx.Provider>;
}

export const useUnits = () => useContext(Ctx);
