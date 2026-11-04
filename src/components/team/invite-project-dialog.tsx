"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Link2, Mail, Shield, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { createProjectInviteAction } from "@/lib/actions/invitations";

export function InviteProjectDialog({ projectId, projectName, canManage }: { projectId: string; projectName: string; canManage: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "manager">("member");
  const [inviteUrl, setInviteUrl] = useState("");
  const [pending, startTransition] = useTransition();

  function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createProjectInviteAction({ projectId, email, role });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setInviteUrl(result.inviteUrl);
      toast.success("Undangan khusus proyek berhasil dibuat.");
    });
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Tautan undangan disalin. Bagikan hanya kepada orang yang diundang.");
    } catch {
      toast.error("Clipboard tidak tersedia. Salin tautan dari kolom undangan.");
    }
  }

  function close() {
    setOpen(false);
    setEmail("");
    setRole("member");
    setInviteUrl("");
  }

  return <>
    <button type="button" disabled={!canManage} onClick={() => setOpen(true)} className="btn-primary btn-small disabled:cursor-not-allowed disabled:opacity-50">
      <UserPlus size={13}/> Undang ke proyek
    </button>
    {open && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="modal-card">
        <div className="flex items-start justify-between gap-4">
          <div><h2>{inviteUrl ? "Undangan proyek siap" : "Undang ke proyek ini"}</h2><p>{projectName} · akses hanya untuk proyek ini.</p></div>
          <button type="button" className="icon-button" onClick={close} aria-label="Tutup"><X size={15}/></button>
        </div>
        {inviteUrl ? <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-3">
            <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-emerald-200"><Check size={14}/> Undangan untuk {email}</div>
            <div className="break-all rounded-lg bg-black/20 p-3 text-[10px] leading-relaxed text-slate-300">{inviteUrl}</div>
            <p className="mt-2 text-[9px] text-slate-500">Berlaku 7 hari. Setelah bergabung, penerima hanya dapat melihat proyek {projectName}, bukan proyek lain milikmu.</p>
          </div>
          <div className="modal-actions"><button type="button" className="btn-outline" onClick={close}>Selesai</button><button type="button" className="btn-primary" onClick={() => void copyInvite()}><Copy size={13}/> Salin tautan</button></div>
        </div> : <form onSubmit={createInvite} className="mt-3">
          <label className="field-label" htmlFor="project-invite-email">Email anggota *</label>
          <div className="relative"><Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input id="project-invite-email" className="field-control pl-9" type="email" required maxLength={254} placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)}/></div>
          <label className="field-label" htmlFor="project-invite-role">Peran dalam proyek</label>
          <div className="relative"><Shield size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><select id="project-invite-role" className="field-control pl-9" value={role} onChange={(event) => setRole(event.target.value as "member" | "manager")}><option value="member">Member — mengerjakan dan berdiskusi</option><option value="manager">Project Manager — mengelola tim proyek</option></select></div>
          <div className="mt-3 rounded-lg bg-white/[.035] p-3 text-[9px] leading-relaxed text-slate-400">Undangan ini tidak menambahkan penerima ke seluruh workspace. Akses diberikan hanya pada proyek ini, dan hanya jika penerima masuk dengan email yang diundang.</div>
          <div className="modal-actions"><button type="button" className="btn-outline" onClick={close}>Batal</button><button type="submit" className="btn-primary" disabled={pending}>{pending ? "Membuat tautan..." : "Buat undangan proyek"}<Link2 size={13}/></button></div>
        </form>}
      </div>
    </div>}
  </>;
}
