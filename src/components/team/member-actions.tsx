"use client";

import { useState } from "react";
import { Check, Mail, MoreHorizontal, Shield, UserRound } from "lucide-react";
import { toast } from "sonner";

type Props = { name: string; email: string; role: string };

export function MemberActions({ name, email, role }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<"name" | "email" | null>(null);

  async function copy(value: string, kind: "name" | "email") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success(kind === "email" ? "Email anggota disalin." : "Nama anggota disalin.");
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      toast.error("Clipboard tidak tersedia di browser ini.");
    }
    setOpen(false);
  }

  return <div className="relative inline-flex justify-end">
    <button type="button" className="icon-button" aria-label={`Opsi ${name}`} aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
      <MoreHorizontal size={14}/>
    </button>
    {open && <>
      <button type="button" aria-label="Tutup menu opsi" className="fixed inset-0 z-40 cursor-default" onClick={() => setOpen(false)}/>
      <div role="menu" className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-xl border border-white/10 bg-[#171c32] p-1.5 shadow-2xl">
        <div className="border-b border-white/[.07] px-3 py-2">
          <p className="truncate text-[10px] font-semibold text-slate-100">{name}</p>
          <p className="truncate text-[9px] text-slate-500">{role === "owner" ? "Pemilik proyek" : role === "manager" ? "Project Manager" : "Anggota proyek"}</p>
        </div>
        <button role="menuitem" type="button" onClick={() => void copy(name, "name")} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[10px] text-slate-300 hover:bg-white/[.06]">
          {copied === "name" ? <Check size={13} className="text-emerald-300"/> : <UserRound size={13}/>} Salin nama
        </button>
        <button role="menuitem" type="button" onClick={() => void copy(email, "email")} disabled={!email} className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-[10px] text-slate-300 hover:bg-white/[.06] disabled:opacity-40">
          {copied === "email" ? <Check size={13} className="text-emerald-300"/> : <Mail size={13}/>} Salin alamat email
        </button>
        <div className="flex items-center gap-2 border-t border-white/[.07] px-3 py-2 text-[9px] text-slate-500"><Shield size={12}/> Peran: {role}</div>
      </div>
    </>}
  </div>;
}
