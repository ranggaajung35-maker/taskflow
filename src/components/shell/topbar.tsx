"use client";

import { useState } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";

const titles: Record<string, string> = {
  "/dashboard": "Overview", "/tasks": "Tugas", "/projects": "Proyek", "/calendar": "Kalender",
  "/analytics": "Analitik", "/team": "Anggota tim", "/settings": "Pengaturan", "/search": "Pencarian",
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [showNotice, setShowNotice] = useState(false);
  function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = search.trim();
    if (value) router.push(`/search?q=${encodeURIComponent(value)}`);
    else router.push("/search");
  }
  return (
    <header className="app-topbar">
      <div className="flex items-center gap-3"><button className="icon-button mobile-menu-button" onClick={onMenu} aria-label="Buka menu"><Menu size={17}/></button><div className="topbar-breadcrumb">Workspace <span className="mx-2 text-slate-700">/</span> <strong>{titles[pathname] ?? "TaskFlow"}</strong></div></div>
      <div className="topbar-actions">
        <form className="topbar-search" onSubmit={handleSearch} role="search"><Search size={14}/><input aria-label="Cari tugas, proyek, atau anggota" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Cari tugas, proyek, anggota..."/><kbd className="hidden lg:inline text-[8px] text-slate-600">↵</kbd><button type="submit" aria-label="Jalankan pencarian" title="Cari" className="ml-1 rounded-md p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"><Search size={13}/></button></form>
        <div className="relative"><button className="icon-button" onClick={() => setShowNotice((value) => !value)} aria-label="Notifikasi"><Bell size={15}/><span className="absolute top-[7px] right-[7px] w-1.5 h-1.5 rounded-full bg-violet-400"/></button>{showNotice && <div className="absolute right-0 top-11 z-50 w-64 rounded-xl border border-white/10 bg-[#171c32] p-4 shadow-2xl"><div className="flex items-center justify-between"><strong className="text-xs">Notifikasi</strong><button onClick={() => setShowNotice(false)} aria-label="Tutup"><X size={13}/></button></div><p className="text-[10px] text-slate-400 leading-relaxed mt-3">Kamu sudah up to date. Aktivitas terbaru akan muncul di sini.</p></div>}</div>
      </div>
    </header>
  );
}
