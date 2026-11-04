"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { getWorkspaceContext } from "@/lib/data/queries";

const profileSchema = z.object({ full_name: z.string().trim().min(2).max(80), timezone: z.string().trim().max(80).optional().default("Asia/Jakarta") });

export async function updateProfileAction(input: unknown) {
  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Nama profil tidak valid." };
  if (!isSupabaseConfigured()) return { ok: true, demo: true, message: "Pengaturan hanya disimulasikan dalam mode pratinjau." };
  const context = await getWorkspaceContext();
  if (!context.user) return { ok: false, message: "Silakan masuk terlebih dahulu." };
  const supabase = await createSupabaseServerClient();
  if (!supabase) return { ok: false, message: "Koneksi database tidak tersedia." };
  const { error } = await supabase.auth.updateUser({ data: { full_name: parsed.data.full_name, timezone: parsed.data.timezone } });
  if (error) return { ok: false, message: error.message };
  await supabase.from("profiles").update({ full_name: parsed.data.full_name }).eq("id", context.user.id);
  revalidatePath("/settings"); revalidatePath("/dashboard");
  return { ok: true, demo: false, message: "Profil berhasil diperbarui." };
}
