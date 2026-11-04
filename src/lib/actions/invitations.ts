"use server";

import { createHash, randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/queries";

const inviteSchema = z.object({
  email: z.string().trim().email("Masukkan alamat email yang valid.").max(254),
  role: z.enum(["admin", "member"]).default("member"),
});

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createWorkspaceInviteAction(input: unknown) {
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Data undangan tidak valid." };

  const context = await getWorkspaceContext();
  if (!context.user || !context.workspaceId || context.demo) {
    return { ok: false as const, message: "Sesi tidak valid. Keluar lalu masuk kembali." };
  }
  if (context.role !== "owner" && context.role !== "admin") {
    return { ok: false as const, message: "Hanya owner atau admin yang dapat mengundang anggota." };
  }
  const invitedEmail = parsed.data.email.toLowerCase();
  if (invitedEmail === (context.user.email ?? "").toLowerCase()) {
    return { ok: false as const, message: "Email tersebut adalah email akun kamu sendiri." };
  }
  if (context.role === "admin" && parsed.data.role === "admin") {
    return { ok: false as const, message: "Admin hanya dapat mengundang anggota dengan peran Member." };
  }

  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false as const, message: "Koneksi database tidak tersedia." };

  const token = randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from("workspace_invitations").insert({
    workspace_id: context.workspaceId,
    invited_email: invitedEmail,
    role: parsed.data.role,
    token_hash: tokenHash,
    invited_by: context.user.id,
    expires_at: expiresAt,
  });

  if (error) {
    console.error("Gagal membuat undangan workspace:", error.message);
    if (error.code === "42P01" || error.message.toLowerCase().includes("workspace_invitations")) {
      return { ok: false as const, message: "Tabel undangan belum tersedia. Jalankan migration supabase/migrations/20261105_workspace_invitations.sql di Supabase SQL Editor." };
    }
    return { ok: false as const, message: error.message };
  }

  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
  revalidatePath("/team");
  return { ok: true as const, inviteUrl: `${baseUrl}/invite/${token}`, expiresAt };
}

export async function acceptWorkspaceInviteAction(token: string, _formData: FormData) {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect(`/auth/login?next=${encodeURIComponent(`/invite/${token}`)}`);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=${encodeURIComponent(`/invite/${token}`)}`);

  const { error } = await supabase.rpc("accept_workspace_invitation", { p_token_hash: hashToken(token) });
  if (error) {
    const message = error.message.includes("function")
      ? "Fitur undangan belum disiapkan. Jalankan migration undangan di Supabase."
      : error.message;
    redirect(`/invite/${token}?error=${encodeURIComponent(message)}`);
  }
  revalidatePath("/team");
  revalidatePath("/dashboard");
  redirect("/dashboard?invite=accepted");
}
