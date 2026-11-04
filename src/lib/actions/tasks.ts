"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/queries";

const taskSchema = z.object({
  title: z.string().trim().min(2, "Judul minimal 2 karakter").max(120),
  description: z.string().trim().max(1000).optional().default(""),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  due_date: z.string().optional().default(""),
  project_id: z.string().optional().default(""),
});

export async function createTaskAction(input: unknown) {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Data tugas tidak valid." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true, message: "Tugas ditambahkan pada pratinjau lokal." };
  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) return { ok: false, message: "Silakan masuk dan pilih workspace terlebih dahulu." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  const { data: task, error } = await supabase.from("tasks").insert({
    workspace_id: context.workspaceId,
    created_by: context.user.id,
    title: parsed.data.title,
    description: parsed.data.description || null,
    priority: parsed.data.priority,
    due_date: parsed.data.due_date || null,
    project_id: parsed.data.project_id || null,
    status: "todo",
  }).select("id").single();
  if (error) return { ok: false, message: error.message };
  await supabase.from("activity_logs").insert({ workspace_id: context.workspaceId, actor_id: context.user.id, entity_type: "task", entity_id: task.id, description: `membuat tugas ${parsed.data.title}` });
  revalidatePath("/tasks"); revalidatePath("/dashboard"); revalidatePath("/calendar");
  return { ok: true, demo: false, message: "Tugas berhasil dibuat." };
}

export async function updateTaskStatusAction(id: string, status: "todo" | "in_progress" | "done") {
  if (!id) return { ok: false, message: "ID tugas tidak ditemukan." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true };
  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) return { ok: false, message: "Sesi tidak valid." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  const { error } = await supabase.from("tasks").update({ status }).eq("id", id).eq("workspace_id", context.workspaceId);
  if (error) return { ok: false, message: error.message };
  await supabase.from("activity_logs").insert({ workspace_id: context.workspaceId, actor_id: context.user.id, entity_type: "task", entity_id: id, description: `mengubah status tugas menjadi ${status}` });
  revalidatePath("/tasks"); revalidatePath("/dashboard"); revalidatePath("/analytics");
  return { ok: true, demo: false };
}

export async function deleteTaskAction(id: string) {
  if (!id) return { ok: false, message: "ID tugas tidak ditemukan." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true };
  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) return { ok: false, message: "Sesi tidak valid." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  const { data: task } = await supabase.from("tasks").select("title").eq("id", id).eq("workspace_id", context.workspaceId).maybeSingle();
  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("workspace_id", context.workspaceId);
  if (error) return { ok: false, message: error.message };
  await supabase.from("activity_logs").insert({ workspace_id: context.workspaceId, actor_id: context.user.id, entity_type: "task", entity_id: id, description: `menghapus tugas ${task?.title ?? "tanpa nama"}` });
  revalidatePath("/tasks"); revalidatePath("/dashboard");
  return { ok: true, demo: false };
}

const commentSchema = z.object({
  taskId: z.string().min(1),
  body: z.string().trim().min(1, "Komentar tidak boleh kosong.").max(3000, "Komentar terlalu panjang."),
});

export async function loadTaskCommentsAction(taskId: string) {
  if (!taskId) return { ok: false, message: "Tugas tidak ditemukan.", comments: [] };
  if (!isSupabaseConfigured()) return { ok: true, demo: true, comments: [] as Array<{ id: string; body: string; created_at: string; user_id: string }> };
  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) return { ok: false, message: "Sesi tidak valid.", comments: [] };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia.", comments: [] };
  const { data, error } = await supabase.from("task_comments").select("id, body, created_at, user_id").eq("task_id", taskId).eq("workspace_id", context.workspaceId).order("created_at", { ascending: true });
  if (error) return { ok: false, message: error.message, comments: [] };
  return { ok: true, demo: false, comments: data ?? [] };
}

export async function createTaskCommentAction(input: unknown) {
  const parsed = commentSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Komentar tidak valid." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true, message: "Komentar ditambahkan pada pratinjau lokal." };
  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) return { ok: false, message: "Sesi tidak valid." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  const { error } = await supabase.from("task_comments").insert({
    workspace_id: context.workspaceId,
    task_id: parsed.data.taskId,
    user_id: context.user.id,
    body: parsed.data.body,
  });
  if (error) return { ok: false, message: error.message };
  await supabase.from("activity_logs").insert({ workspace_id: context.workspaceId, actor_id: context.user.id, entity_type: "task", entity_id: parsed.data.taskId, description: "menambahkan komentar pada tugas" });
  revalidatePath("/tasks"); revalidatePath("/dashboard");
  return { ok: true, demo: false, message: "Komentar berhasil dikirim." };
}
