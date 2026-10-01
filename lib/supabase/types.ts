import type { CalcId, Values } from "@/lib/present/types";

export type Plan = "free" | "pro";
export type Profile = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  logo_path: string | null;
  plan: Plan;
  pro_until: string | null;
};
export type ProjectRow = { id: string; user_id: string; name: string; client_name: string | null; notes: string | null; created_at: string; updated_at: string };
export type RoomRow = { id: string; project_id: string; name: string; created_at: string };
export type CalculationRow = { id: string; room_id: string; calculator: CalcId; input: Values; output: unknown; created_at: string };
export type ShareLinkRow = { id: string; project_id: string; slug: string; is_active: boolean; expires_at: string | null; created_at: string };

export const isProActive = (p: Pick<Profile, "plan" | "pro_until"> | null) =>
  Boolean(p && p.plan === "pro" && (!p.pro_until || new Date(p.pro_until) > new Date()));
