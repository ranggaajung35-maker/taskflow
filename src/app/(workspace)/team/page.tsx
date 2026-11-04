import Link from "next/link";
import { ArrowUpRight, FolderKanban, LockKeyhole, Users2 } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { DemoBanner } from "@/components/shared/demo-banner";
import { getProjectTeams, getWorkspaceContext } from "@/lib/data/queries";
import { initials } from "@/lib/utils";

export default async function TeamPage() {
  const [teams, context] = await Promise.all([getProjectTeams(), getWorkspaceContext()]);
  const collaboratorCount = new Set(teams.flatMap((team) => team.members.filter((member) => member.role !== "owner").map((member) => member.user_id))).size;
  const managedProjects = teams.filter((team) => team.canManage).length;

  return <div className="app-content">
    {context.demo && <DemoBanner/>}
    <PageHeading
      eyebrow="KOLABORASI / PROYEK"
      title="Kolaborasi proyek"
      description="Setiap proyek adalah ruang kolaborasi terpisah seperti repository. Anggota hanya melihat proyek yang secara khusus dibagikan kepada mereka."
      action={<span className="demo-mode-badge">{teams.length} PROYEK TERLIHAT</span>}
    />
    <div className="stat-grid mb-5">
      <div className="stat-card"><div className="stat-top">Proyek yang dapat diakses</div><div className="stat-value">{teams.length}</div><div className="stat-foot">Dibagikan atau dimiliki olehmu</div></div>
      <div className="stat-card"><div className="stat-top">Kolaborator unik</div><div className="stat-value">{collaboratorCount}</div><div className="stat-foot">Di proyek yang dapat diakses</div></div>
      <div className="stat-card"><div className="stat-top">Proyek yang dapat dikelola</div><div className="stat-value">{managedProjects}</div><div className="stat-foot">Owner atau Project Manager</div></div>
      <div className="stat-card"><div className="stat-top">Model akses</div><div className="stat-value text-emerald-300">Per proyek</div><div className="stat-foot">Tidak berbagi seluruh workspace</div></div>
    </div>

    {teams.length ? <div className="grid gap-4 xl:grid-cols-2">
      {teams.map((team) => {
        const tasks = team.project.tasks_count ?? 0;
        const done = team.project.completed_count ?? 0;
        const progress = tasks ? Math.round(done / tasks * 100) : 0;
        return <section key={team.project.id} className="panel overflow-hidden">
          <div className="panel-header"><div className="min-w-0"><div className="page-eyebrow">RUANG PROYEK</div><h2 className="section-title truncate">{team.project.name}</h2><p className="section-subtitle">{team.project.description || "Tidak ada deskripsi proyek."}</p></div><FolderKanban size={18} className="shrink-0 text-violet-300"/></div>
          <div className="panel-body space-y-3">
            <div className="flex items-center justify-between text-[9px] text-slate-400"><span>{team.members.length} orang dalam tim proyek</span><span>{done}/{tasks} tugas selesai · {progress}%</span></div>
            <div className="mini-progress"><span style={{ width: `${progress}%` }}/></div>
            <div className="flex flex-wrap items-center gap-2">
              {team.members.slice(0, 7).map((member) => <div key={member.user_id} title={`${member.full_name} · ${member.role}`} className="flex items-center gap-2 rounded-full border border-white/[.07] bg-white/[.025] py-1 pl-1 pr-2"><span className="user-avatar !h-6 !w-6 text-[8px]">{initials(member.full_name)}</span><span className="text-[9px] text-slate-300">{member.full_name}</span></div>)}
              {team.members.length > 7 && <span className="text-[9px] text-slate-500">+{team.members.length - 7} lainnya</span>}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-white/[.06] px-4 py-3">
            <span className="flex items-center gap-1.5 text-[9px] text-slate-500"><LockKeyhole size={12}/> Akses terbatas pada proyek ini</span>
            <Link href={`/projects/${team.project.id}`} className="btn-primary btn-small">Buka proyek <ArrowUpRight size={13}/></Link>
          </div>
        </section>;
      })}
    </div> : <div className="panel empty-state"><Users2 size={25}/><strong>Belum ada kolaborasi proyek</strong><p>Buat proyek terlebih dahulu, lalu undang anggota dari halaman detail proyek. Teman yang diundang hanya memperoleh akses ke proyek tersebut.</p><Link href="/projects" className="btn-primary btn-small mt-2">Lihat proyek <ArrowUpRight size={13}/></Link></div>}
  </div>;
}
