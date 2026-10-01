"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { updateProfile } from "@/app/settings/actions";

export function ProfileForm({ fullName, companyName }: { fullName: string; companyName: string }) {
  const [state, action, pending] = useActionState(updateProfile, null);
  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="full_name">Nama lengkap</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName} maxLength={120} autoComplete="name" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="company_name">Nama perusahaan</Label>
        <Input id="company_name" name="company_name" defaultValue={companyName} maxLength={120} autoComplete="organization" />
        <p className="text-xs text-muted">Muncul di sampul PDF akun Pro dan di halaman berbagi.</p>
      </div>
      <div className="flex items-center justify-end gap-3">
        {state ? (
          state.ok ? <p role="status" className="text-sm text-ok-ink">Profil disimpan.</p> : <p role="alert" className="text-sm text-danger">{state.error}</p>
        ) : null}
        <Button type="submit" disabled={pending}>Simpan profil</Button>
      </div>
    </form>
  );
}
