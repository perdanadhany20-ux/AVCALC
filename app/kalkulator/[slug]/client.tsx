"use client";

import { CalculatorView } from "@/components/calc/calculator-view";
import type { CalcId } from "@/lib/present/types";

export function CalculatorPageClient({ id }: { id: CalcId }) {
  return <CalculatorView id={id} />;
}
