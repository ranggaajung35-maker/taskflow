"use client";

import { useState, useTransition } from "react";
import { Check, Copy, Link2, Mail, Plus, Shield, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import { createWorkspaceInviteAction } from "@/lib/actions/invitations";

export function InviteMemberDialog({ canInvite }: { canInvite: boolean }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "admin">("member");
  const [inviteUrl, setInviteUrl] = useState("");
  const [pending, startTransition] = useTransition();

  function createInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createWorkspaceInviteAction({ email, role });
      if (!result.ok) { toast.error(result.message); return; }
      setInviteUrl(result.inviteUrl);
      toast.success("Tautan undangan berhasil dibuat.");
    });
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      toast.success("Tautan undangan disalin. Kirim kepada orang yang diundang.");
    } catch {
      toast.error("Tidak dapat menyalin otomatis. Salin tautan dari kolom yang tersedia.");
    }
  }

  function close() {
    setOpen(false);
    setEmail("");
    setRole("member");
    setInviteUrl("");
  }

  return <>
    <button type="button" disabled={!canInvite} onClick={() => setOpen(true)} className="btn-outline disabled:cursor-not-allowed disabled:opacity-50"><UserPlus size={14}/> Undang anggota</button>
    {open && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div className="modal-card">
        <div className="flex items-start justify-between gap-4">
          <div><h2>{inviteUrl ? "Tautan undangan siap" : "Undang anggota workspace"}</h2><p>{inviteUrl ? "Bagikan tautan ini kepada orang yang kamu undang." : "Buat tautan undangan yang berlaku selama 7 hari."}</p></div>
          <button type="button" className="icon-button" onClick={close} aria-label="Tutup"><X size={15}/></button>
        </div>
        {inviteUrl ? <div className="mt-4 space-y-3">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/[.06] p-3"><div className="mb-2 flex items-center gap-2 text-[10px] font-semibold text-emerald-200"><Check size={14}/> Undangan untuk {email}</div><div className="break-all rounded-lg bg-black/20 p-3 text-[10px] leading-relaxed text-slate-300">{inviteUrl}</div><p className="mt-2 text-[9px] text-slate-500">Tautan berlaku 7 hari dan hanya dapat diterima oleh akun dengan email yang diundang.</p></div>
          <div className="modal-actions"><button type="button" className="btn-outline" onClick={close}>Selesai</button><button type="button" className="btn-primary" onClick={() => void copyInvite()}><Copy size={13}/> Salin tautan</button></div>
        </div> : <form onSubmit={createInvite} className="mt-3">
          <label className="field-label" htmlFor="invite-email">Email orang yang diundang *</label>
          <div className="relative"><Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><input id="invite-email" className="field-control pl-9" type="email" required maxLength={254} placeholder="nama@email.com" value={email} onChange={(event) => setEmail(event.target.value)}/></div>
          <label className="field-label" htmlFor="invite-role">Peran</label>
          <div className="relative"><Shield size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"/><select id="invite-role" className="field-control pl-9" value={role} onChange={(event) => setRole(event.target.value as "member" | "admin")}><option value="member">Member — dapat bekerja di workspace</option><option value="admin">Admin — dapat mengelola workspace</option></select></div>
          <div className="mt-3 rounded-lg bg-white/[.035] p-3 text-[9px] leading-relaxed text-slate-400">Undangan dibuat sebagai tautan aman, bukan dikirim lewat email. Penerima harus masuk atau mendaftar memakai alamat email yang sama dengan alamat undangan.</div>
          <div className="modal-actions"><button type="button" className="btn-outline" onClick={close}>Batal</button><button type="submit" className="btn-primary" disabled={pending}>{pending ? "Membuat tautan..." : "Buat tautan undangan"}<Link2 size={13}/></button></div>
        </form>}
      </div>
    </div>}
  </>;
}
