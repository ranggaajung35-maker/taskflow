import Link from "next/link";
import { ArrowUpRight, FolderKanban, Search, Users2, ListTodo } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { getMembers, getProjects, getTasks, getWorkspaceContext } from "@/lib/data/queries";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, tasks, projects, members, context] = await Promise.all([searchParams, getTasks(), getProjects(), getMembers(), getWorkspaceContext()]);
  const query = (q ?? "").trim();
  const needle = query.toLowerCase();
  const matchedTasks = needle ? tasks.filter((item) => `${item.title} ${item.description ?? ""} ${item.project?.name ?? ""}`.toLowerCase().includes(needle)) : [];
  const matchedProjects = needle ? projects.filter((item) => `${item.name} ${item.description ?? ""}`.toLowerCase().includes(needle)) : [];
  const matchedMembers = needle ? members.filter((item) => `${item.full_name} ${item.email} ${item.role}`.toLowerCase().includes(needle)) : [];
  const total = matchedTasks.length + matchedProjects.length + matchedMembers.length;
  return <div className="app-content">
    <PageHeading eyebrow="PROYEK / PENCARIAN" title="Pencarian global" description="Cari tugas, proyek, dan anggota hanya dari proyek yang dapat kamu akses."/>
    {!query ? <div className="panel empty-state"><Search size={24}/><strong>Apa yang ingin kamu cari?</strong><p>Gunakan kolom pencarian di bagian atas, lalu tekan Enter atau tombol pencarian.</p></div> : <>
      <p className="mb-4 text-[10px] text-slate-400">{total} hasil untuk <strong className="text-slate-200">“{query}”</strong></p>
      <div className="grid gap-4">
        <section className="panel"><div className="panel-header"><div className="flex items-center gap-2"><ListTodo size={15} className="text-violet-300"/><div><h2 className="section-title">Tugas</h2><p className="section-subtitle">{matchedTasks.length} hasil</p></div></div></div><div className="divide-y divide-white/[.06]">{matchedTasks.map((item) => <Link key={item.id} href={`/tasks?q=${encodeURIComponent(item.title)}`} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-white/[.03]"><div className="min-w-0"><strong className="block truncate text-[10px] text-slate-200">{item.title}</strong><small className="text-[9px] text-slate-500">{item.project?.name ?? "Tanpa proyek"} · {item.status === "done" ? "Selesai" : item.status === "in_progress" ? "Dikerjakan" : "Belum mulai"}</small></div><ArrowUpRight size={14} className="shrink-0 text-violet-300"/></Link>)}{matchedTasks.length === 0 && <p className="px-5 pb-5 text-[10px] text-slate-500">Tidak ada tugas yang cocok.</p>}</div></section>
        <section className="panel"><div className="panel-header"><div className="flex items-center gap-2"><FolderKanban size={15} className="text-violet-300"/><div><h2 className="section-title">Proyek</h2><p className="section-subtitle">{matchedProjects.length} hasil</p></div></div></div><div className="divide-y divide-white/[.06]">{matchedProjects.map((item) => <Link key={item.id} href={`/projects?q=${encodeURIComponent(item.name)}`} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-white/[.03]"><div className="min-w-0"><strong className="block truncate text-[10px] text-slate-200">{item.name}</strong><small className="text-[9px] text-slate-500">{item.tasks_count ?? 0} tugas · {item.status === "completed" ? "Selesai" : "Aktif"}</small></div><ArrowUpRight size={14} className="shrink-0 text-violet-300"/></Link>)}{matchedProjects.length === 0 && <p className="px-5 pb-5 text-[10px] text-slate-500">Tidak ada proyek yang cocok.</p>}</div></section>
        <section className="panel"><div className="panel-header"><div className="flex items-center gap-2"><Users2 size={15} className="text-violet-300"/><div><h2 className="section-title">Anggota</h2><p className="section-subtitle">{matchedMembers.length} hasil</p></div></div></div><div className="divide-y divide-white/[.06]">{matchedMembers.map((item) => <Link key={item.id} href={`/team?q=${encodeURIComponent(item.email || item.full_name)}`} className="flex items-center justify-between gap-3 px-5 py-3 transition hover:bg-white/[.03]"><div className="min-w-0"><strong className="block truncate text-[10px] text-slate-200">{item.full_name}</strong><small className="text-[9px] text-slate-500">{item.email} · {item.role}</small></div><ArrowUpRight size={14} className="shrink-0 text-violet-300"/></Link>)}{matchedMembers.length === 0 && <p className="px-5 pb-5 text-[10px] text-slate-500">Tidak ada anggota yang cocok.</p>}</div></section>
      </div>
    </>}
    {!context.workspaceId && !context.demo && <p className="mt-4 text-[9px] text-amber-300">Workspace belum terhubung ke akun ini.</p>}
  </div>;
}
