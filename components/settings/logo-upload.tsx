"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { setLogo } from "@/app/settings/actions";

const MAX = 1024 * 1024;

export function LogoUpload({ userId, previewUrl }: { userId: string; previewUrl: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!["image/png", "image/jpeg"].includes(file.type)) return setError("Gunakan file PNG atau JPG.");
    if (file.size > MAX) return setError("Ukuran maksimal 1 MB.");
    setBusy(true);
    try {
      const path = `${userId}/logo-${Date.now()}.${file.type === "image/png" ? "png" : "jpg"}`;
      const { error: upErr } = await createClient().storage.from("logos").upload(path, file, { contentType: file.type, upsert: false });
      if (upErr) throw upErr;
      const res = await setLogo(path);
      if (!res.ok) throw new Error(res.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal mengunggah logo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-3">
      <div className="flex h-24 items-center justify-center rounded-md border border-dashed border-border bg-white p-3">
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewUrl} alt="Logo perusahaan" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-sm text-[#55637a]">Belum ada logo</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        <label className="inline-flex h-10 cursor-pointer items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-sunken focus-within:outline-2 focus-within:outline-line-ink">
          {busy ? "Mengunggah…" : "Pilih logo (PNG/JPG, maks. 1 MB)"}
          <input type="file" accept="image/png,image/jpeg" className="sr-only" disabled={busy} onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {previewUrl ? (
          <Button
            type="button"
            variant="danger"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await setLogo(null);
              setBusy(false);
              router.refresh();
            }}
          >
            Hapus logo
          </Button>
        ) : null}
      </div>
      {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
