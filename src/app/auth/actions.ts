"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

function appUrl() { return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"; }
function safeNextPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value : "";
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : "/dashboard";
}

export async function signInAction(formData: FormData) {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = safeNextPath(formData.get("next"));
  if (!email || !password) redirect(`/auth/login?error=Email%20dan%20password%20wajib%20diisi&next=${encodeURIComponent(next)}`);
  if (!isSupabaseConfigured()) redirect("/auth/login?error=Tambahkan%20kredensial%20Supabase%20di%20.env.local%20terlebih%20dahulu");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/login?error=Koneksi%20database%20tidak%20tersedia");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect(`/auth/login?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  redirect(next);
}

export async function signUpAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const next = safeNextPath(formData.get("next"));
  if (name.length < 2 || !email || password.length < 8) redirect(`/auth/signup?error=Isi%20nama%2C%20email%2C%20dan%20password%20minimal%208%20karakter&next=${encodeURIComponent(next)}`);
  if (!isSupabaseConfigured()) redirect("/auth/signup?error=Tambahkan%20kredensial%20Supabase%20di%20.env.local%20terlebih%20dahulu");
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/auth/signup?error=Koneksi%20database%20tidak%20tersedia");
  const { data, error } = await supabase.auth.signUp({
    email, password,
    options: { data: { full_name: name }, emailRedirectTo: `${appUrl()}/auth/callback?next=${encodeURIComponent(next)}` },
  });
  if (error) redirect(`/auth/signup?error=${encodeURIComponent(error.message)}&next=${encodeURIComponent(next)}`);
  if (data.session) redirect(next);
  redirect(`/auth/signup?success=Periksa%20email%20untuk%20mengonfirmasi%20akun%20kamu&next=${encodeURIComponent(next)}`);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/auth/login");
}
