import { PageHeading } from "@/components/shared/page-heading";
import { DemoBanner } from "@/components/shared/demo-banner";
import { ProjectGrid } from "@/components/projects/project-grid";
import { getProjects, getWorkspaceContext } from "@/lib/data/queries";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, allProjects, context] = await Promise.all([searchParams, getProjects(), getWorkspaceContext()]);
  const query = (q ?? "").trim().toLowerCase();
  const projects = query ? allProjects.filter((project) => `${project.name} ${project.description ?? ""}`.toLowerCase().includes(query)) : allProjects;
  const active = projects.filter((project) => project.status === "active").length;
  const completed = projects.filter((project) => project.status === "completed").length;
  return <div className="app-content">
    {context.demo && <DemoBanner/>}
    <PageHeading eyebrow="WORKSPACE / PROYEK" title="Semua proyek" description={query ? `${projects.length} hasil proyek untuk “${q}”.` : "Kelompokkan pekerjaan berdasarkan tujuan dan pantau perkembangan setiap proyek."}/>
    <div className="stat-grid mb-5"><div className="stat-card"><div className="stat-top">{query ? "Proyek ditemukan" : "Total proyek"}</div><div className="stat-value">{projects.length}</div><div className="stat-foot">Di workspace ini</div></div><div className="stat-card"><div className="stat-top">Proyek aktif</div><div className="stat-value">{active}</div><div className="stat-foot">Sedang berjalan</div></div><div className="stat-card"><div className="stat-top">Selesai</div><div className="stat-value">{completed}</div><div className="stat-foot">Sudah dituntaskan</div></div><div className="stat-card"><div className="stat-top">Total tugas proyek</div><div className="stat-value">{projects.reduce((sum, project) => sum + (project.tasks_count ?? 0), 0)}</div><div className="stat-foot">Seluruh proyek</div></div></div>
    <ProjectGrid initialProjects={projects}/>
  </div>;
}
