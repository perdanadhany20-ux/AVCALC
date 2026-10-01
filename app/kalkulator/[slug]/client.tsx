"use client";

import { CalculatorView } from "@/components/calc/calculator-view";
import { SaveToProject } from "@/components/calc/save-to-project";
import type { CalcId } from "@/lib/present/types";

export function CalculatorPageClient({ id }: { id: CalcId }) {
  return <CalculatorView id={id} renderActions={({ calculator, input }) => <SaveToProject calculator={calculator} input={input} />} />;
}
