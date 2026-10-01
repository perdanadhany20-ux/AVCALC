"use client";

import Link from "next/link";
import { Dialog } from "@/components/ui/dialog";

export function UpgradeDialog({ open, onOpenChange, reason }: { open: boolean; onOpenChange: (o: boolean) => void; reason?: string }) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Butuh akun Pro"
      description={reason ?? "Akun gratis hanya bisa memiliki 1 project."}
    >
      <ul className="mb-5 grid list-disc gap-1 pl-5 text-sm">
        <li>Project tanpa batas</li>
        <li>PDF dengan logo dan nama perusahaan Anda, tanpa tanda air</li>
        <li>Link berbagi yang bisa dibuka klien tanpa login</li>
      </ul>
      <div className="flex flex-wrap justify-end gap-2">
        <button type="button" onClick={() => onOpenChange(false)} className="h-10 rounded-md border border-border px-4 text-sm font-medium hover:bg-sunken">
          Nanti saja
        </button>
        <Link href="/upgrade" className="inline-flex h-10 items-center rounded-md bg-line px-4 text-sm font-medium text-white hover:brightness-110">
          Lihat fitur Pro
        </Link>
      </div>
    </Dialog>
  );
}
