import { PageHeading } from "@/components/shared/page-heading";
import { DemoBanner } from "@/components/shared/demo-banner";
import { TaskBoard } from "@/components/tasks/task-board";
import { getMembers, getProjects, getTasks, getWorkspaceContext } from "@/lib/data/queries";

export default async function TasksPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, tasks, projects, members, context] = await Promise.all([searchParams, getTasks(), getProjects(), getMembers(), getWorkspaceContext()]);
  return <div className="app-content">
    {context.demo && <DemoBanner/>}
    <PageHeading eyebrow="PROYEK / TUGAS" title="Manajemen tugas" description="Atur prioritas, tenggat, dan progres tugas dari proyek yang kamu miliki atau yang dibagikan kepadamu."/>
    <div className="stat-grid mb-5"><div className="stat-card"><div className="stat-top">Total tugas</div><div className="stat-value">{tasks.length}</div><div className="stat-foot">Semua status</div></div><div className="stat-card"><div className="stat-top">Belum mulai</div><div className="stat-value">{tasks.filter((task) => task.status === "todo").length}</div><div className="stat-foot">Menunggu dikerjakan</div></div><div className="stat-card"><div className="stat-top">Dikerjakan</div><div className="stat-value">{tasks.filter((task) => task.status === "in_progress").length}</div><div className="stat-foot">Sedang berlangsung</div></div><div className="stat-card"><div className="stat-top">Selesai</div><div className="stat-value">{tasks.filter((task) => task.status === "done").length}</div><div className="stat-foot">Sudah dituntaskan</div></div></div>
    <TaskBoard initialTasks={tasks} projects={projects} members={members} query={q ?? ""}/>
  </div>;
}
