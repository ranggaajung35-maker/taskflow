"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CalendarDays, ChevronDown, CircleHelp, FolderKanban, LayoutDashboard, LogOut, Settings2, Users2, X, CheckSquare } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { initials } from "@/lib/utils";

type Props = { userName: string; email: string; workspaceName: string; role: string; demo: boolean; open: boolean; onClose: () => void; signOutAction: () => Promise<void> };

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tasks", label: "Tugas", icon: CheckSquare },
  { href: "/projects", label: "Proyek", icon: FolderKanban },
  { href: "/calendar", label: "Kalender", icon: CalendarDays },
];
const manageLinks = [
  { href: "/analytics", label: "Analitik", icon: BarChart3 },
  { href: "/team", label: "Anggota tim", icon: Users2 },
  { href: "/settings", label: "Pengaturan", icon: Settings2 },
];

export function Sidebar({ userName, email, workspaceName, role, demo, open, onClose, signOutAction }: Props) {
  const pathname = usePathname();
  return (
    <>
      {open && <button aria-label="Tutup menu" className="fixed inset-0 z-20 bg-black/50 md:hidden" onClick={onClose} />}
      <aside className={`app-sidebar ${open ? "mobile-open" : ""}`}>
        <div className="sidebar-brand"><Link href="/dashboard" onClick={onClose}><Logo/></Link><button className="icon-button md:hidden" onClick={onClose} aria-label="Tutup menu"><X size={16}/></button></div>
        <div className="workspace-switcher"><div className="workspace-avatar">{initials(workspaceName)}</div><div className="min-w-0 flex-1"><strong className="truncate">{workspaceName}</strong><small>{demo ? "Mode pratinjau" : role === "owner" ? "Owner workspace" : "Workspace team"}</small></div><ChevronDown size={13} className="text-slate-500"/></div>
        <div className="sidebar-caption">WORKSPACE</div>
        <nav className="sidebar-nav">{mainLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={onClose} className={`sidebar-link ${pathname === href ? "active" : ""}`}><Icon/><span>{label}</span></Link>)}</nav>
        <div className="sidebar-caption mt-5">MANAJEMEN</div>
        <nav className="sidebar-nav">{manageLinks.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={onClose} className={`sidebar-link ${pathname === href ? "active" : ""}`}><Icon/><span>{label}</span></Link>)}</nav>
        <div className="sidebar-bottom">
          <Link href="/settings#help" className="sidebar-link"><CircleHelp/><span>Pusat bantuan</span></Link>
          <div className="sidebar-user"><div className="user-avatar">{initials(userName)}</div><div className="min-w-0 flex-1"><strong className="truncate">{userName}</strong><small className="truncate">{email || "demo@taskflow.app"}</small></div><form action={signOutAction}><button title="Keluar" className="icon-button" type="submit"><LogOut size={14}/></button></form></div>
        </div>
      </aside>
    </>
  );
}
