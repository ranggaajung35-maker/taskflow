"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  projectId: z.string().uuid("Proyek tidak valid."),
  email: z.string().trim().email("Masukkan alamat email yang valid.").max(254),
  role: z.enum(["manager", "member"]).default("member"),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createProjectInviteAction(input: unknown) {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Data undangan tidak valid." };

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, message: "Koneksi database tidak tersedia." };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, message: "Silakan masuk terlebih dahulu." };

  const { data: project, error: projectError } = await supabase
    .from("projects")
    .select("id, name, created_by")
    .eq("id", parsed.data.projectId)
    .maybeSingle();
  if (projectError || !project) return { ok: false as const, message: "Proyek tidak ditemukan atau kamu tidak memiliki akses." };

  let canManage = project.created_by === user.id;
  if (!canManage) {
    const { data: membership } = await supabase
      .from("project_members")
      .select("role")
      .eq("project_id", project.id)
      .eq("user_id", user.id)
      .maybeSingle();
    canManage = membership?.role === "manager";
  }
  if (!canManage) return { ok: false as const, message: "Hanya pemilik proyek atau Project Manager yang dapat mengundang anggota." };

  const invitedEmail = parsed.data.email.toLowerCase();
  if (invitedEmail === (user.email ?? "").toLowerCase()) {
    return { ok: false as const, message: "Email tersebut adalah email akun kamu sendiri." };
  }

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("project_invitations").insert({
    project_id: project.id,
    invited_email: invitedEmail,
    role: parsed.data.role,
    token_hash: hashToken(token),
    invited_by: user.id,
    expires_at: expiresAt,
  });
  if (error) {
    console.error("Gagal membuat undangan proyek:", error.message);
    if (error.code === "42P01" || error.message.toLowerCase().includes("project_invitations")) {
      return { ok: false as const, message: "Tabel undangan proyek belum tersedia. Jalankan migration 20261105_project_scoped_collaboration.sql di Supabase." };
    }
    return { ok: false as const, message: error.message };
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  revalidatePath(`/projects/${project.id}`);
  return { ok: true as const, inviteUrl: `${baseUrl}/invite/${token}`, expiresAt, projectName: project.name };
}

export async function acceptProjectInviteAction(token: string, formData: FormData) {
  void formData;
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(`/auth/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/invite/${token}`)}`);

  const { data: projectId, error } = await supabase.rpc("accept_project_invitation", { p_token_hash: hashToken(token) });
  if (error || !projectId) {
    const message = error?.message?.includes("function")
      ? "Fitur kolaborasi proyek belum disiapkan. Jalankan migration project-scoped collaboration di Supabase."
      : error?.message ?? "Undangan proyek tidak dapat diterima.";
    redirect(`/invite/${token}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  revalidatePath("/tasks");
  revalidatePath("/team");
  redirect(`/projects/${projectId}?invite=accepted`);
}
