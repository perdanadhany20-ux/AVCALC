"use client";

import { Save } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { UpgradeDialog } from "@/components/upgrade-dialog";
import { getSaveTargets, saveCalculation, type SaveTargets } from "@/app/projects/actions";
import type { CalcId, Values } from "@/lib/present/types";

const NEW = "__new";

export function SaveToProject({ calculator, input }: { calculator: CalcId; input: Values }) {
  const [targets, setTargets] = useState<SaveTargets | null>(null);
  const [dialog, setDialog] = useState<"none" | "login" | "save" | "upgrade" | "done">("none");
  const [projectId, setProjectId] = useState(NEW);
  const [roomId, setRoomId] = useState(NEW);
  const [error, setError] = useState<string | null>(null);
  const [savedProject, setSavedProject] = useState<string | null>(null);
  const [loading, startLoading] = useTransition();
  const [saving, startSaving] = useTransition();

  const open = () =>
    startLoading(async () => {
      setError(null);
      const t = await getSaveTargets();
      setTargets(t);
      if (!t.loggedIn) return setDialog("login");
      const first = t.projects[0];
      setProjectId(first?.id ?? NEW);
      setRoomId(first?.rooms[0]?.id ?? NEW);
      setDialog("save");
    });

  const project = targets?.projects.find((p) => p.id === projectId);
  const limitReached = Boolean(targets && !targets.isPro && targets.projects.length >= 1);

  const onProjectChange = (id: string) => {
    if (id === NEW && limitReached) return setDialog("upgrade");
    setProjectId(id);
    setRoomId(targets?.projects.find((p) => p.id === id)?.rooms[0]?.id ?? NEW);
  };

  const submit = (fd: FormData) =>
    startSaving(async () => {
      setError(null);
      const str = (k: string) => {
        const v = fd.get(k);
        return typeof v === "string" && v.trim() ? v.trim() : undefined;
      };
      const res = await saveCalculation({
        calculator,
        input,
        roomId: roomId !== NEW ? roomId : undefined,
        projectId: projectId !== NEW ? projectId : undefined,
        newRoomName: roomId === NEW ? str("newRoomName") : undefined,
        newProjectName: projectId === NEW ? str("newProjectName") : undefined,
        clientName: projectId === NEW ? str("clientName") : undefined,
      });
      if (res.ok) {
        setSavedProject(res.data?.projectId ?? null);
        setDialog("done");
      } else if (res.code === "limit") setDialog("upgrade");
      else if (res.code === "login") setDialog("login");
      else setError(res.error);
    });

  const next = typeof window !== "undefined" ? encodeURIComponent(window.location.pathname + window.location.search) : "";

  return (
    <>
      <div className="flex justify-end border-t border-border pt-5">
        <Button type="button" onClick={open} disabled={loading}>
          <Save className="h-4 w-4" aria-hidden />
          {loading ? "Memuat…" : "Simpan ke project"}
        </Button>
      </div>

      <Dialog open={dialog === "login"} onOpenChange={(o) => !o && setDialog("none")} title="Masuk untuk menyimpan" description="Hasil kalkulasi disimpan per ruang di dalam project. Akun gratis cukup untuk satu project.">
        <div className="flex flex-wrap justify-end gap-2">
          <Link href={`/signup?next=${next}`} className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-sunken">
            Daftar gratis
          </Link>
          <Link href={`/login?next=${next}`} className="inline-flex h-10 items-center rounded-md bg-line px-4 text-sm font-medium text-white hover:brightness-110">
            Masuk
          </Link>
        </div>
      </Dialog>

      <Dialog open={dialog === "save"} onOpenChange={(o) => !o && setDialog("none")} title="Simpan ke project">
        <form action={submit} className="grid gap-4">
          <div className="grid gap-1.5">
            <Label htmlFor="save-project">Project</Label>
            <Select id="save-project" value={projectId} onChange={(e) => onProjectChange(e.target.value)}>
              {targets?.projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
              <option value={NEW}>{limitReached ? "Project baru (Pro)" : "Project baru…"}</option>
            </Select>
          </div>
          {projectId === NEW ? (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="save-new-project">Nama project</Label>
                <Input id="save-new-project" name="newProjectName" required maxLength={120} placeholder="Renovasi ruang rapat lantai 5" />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="save-client">Nama klien (opsional)</Label>
                <Input id="save-client" name="clientName" maxLength={120} />
              </div>
            </>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="save-room">Ruang</Label>
            <Select id="save-room" value={roomId} onChange={(e) => setRoomId(e.target.value)}>
              {project?.rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
              <option value={NEW}>Ruang baru…</option>
            </Select>
          </div>
          {roomId === NEW ? (
            <div className="grid gap-1.5">
              <Label htmlFor="save-new-room">Nama ruang</Label>
              <Input id="save-new-room" name="newRoomName" required maxLength={120} placeholder="Boardroom" />
            </div>
          ) : null}
          {error ? <p role="alert" className="text-sm font-medium text-danger">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setDialog("none")}>
              Batal
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Menyimpan…" : "Simpan"}
            </Button>
          </div>
        </form>
      </Dialog>

      <Dialog open={dialog === "done"} onOpenChange={(o) => !o && setDialog("none")} title="Tersimpan" description="Kalkulasi sudah masuk ke project.">
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setDialog("none")}>
            Lanjut menghitung
          </Button>
          {savedProject ? (
            <Link href={`/projects/${savedProject}`} className="inline-flex h-10 items-center rounded-md bg-line px-4 text-sm font-medium text-white hover:brightness-110">
              Buka project
            </Link>
          ) : null}
        </div>
      </Dialog>

      <UpgradeDialog open={dialog === "upgrade"} onOpenChange={(o) => setDialog(o ? "upgrade" : targets?.loggedIn ? "save" : "none")} />
    </>
  );
}
