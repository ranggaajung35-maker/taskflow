"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/queries";

const projectSchema = z.object({
  name: z.string().trim().min(2, "Nama proyek minimal 2 karakter").max(80),
  description: z.string().trim().max(500).optional().default(""),
  color: z.enum(["violet", "blue", "green", "orange"]).default("violet"),
});

export async function createProjectAction(input: unknown) {
  const parsed = projectSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Data proyek tidak valid." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true, message: "Proyek ditambahkan pada pratinjau lokal." };
  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) return { ok: false, message: "Sesi tidak valid." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  // TaskFlow is free: every workspace can create as many projects as it needs.
  const { data: project, error } = await supabase.from("projects").insert({
    workspace_id: context.workspaceId,
    created_by: context.user.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    color: parsed.data.color,
    status: "active",
  }).select("id").single();
  if (error) return { ok: false, message: error.message };
  await supabase.from("activity_logs").insert({ workspace_id: context.workspaceId, actor_id: context.user.id, entity_type: "project", entity_id: project.id, description: `membuat proyek ${parsed.data.name}` });
  revalidatePath("/projects"); revalidatePath("/dashboard");
  return { ok: true, demo: false, message: "Proyek berhasil dibuat." };
}
