"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

const taskSchema = z.object({
  title: z.string().trim().min(2, "Judul minimal 2 karakter").max(120),
  description: z.string().trim().max(1000).optional().default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z.string().optional().default(""),
  project_id: z.string().uuid("Setiap tugas harus berada di dalam proyek."),
  assignee_id: z.union([z.string().uuid(), z.literal("")]).optional().default(""),
});

async function getVisibleTask(supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>, id: string) {
  const { data, error } = await supabase
    .from("tasks")
    .select("id, workspace_id, project_id, title, assignee_id")
    .eq("id", id)
    .maybeSingle();
  if (error) console.error("Gagal memeriksa akses tugas:", error.message);
  return data;
}

async function writeTaskActivity(
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>,
  task: { workspace_id: string; project_id: string | null; id: string },
  actorId: string,
  description: string,
) {
  await supabase.from("activity_logs").insert({
    workspace_id: task.workspace_id,
    project_id: task.project_id,
    actor_id: actorId,
    entity_type: "task",
    entity_id: task.id,
    description,
  });
}

export async function createTaskAction(input: unknown) {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tugas tidak valid." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true, message: "Tugas ditambahkan pada pratinjau lokal." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi tidak valid. Silakan masuk kembali." };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, workspace_id, created_by")
    .eq("id", parsed.data.project_id)
    .maybeSingle();
  if (projectError || !project) return { ok: false, message: "Kamu tidak memiliki akses ke proyek yang dipilih." };

  if (parsed.data.assignee_id) {
    const isCreator = project.created_by === parsed.data.assignee_id;
    const { data: member } = isCreator ? { data: true } : await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", project.id)
      .eq("user_id", parsed.data.assignee_id)
      .maybeSingle();
    if (!member) return { ok: false, message: "Penanggung jawab harus menjadi anggota proyek ini." };
  }

  const { data: task, error } = await supabase.from("tasks").insert({
    workspace_id: project.workspace_id,
    project_id: project.id,
    created_by: user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    priority: parsed.data.priority,
    due_date: parsed.data.due_date || null,
    assignee_id: parsed.data.assignee_id || null,
    status: "todo",
  }).select("id, workspace_id, project_id").single();
  if (error) return { ok: false, message: error.message };

  await writeTaskActivity(supabase, task, user.id, `membuat tugas ${parsed.data.title}`);
  revalidatePath("/tasks");
  revalidatePath(`/projects/${project.id}`);
  revalidatePath("/dashboard");
  revalidatePath("/calendar");
  revalidatePath("/team/performance");
  return { ok: true, demo: false, message: "Tugas berhasil dibuat." };
}

export async function updateTaskStatusAction(id: string, status: "todo" | "in_progress" | "done") {
  if (!id) return { ok: false, message: "ID tugas tidak ditemukan." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi tidak valid." };
  const task = await getVisibleTask(supabase, id);
  if (!task) return { ok: false, message: "Tugas tidak ditemukan atau kamu tidak memiliki akses ke proyek ini." };
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  await writeTaskActivity(supabase, task, user.id, `mengubah status tugas menjadi ${status}`);
  revalidatePath("/tasks");
  if (task.project_id) revalidatePath(`/projects/${task.project_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/team/performance");
  return { ok: true, demo: false };
}

export async function updateTaskAssigneeAction(id: string, assigneeId: string | null) {
  if (!id) return { ok: false, message: "ID tugas tidak ditemukan." };
  if (assigneeId && !z.string().uuid().safeParse(assigneeId).success) return { ok: false, message: "ID penanggung jawab tidak valid." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi tidak valid." };
  const task = await getVisibleTask(supabase, id);
  if (!task) return { ok: false, message: "Tugas tidak ditemukan atau kamu tidak memiliki akses." };
  if (!task.project_id) return { ok: false, message: "Tugas harus berada di dalam proyek sebelum dapat ditugaskan." };

  if (assigneeId) {
    const { data: project } = await supabase.from("projects").select("created_by").eq("id", task.project_id).maybeSingle();
    const isCreator = project?.created_by === assigneeId;
    const { data: membership } = isCreator ? { data: true } : await supabase
      .from("project_members")
      .select("user_id")
      .eq("project_id", task.project_id)
      .eq("user_id", assigneeId)
      .maybeSingle();
    if (!membership) return { ok: false, message: "Penanggung jawab harus menjadi anggota proyek yang sama." };
  }

  const { error } = await supabase.from("tasks").update({ assignee_id: assigneeId }).eq("id", id);
  if (error) return { ok: false, message: error.message };
  const { data: assignee } = assigneeId
    ? await supabase.from("profiles").select("full_name").eq("id", assigneeId).maybeSingle()
    : { data: null };
  const description = assigneeId
    ? `menugaskan ${task.title} kepada ${assignee?.full_name ?? "anggota proyek"}`
    : `menghapus penanggung jawab tugas ${task.title}`;
  await writeTaskActivity(supabase, task, user.id, description);
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.project_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/analytics");
  revalidatePath("/team");
  revalidatePath("/team/performance");
  return { ok: true, demo: false, message: "Penanggung jawab tugas diperbarui." };
}

export async function deleteTaskAction(id: string) {
  if (!id) return { ok: false, message: "ID tugas tidak ditemukan." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi tidak valid." };
  const task = await getVisibleTask(supabase, id);
  if (!task) return { ok: false, message: "Tugas tidak ditemukan atau kamu tidak memiliki akses." };
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };
  if (task.project_id) {
    await supabase.from("activity_logs").insert({
      workspace_id: task.workspace_id,
      project_id: task.project_id,
      actor_id: user.id,
      entity_type: "project",
      entity_id: task.project_id,
      description: `menghapus tugas ${task.title}`,
    });
  }
  revalidatePath("/tasks");
  if (task.project_id) revalidatePath(`/projects/${task.project_id}`);
  revalidatePath("/dashboard");
  revalidatePath("/team/performance");
  return { ok: true, demo: false };
}

const commentSchema = z.object({
  taskId: z.string().uuid(),
  body: z.string().trim().min(1, "Komentar tidak boleh kosong.").max(3000, "Komentar terlalu panjang."),
});

export async function loadTaskCommentsAction(taskId: string) {
  if (!taskId || !z.string().uuid().safeParse(taskId).success) return { ok: false, message: "Tugas tidak ditemukan.", comments: [] };
  if (!isSupabaseConfigured()) return { ok: true, demo: true, comments: [] as Array<{ id: string; body: string; created_at: string; user_id: string }> };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia.", comments: [] };
  const task = await getVisibleTask(supabase, taskId);
  if (!task) return { ok: false, message: "Tugas tidak ditemukan atau kamu tidak memiliki akses.", comments: [] };
  const { data, error } = await supabase.from("task_comments")
    .select("id, body, created_at, user_id")
    .eq("task_id", taskId)
    .order("created_at", { ascending: true });
  if (error) return { ok: false, message: error.message, comments: [] };
  return { ok: true, demo: false, comments: data ?? [] };
}

export async function createTaskCommentAction(input: unknown) {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Komentar tidak valid." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true, message: "Komentar ditambahkan pada pratinjau lokal." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Sesi tidak valid." };
  const task = await getVisibleTask(supabase, parsed.data.taskId);
  if (!task || !task.project_id) return { ok: false, message: "Tugas tidak ditemukan atau tidak berada di dalam proyek yang dapat kamu akses." };
  const { error } = await supabase.from("task_comments").insert({
    workspace_id: task.workspace_id,
    task_id: parsed.data.taskId,
    user_id: user.id,
    body: parsed.data.body,
  });
  if (error) return { ok: false, message: error.message };
  await writeTaskActivity(supabase, task, user.id, "menambahkan komentar pada tugas");
  revalidatePath("/tasks");
  revalidatePath(`/projects/${task.project_id}`);
  revalidatePath("/dashboard");
  return { ok: true, demo: false, message: "Komentar berhasil dikirim." };
}
