import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type { Activity, Project, Task, WorkspaceMember } from "@/lib/types";

/** Resolve the signed-in user's workspace. Never substitute demo workspace data. */
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
  if (!user) {
    return { demo: false, user: null, workspaceId: null, workspaceName: "Workspace", role: null };
  }

  const { data: membership, error } = await supabase
    .from("workspace_members")
    .select("workspace_id, role, workspaces(name)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Gagal memuat workspace pengguna:", error.message);
  }

  const relation = membership?.workspaces as unknown as { name?: string } | null;
  return {
    demo: false,
    user,
    workspaceId: membership?.workspace_id ?? null,
    workspaceName: relation?.name ?? "Workspace pribadi kamu",
    role: membership?.role ?? null,
  };
}

/** A missing workspace or unavailable connection always produces an empty collection. */
export async function getTasks(): Promise<Task[]> {
  if (!isSupabaseConfigured()) return [];
  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("tasks")
    .select("*, projects(name)")
    .eq("workspace_id", context.workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Gagal memuat tugas:", error.message);
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    ...row,
    project: row.projects as { name: string } | null,
  })) as Task[];
}

export async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];
  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("projects")
    .select("*, tasks(id,status)")
    .eq("workspace_id", context.workspaceId)
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

export async function getMembers(): Promise<WorkspaceMember[]> {
  if (!isSupabaseConfigured()) return [];
  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("workspace_members")
    .select("id, role, profiles(full_name, email, avatar_url)")
    .eq("workspace_id", context.workspaceId);

  if (error) {
    console.error("Gagal memuat anggota workspace:", error.message);
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const profile = row.profiles as { full_name?: string; email?: string; avatar_url?: string } | null;
    return {
      id: String(row.id),
      role: row.role as WorkspaceMember["role"],
      full_name: profile?.full_name ?? "Anggota",
      email: profile?.email ?? "",
      avatar_url: profile?.avatar_url,
    };
  });
}

export async function getActivities(): Promise<Activity[]> {
  if (!isSupabaseConfigured()) return [];
  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) return [];

  const supabase = await createSupabaseServerClient();
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("activity_logs")
    .select("id, description, created_at, profiles(full_name)")
    .eq("workspace_id", context.workspaceId)
    .neq("entity_type", "workspace")
    .order("created_at", { ascending: false })
    .limit(8);

  if (error) {
    console.error("Gagal memuat aktivitas:", error.message);
    return [];
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => {
    const profile = row.profiles as { full_name?: string } | null;
    return {
      id: String(row.id),
      description: String(row.description),
      created_at: String(row.created_at),
      actor_name: profile?.full_name ?? "Anggota",
    };
  });
}

/** Real activity counts from the current workspace only; no hard-coded sample values. */
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
