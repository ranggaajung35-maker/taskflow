export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  workspace_id?: string;
  project_id?: string | null;
  assignee_id?: string | null;
  title: string;
  description?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date?: string | null;
  created_at?: string;
  completed_at?: string | null;
  project?: { name: string } | null;
  assignee?: { full_name: string | null; avatar_url?: string | null } | null;
};

export type Project = {
  id: string;
  workspace_id?: string;
  created_by?: string;
  name: string;
  description?: string | null;
  color: string;
  status: "active" | "completed" | "archived";
  created_at?: string;
  tasks_count?: number;
  completed_count?: number;
};

export type ProjectMember = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  role: "owner" | "manager" | "member";
  avatar_url?: string | null;
  project_ids: string[];
  project_names: string[];
  project_roles?: Record<string, "owner" | "manager" | "member">;
};

/** Kept as an alias for existing components that consume member lists. */
export type WorkspaceMember = ProjectMember;

export type ProjectTeam = {
  project: Project;
  members: ProjectMember[];
  canManage: boolean;
};

export type Activity = {
  id: string;
  description: string;
  created_at: string;
  actor_name?: string;
  project_id?: string | null;
};
