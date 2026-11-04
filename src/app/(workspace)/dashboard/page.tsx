import Link from "next/link";
import { Activity, ArrowUpRight, CheckCircle2, CircleDashed, Clock3, FolderKanban, Plus, Target } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { DemoBanner } from "@/components/shared/demo-banner";
import { StatCard } from "@/components/shared/stat-card";
import { CompletionChart } from "@/components/dashboard/completion-chart";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { RecentTasks } from "@/components/dashboard/recent-tasks";
import { FocusTimer } from "@/components/dashboard/focus-timer";
import { buildWeeklyTaskActivity, getActivities, getProjects, getTasks, getWorkspaceContext } from "@/lib/data/queries";
import { greeting } from "@/lib/utils";

export default async function DashboardPage() {
  const [tasks, projects, activities, context] = await Promise.all([getTasks(), getProjects(), getActivities(), getWorkspaceContext()]);
  const completed = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const overdue = tasks.filter((task) => task.due_date && task.status !== "done" && new Date(`${task.due_date}T23:59:59`) < new Date()).length;
  const completion = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const weeklyActivity = buildWeeklyTaskActivity(tasks).map(({ day, completed, created }) => ({ day, completed, created }));
  const name = (context.user?.user_metadata as { full_name?: string } | undefined)?.full_name || "Teman";

  return <div className="app-content">
    {context.demo && <DemoBanner/>}
    <PageHeading eyebrow="RINGKASAN WORKSPACE" title={`${greeting()}, ${name.split(" ")[0]} 👋`} description="Berikut gambaran pekerjaan dan progres workspace kamu hari ini." action={<Link href="/tasks" className="btn-primary btn-small"><Plus size={14}/> Buat tugas</Link>}/>
    <section className="stat-grid">
      <StatCard label="Total tugas" value={tasks.length} foot="Semua pekerjaan terdaftar" icon={CheckCircle2} tone="purple"/>
      <StatCard label="Sedang dikerjakan" value={inProgress} foot="Tugas dalam proses" icon={Clock3} tone="blue"/>
      <StatCard label="Tugas selesai" value={completed} foot={`${completion}% dari seluruh tugas`} icon={Target} tone="green"/>
      <StatCard label="Melewati tenggat" value={overdue} foot="Perlu segera ditinjau" icon={CircleDashed} tone="orange"/>
    </section>

    <section className="dashboard-grid">
      <div className="panel"><div className="panel-header"><div><h2 className="section-title">Aktivitas produktivitas</h2><p className="section-subtitle">Perbandingan tugas selesai dan tugas dibuat</p></div><span className="text-[8px] text-slate-500 border border-white/10 rounded-md px-2 py-1">7 hari terakhir</span></div><CompletionChart data={weeklyActivity}/></div>
      <div className="panel"><div className="panel-header"><div><h2 className="section-title">Aktivitas terbaru</h2><p className="section-subtitle">Update terbaru di workspace</p></div><Activity size={15} className="text-violet-300"/></div><div className="panel-body"><ActivityFeed activities={activities}/><div className="mt-5 pt-5 border-t border-white/[.06]"><FocusTimer/></div></div></div>
    </section>

    <section className="dashboard-grid mt-4">
      <div className="panel"><div className="panel-header"><div><h2 className="section-title">Tugas terbaru</h2><p className="section-subtitle">Pekerjaan yang perlu diperhatikan</p></div><Link href="/tasks" className="btn-quiet">Lihat semua <ArrowUpRight size={13}/></Link></div><div className="panel-body"><RecentTasks tasks={tasks}/></div></div>
      <div className="panel"><div className="panel-header"><div><h2 className="section-title">Ringkasan proyek</h2><p className="section-subtitle">Progres pekerjaan berdasarkan proyek</p></div><FolderKanban size={15} className="text-violet-300"/></div><div className="panel-body space-y-5">{projects.slice(0, 4).map((project) => { const total = project.tasks_count ?? 0; const done = project.completed_count ?? 0; const progress = total ? Math.round(done / total * 100) : 0; return <div key={project.id}><div className="flex items-center justify-between gap-3 mb-2"><strong className="text-[10px] text-slate-200 truncate">{project.name}</strong><span className="text-[9px] text-slate-500">{progress}%</span></div><div className="mini-progress"><span style={{ width: `${progress}%` }}/></div><p className="text-[8px] text-slate-600 mt-1">{done} / {total} tugas selesai</p></div>; })}{projects.length === 0 && <p className="text-[10px] text-slate-500">Belum ada proyek.</p>}<Link href="/projects" className="btn-quiet">Kelola proyek <ArrowUpRight size={13}/></Link></div></div>
    </section>
  </div>;
}
