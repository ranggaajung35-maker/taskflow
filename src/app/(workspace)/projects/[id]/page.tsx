import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, FolderKanban, LockKeyhole, Users2 } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { TaskBoard } from "@/components/tasks/task-board";
import { InviteProjectDialog } from "@/components/team/invite-project-dialog";
import { getProjectById, getProjectTeam, getTasks } from "@/lib/data/queries";
import { initials } from "@/lib/utils";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [project, allTasks, team] = await Promise.all([
    getProjectById(id),
    getTasks(),
    getProjectTeam(id),
  ]);
  if (!project || !team) notFound();

  const tasks = allTasks.filter((task) => task.project_id === id);
  const members = team.members;
  const completed = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "in_progress").length;
  const overdue = tasks.filter((task) => task.status !== "done" && task.due_date && task.due_date < new Date().toISOString().slice(0, 10)).length;
  const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

  return <div className="app-content">
    <Link href="/projects" className="mb-4 inline-flex items-center gap-2 text-[10px] text-slate-500 hover:text-violet-200"><ArrowLeft size={13}/> Semua proyek</Link>
    <PageHeading
      eyebrow="PROYEK / RUANG KOLABORASI"
      title={project.name}
      description={project.description || "Ruang kerja khusus proyek ini. Anggota hanya dapat melihat tugas dan diskusi proyek yang mereka ikuti."}
      action={<InviteProjectDialog projectId={project.id} projectName={project.name} canManage={team.canManage}/>}
    />

    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="min-w-0 space-y-4">
        <div className="stat-grid">
          <div className="stat-card"><div className="stat-top">Total tugas</div><div className="stat-value">{tasks.length}</div><div className="stat-foot">Di proyek ini saja</div></div>
          <div className="stat-card"><div className="stat-top">Dikerjakan</div><div className="stat-value">{inProgress}</div><div className="stat-foot">Sedang berjalan</div></div>
          <div className="stat-card"><div className="stat-top">Selesai</div><div className="stat-value text-emerald-300">{completed}</div><div className="stat-foot">{progress}% penyelesaian</div></div>
          <div className="stat-card"><div className="stat-top">Terlambat</div><div className="stat-value text-amber-200">{overdue}</div><div className="stat-foot">Perlu ditinjau</div></div>
        </div>
        <section className="panel p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><div><h2 className="section-title">Tugas proyek</h2><p className="section-subtitle">Tugas dan diskusi di ruang {project.name}</p></div><FolderKanban size={17} className="text-violet-300"/></div>
          <TaskBoard initialTasks={tasks} projects={[project]} members={members} fixedProjectId={project.id}/>
        </section>
      </div>

      <aside className="space-y-4">
        <section className="panel">
          <div className="panel-header"><div><h2 className="section-title">Tim proyek</h2><p className="section-subtitle">Hanya anggota yang diundang ke proyek ini</p></div><Users2 size={16} className="text-violet-300"/></div>
          <div className="divide-y divide-white/[.06]">
            {members.map((member) => <div key={member.user_id} className="flex items-center gap-3 px-4 py-3">
              <div className="user-avatar">{initials(member.full_name)}</div>
              <div className="min-w-0 flex-1"><strong className="block truncate text-[10px] text-slate-200">{member.full_name}</strong><span className="block truncate text-[9px] text-slate-500">{member.email}</span></div>
              <span className="status-pill status-in_progress">{member.role === "owner" ? "Owner" : member.role === "manager" ? "Manager" : "Member"}</span>
            </div>)}
            {members.length === 0 && <div className="empty-state py-8"><Users2 size={22}/><strong>Belum ada anggota</strong><p>Undang orang untuk berkolaborasi hanya di proyek ini.</p></div>}
          </div>
          <div className="border-t border-white/[.06] px-4 py-3"><div className="flex items-start gap-2 text-[9px] leading-relaxed text-slate-500"><LockKeyhole size={13} className="mt-0.5 shrink-0 text-emerald-300"/>Akses anggota terbatas pada proyek ini. Proyek lain milik pemilik tetap privat.</div></div>
        </section>
        <section className="panel p-4">
          <h2 className="section-title">Progres proyek</h2>
          <div className="mt-3 flex items-end justify-between"><span className="text-[10px] text-slate-400">Penyelesaian tugas</span><strong className="text-lg text-slate-100">{progress}%</strong></div>
          <div className="mini-progress mt-2"><span style={{ width: `${progress}%` }}/></div>
          <p className="mt-2 text-[9px] text-slate-500">{completed} dari {tasks.length} tugas selesai.</p>
        </section>
      </aside>
    </div>
  </div>;
}
