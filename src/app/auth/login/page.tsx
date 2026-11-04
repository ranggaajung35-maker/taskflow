import Link from "next/link";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { signInAction } from "@/app/auth/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string; next?: string }> }) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/dashboard";
  return <main className="auth-shell">
    <aside className="auth-aside"><Link href="/"><Logo/></Link><div><div className="section-kicker mb-4">WELCOME BACK</div><h1>Jaga ritme kerja. <span className="gradient-text">Lanjutkan progresmu.</span></h1><p>Masuk ke workspace TaskFlow dan lanjutkan pekerjaan yang paling penting hari ini.</p><div className="mt-8 flex items-center gap-3 text-[10px] text-slate-400"><ShieldCheck size={16} className="text-violet-300"/> Akses akun dilindungi oleh Supabase Auth.</div></div><div className="auth-aside-foot">© 2026 TaskFlow. Bekerja dengan lebih terarah.</div></aside>
    <section className="auth-main"><div className="auth-card"><Link href="/" className="inline-flex items-center gap-2 text-[10px] text-slate-500 mb-8 hover:text-violet-200"><ArrowLeft size={13}/> Kembali ke beranda</Link><div className="mb-7"><Logo/><div className="mt-7"><h2>Selamat datang kembali</h2><p>Masukkan email dan password untuk masuk ke akun kamu.</p></div></div>{params.error && <div className="auth-error">{params.error}</div>}{params.success && <div className="auth-info">{params.success}</div>}<form action={signInAction}><input type="hidden" name="next" value={next}/><label className="field-label" htmlFor="email">Email</label><input className="field-control" type="email" id="email" name="email" autoComplete="email" placeholder="nama@email.com" required/><label className="field-label" htmlFor="password">Password</label><input className="field-control" type="password" id="password" name="password" autoComplete="current-password" placeholder="Masukkan password" required minLength={8}/><button className="btn-primary auth-submit" type="submit">Masuk ke workspace <ArrowRight size={15}/></button></form><div className="auth-switch">Belum punya akun? <Link href={`/auth/signup?next=${encodeURIComponent(next)}`}>Daftar gratis</Link></div><p className="text-center text-[8px] text-slate-600 mt-8 leading-relaxed">Dengan masuk, kamu menyetujui ketentuan penggunaan dan kebijakan privasi aplikasi.</p></div></section>
  </main>;
}
