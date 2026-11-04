import { BarChart3 } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { DemoBanner } from "@/components/shared/demo-banner";
import { TeamPerformanceDashboard } from "@/components/team/team-performance-dashboard";
import { getMembers, getProjectTeams, getProjects, getTasks, getWorkspaceContext } from "@/lib/data/queries";

export default async function TeamPerformancePage() {
  // These queries are already scoped by project-level RLS. A collaborator sees
  // metrics only for projects shared with that account.
  const [members, tasks, projects, teams, context] = await Promise.all([
    getMembers(), getTasks(), getProjects(), getProjectTeams(), getWorkspaceContext(),
  ]);
  const manageableProjectIds = teams.filter((team) => team.canManage).map((team) => team.project.id);
  return (
    <div className="app-content">
      {context.demo && <DemoBanner/>}
      <PageHeading
        eyebrow="KOLABORASI / KINERJA"
        title="Kinerja tim proyek"
        description="Pilih proyek untuk melihat tugas, anggota, dan produktivitas timnya secara terpisah."
        action={<span className="demo-mode-badge">DATA PROYEK YANG DAPAT DIAKSES</span>}
      />
      {!context.user && !context.demo ? (
        <div className="panel empty-state"><BarChart3 size={24}/><strong>Sesi tidak tersedia</strong><p>Masuk kembali untuk melihat kinerja proyek.</p></div>
      ) : (
        <TeamPerformanceDashboard
          members={members}
          tasks={tasks}
          projects={projects}
          currentUserId={context.user?.id ?? ""}
          manageableProjectIds={manageableProjectIds}
        />
      )}
    </div>
  );
}
