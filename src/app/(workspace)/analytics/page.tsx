import { Activity, CheckCircle2, Clock3, Target, TrendingUp } from "lucide-react";
import { AnalyticsCharts } from "@/components/analytics/analytics-charts";
import { PageHeading } from "@/components/shared/page-heading";
import { DemoBanner } from "@/components/shared/demo-banner";
import { StatCard } from "@/components/shared/stat-card";
import { buildWeeklyTaskActivity, getProjects, getTasks, getWorkspaceContext } from "@/lib/data/queries";


export default async function AnalyticsPage() {
  const [tasks, projects, context] = await Promise.all([getTasks(), getProjects(), getWorkspaceContext()]);
  const done = tasks.filter((task) => task.status === "done").length;
  const high = tasks.filter((task) => task.priority === "high" && task.status !== "done").length;
  const activeProjects = projects.filter((project) => project.status === "active").length;
  const pending = tasks.length - done;
  const weeklyData = buildWeeklyTaskActivity(tasks).map(({ day, completed }) => ({ day, value: completed }));
  const distribution = [
    { name: "Selesai", value: done, color: "#60dcb0" },
    { name: "Dikerjakan", value: tasks.filter((task) => task.status === "in_progress").length, color: "#9b7aff" },
    { name: "Belum mulai", value: tasks.filter((task) => task.status === "todo").length, color: "#638dff" },
  ].filter((item) => item.value > 0);
  return <div className="app-content">
    {context.demo && <DemoBanner/>}
    <PageHeading eyebrow="WORKSPACE / ANALITIK" title="Analitik produktivitas" description="Pahami progres pekerjaan berdasarkan data aktual workspace kamu." action={<span className="demo-mode-badge">RINGKASAN WORKSPACE</span>}/>
    <section className="stat-grid"><StatCard label="Tingkat penyelesaian" value={`${tasks.length ? Math.round(done / tasks.length * 100) : 0}%`} foot="Tugas yang berhasil dituntaskan" icon={Target} tone="green"/><StatCard label="Tugas terbuka" value={pending} foot="Belum selesai" icon={Clock3} tone="blue"/><StatCard label="Prioritas tinggi" value={high} foot="Perlu perhatian" icon={Activity} tone="orange"/><StatCard label="Proyek aktif" value={activeProjects} foot="Sedang berjalan" icon={TrendingUp} tone="purple"/></section>
    <AnalyticsCharts distribution={distribution} weeklyData={weeklyData}/>
    <section className="panel mt-4"><div className="panel-header"><div><h2 className="section-title">Progres proyek</h2><p className="section-subtitle">Perbandingan penyelesaian tugas di setiap proyek</p></div><CheckCircle2 size={15} className="text-emerald-300"/></div><div className="panel-body space-y-5">{projects.map((project) => { const total = project.tasks_count ?? 0; const completed = project.completed_count ?? 0; const value = total ? Math.round(completed / total * 100) : 0; return <div key={project.id}><div className="flex items-center justify-between mb-2 gap-3"><strong className="text-[10px] text-slate-200">{project.name}</strong><span className="text-[9px] text-slate-400">{completed}/{total} tugas · {value}%</span></div><div className="mini-progress"><span style={{ width: `${value}%` }}/></div></div>; })}{projects.length === 0 && <p className="text-[10px] text-slate-500">Belum ada data proyek.</p>}</div></section>
    <p className="text-[8px] text-slate-600 mt-4">Grafik dan statistik dihitung dari tugas yang tersimpan di workspace ini.</p>
  </div>;
}
