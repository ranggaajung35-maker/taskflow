import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Activity, Project, ProjectMember, ProjectTeam, Task } from "@/lib/types";

/** Resolve the signed-in user's personal workspace. Project access is enforced separately by project RLS. */
export async function getWorkspaceContext() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) {
    return {
      demo: true,
      user: { id: "demo-user", email: "", user_metadata: { full_name: "Pengguna" } },
      workspaceId: null,
      workspaceName: "Workspace pribadi kamu",
      role: "owner",
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { demo: false, user: null, workspaceId: null, workspaceName: "Workspace", role: null };

  const { data: personalWorkspace, error } = await supabase
    .from("workspaces")
    .select("id, name")
    .eq("created_by", user.id)
    .maybeSingle();

  if (error) console.error("Gagal memuat workspace pribadi:", error.message);
  return {
    demo: false,
    user,
    workspaceId: personalWorkspace?.id ?? null,
    workspaceName: personalWorkspace?.name ?? "Workspace pribadi kamu",
    role: personalWorkspace?.id ? "owner" : null,
  };
}

/** RLS returns only tasks belonging to projects the signed-in user can access. */
export async function getTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects(name)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Gagal memuat tugas proyek yang dapat diakses:", error.message);
    return [];
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const assigneeIds = [...new Set(rows.map((row) => String(row.assignee_id ?? "")).filter(Boolean))];
  const profilesById = new Map<string, { full_name: string | null; avatar_url?: string | null }>();
  if (assigneeIds.length) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", assigneeIds);
    if (profilesError) console.error("Gagal memuat profil penanggung jawab:", profilesError.message);
    for (const profile of profiles ?? []) profilesById.set(String(profile.id), {
      full_name: profile.full_name ?? null,
      avatar_url: profile.avatar_url ?? null,
    });
  }

  return rows.map((row) => {
    const assigneeId = row.assignee_id ? String(row.assignee_id) : null;
    return {
      ...row,
      assignee_id: assigneeId,
      project: row.projects as { name: string } | null,
      assignee: assigneeId ? profilesById.get(assigneeId) ?? null : null,
    };
  }) as Task[];
}

/** Visible projects are calculated by project_members RLS, never by workspace membership. */
export async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("*, tasks(id,status)")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("Gagal memuat proyek:", error.message);
    return [];
  }
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const tasks = (row.tasks as Array<{ id: string; status: string }> | null) ?? [];
    return {
      ...row,
      tasks_count: tasks.length,
      completed_count: tasks.filter((task) => task.status === "done").length,
    } as Project;
  });
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  if (!isSupabaseConfigured() || !projectId) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).maybeSingle();
  if (error) {
    console.error("Gagal memuat detail proyek:", error.message);
    return null;
  }
  return data as Project | null;
}

export async function getProjectTeam(projectId: string): Promise<ProjectTeam | null> {
  if (!isSupabaseConfigured() || !projectId) return null;
  const supabase = await createSupabaseServerClient();
  if (!supabase) return null;
  const [{ data: project, error: projectError }, { data: { user } }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", projectId).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (projectError || !project) return null;

  const { data: memberships, error: memberError } = await supabase
    .from("project_members")
    .select("id, user_id, role, profiles(full_name, email, avatar_url)")
    .eq("project_id", projectId);
  if (memberError) console.error("Gagal memuat anggota proyek:", memberError.message);

  const members: ProjectMember[] = [];
  const seen = new Set<string>();
  const creatorId = String(project.created_by);
  const { data: creatorProfile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .eq("id", creatorId)
    .maybeSingle();
  if (creatorProfile) {
    seen.add(creatorId);
    members.push({
      id: `owner-${project.id}`,
      user_id: creatorId,
      full_name: creatorProfile.full_name ?? "Pemilik proyek",
      email: creatorProfile.email ?? "",
      role: "owner",
      avatar_url: creatorProfile.avatar_url,
      project_ids: [projectId],
      project_names: [project.name],
      project_roles: { [projectId]: "owner" },
    });
  }

  for (const row of memberships ?? []) {
    const userId = String(row.user_id);
    if (seen.has(userId)) continue;
    seen.add(userId);
    const profile = row.profiles as { full_name?: string; email?: string; avatar_url?: string | null } | null;
    members.push({
      id: String(row.id),
      user_id: userId,
      full_name: profile?.full_name ?? "Anggota proyek",
      email: profile?.email ?? "",
      role: row.role as ProjectMember["role"],
      avatar_url: profile?.avatar_url,
      project_ids: [projectId],
      project_names: [project.name],
      project_roles: { [projectId]: row.role as ProjectMember["role"] },
    });
  }

  const canManage = Boolean(user && (
    user.id === project.created_by ||
    members.some((member) => member.user_id === user.id && member.role === "manager")
  ));
  return { project: project as Project, members, canManage };
}

/** Aggregate only the members from projects visible to this user. No workspace-wide roster is returned. */
export async function getMembers(): Promise<ProjectMember[]> {
  if (!isSupabaseConfigured()) return [];
  const teams = await getProjectTeams();
  const aggregated = new Map<string, ProjectMember>();
  for (const team of teams) {
    for (const member of team.members) {
      const existing = aggregated.get(member.user_id);
      if (existing) {
        if (!existing.project_ids.includes(team.project.id)) existing.project_ids.push(team.project.id);
        if (!existing.project_names.includes(team.project.name)) existing.project_names.push(team.project.name);
        existing.project_roles = { ...(existing.project_roles ?? {}), [team.project.id]: member.role };
        if (member.role === "owner" || (member.role === "manager" && existing.role === "member")) existing.role = member.role;
      } else {
        aggregated.set(member.user_id, {
          ...member,
          project_ids: [team.project.id],
          project_names: [team.project.name],
          project_roles: { [team.project.id]: member.role },
        });
      }
    }
  }
  return [...aggregated.values()];
}

export async function getProjectTeams(): Promise<ProjectTeam[]> {
  const projects = await getProjects();
  const teams = await Promise.all(projects.map((project) => getProjectTeam(project.id)));
  return teams.filter((team): team is ProjectTeam => Boolean(team));
}

/** Activity rows are filtered at the database by project-level RLS. */
export async function getActivities(): Promise<Activity[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, description, created_at, project_id, profiles(full_name)")
    .not("project_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) {
    console.error("Gagal memuat aktivitas proyek:", error.message);
    return [];
  }
  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const profile = row.profiles as { full_name?: string } | null;
    return {
      id: String(row.id),
      description: String(row.description),
      created_at: String(row.created_at),
      project_id: row.project_id ? String(row.project_id) : null,
      actor_name: profile?.full_name ?? "Anggota proyek",
    };
  });
}

export function buildWeeklyTaskActivity(tasks: Task[], now = new Date()) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setDate(date.getDate() - (6 - index));
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    return {
      key,
      day: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(date),
      created: 0,
      completed: 0,
    };
  });
  const byDate = new Map(days.map((day) => [day.key, day]));
  for (const task of tasks) {
    if (task.created_at) {
      const day = byDate.get(task.created_at.slice(0, 10));
      if (day) day.created += 1;
    }
    if (task.completed_at) {
      const day = byDate.get(task.completed_at.slice(0, 10));
      if (day) day.completed += 1;
    }
  }
  return days;
}
