"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import { createProject, createRoom, createShareLink, updateProject, type ActionResult } from "@/app/projects/actions";

function Feedback({ state, success }: { state: ActionResult | null; success?: string }) {
  if (!state) return null;
  if (state.ok) return success ? <p role="status" className="text-sm text-ok-ink">{success}</p> : null;
  return <p role="alert" className="text-sm font-medium text-danger">{state.error}</p>;
}

export function CreateProjectForm({ limitReached }: { limitReached: boolean }) {
  const [state, action, pending] = useActionState(createProject, null);
  const [upgrade, setUpgrade] = useState(false);
  useEffect(() => {
    if (state && !state.ok && state.code === "limit") setUpgrade(true);
  }, [state]);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (limitReached) {
          e.preventDefault();
          setUpgrade(true);
        }
      }}
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <div className="grid gap-1.5">
        <Label htmlFor="new-name">Nama project</Label>
        <Input id="new-name" name="name" required maxLength={120} placeholder="Gedung kantor pusat" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new-client">Klien (opsional)</Label>
        <Input id="new-client" name="client_name" maxLength={120} />
      </div>
      <Button type="submit" disabled={pending}>
        Buat project
      </Button>
      <div className="sm:col-span-3">
        <Feedback state={state} />
      </div>
      <UpgradeDialog open={upgrade} onOpenChange={setUpgrade} />
    </form>
  );
}

export function EditProjectForm({ project }: { project: { id: string; name: string; client_name: string | null; notes: string | null } }) {
  const [state, action, pending] = useActionState(updateProject, null);
  return (
    <form action={action} className="grid gap-3">
      <input type="hidden" name="id" value={project.id} />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="p-name">Nama project</Label>
          <Input id="p-name" name="name" defaultValue={project.name} required maxLength={120} />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="p-client">Klien</Label>
          <Input id="p-client" name="client_name" defaultValue={project.client_name ?? ""} maxLength={120} />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="p-notes">Catatan</Label>
        <Textarea id="p-notes" name="notes" defaultValue={project.notes ?? ""} maxLength={4000} />
      </div>
      <div className="flex items-center justify-end gap-3">
        <Feedback state={state} success="Perubahan disimpan." />
        <Button type="submit" variant="secondary" disabled={pending}>
          Simpan perubahan
        </Button>
      </div>
    </form>
  );
}

export function AddRoomForm({ projectId }: { projectId: string }) {
  const [state, action, pending] = useActionState(createRoom, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="project_id" value={projectId} />
      <div className="grid min-w-56 flex-1 gap-1.5">
        <Label htmlFor="room-name">Ruang baru</Label>
        <Input id="room-name" name="name" required maxLength={120} placeholder="Training room lantai 3" />
      </div>
      <Button type="submit" variant="secondary" disabled={pending}>
        Tambah ruang
      </Button>
      <div className="basis-full">
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function CreateShareLinkForm({ projectId, isPro }: { projectId: string; isPro: boolean }) {
  const [state, action, pending] = useActionState(createShareLink, null);
  const [upgrade, setUpgrade] = useState(false);
  useEffect(() => {
    if (state && !state.ok && state.code === "pro") setUpgrade(true);
  }, [state]);
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!isPro) {
          e.preventDefault();
          setUpgrade(true);
        }
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <input type="hidden" name="project_id" value={projectId} />
      <div className="grid gap-1.5">
        <Label htmlFor="expiry">Berlaku</Label>
        <Select id="expiry" name="expiry" defaultValue="30" className="w-44">
          <option value="7">7 hari</option>
          <option value="30">30 hari</option>
          <option value="90">90 hari</option>
          <option value="never">Tanpa batas</option>
        </Select>
      </div>
      <Button type="submit" disabled={pending}>
        Buat link berbagi
      </Button>
      <div className="basis-full">
        <Feedback state={state} success="Link dibuat." />
      </div>
      <UpgradeDialog open={upgrade} onOpenChange={setUpgrade} reason="Link berbagi untuk klien adalah fitur Pro." />
    </form>
  );
}
