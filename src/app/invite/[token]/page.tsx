import Link from "next/link";
import { ArrowLeft, CheckCircle2, Link2, ShieldCheck } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { acceptProjectInviteAction } from "@/lib/actions/invitations";

export default async function InvitePage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ token }, search] = await Promise.all([params, searchParams]);
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const next = `/invite/${token}`;
  return <main className="auth-shell">
    <aside className="auth-aside"><Link href="/"><Logo/></Link><div><div className="section-kicker mb-4">PROJECT INVITATION</div><h1>Satu proyek, satu <span className="gradient-text">ruang tim.</span></h1><p>Bergabung hanya ke proyek yang mengundangmu. Proyek lain milik pemilik tidak akan terbuka untuk akunmu.</p><div className="mt-8 flex items-center gap-3 text-[10px] text-slate-300"><ShieldCheck size={16} className="text-emerald-300"/> Undangan dibatasi berdasarkan email, proyek, dan masa berlaku.</div></div><div className="auth-aside-foot">© 2026 TaskFlow. Mulai dengan langkah kecil.</div></aside>
    <section className="auth-main"><div className="auth-card"><Link href="/" className="mb-8 inline-flex items-center gap-2 text-[10px] text-slate-500 hover:text-violet-200"><ArrowLeft size={13}/> Kembali ke beranda</Link><div className="mb-7"><Logo/><div className="mt-7"><h2>Undangan proyek</h2><p>Terima undangan untuk berkolaborasi di satu proyek TaskFlow.</p></div></div>
      {search.error && <div className="auth-error">{search.error}</div>}
      {user ? <><div className="auth-info">Kamu masuk sebagai <strong>{user.email}</strong>. Pastikan email ini sama dengan alamat yang menerima undangan. Setelah diterima, akses hanya diberikan pada proyek yang mengundangmu.</div><form action={acceptProjectInviteAction.bind(null, token)} className="mt-5"><button className="btn-primary auth-submit" type="submit">Terima undangan proyek <CheckCircle2 size={15}/></button></form></> : <><div className="rounded-xl border border-white/10 bg-white/[.03] p-4 text-[10px] leading-relaxed text-slate-400"><Link2 size={15} className="mb-2 text-violet-300"/><p>Untuk menerima undangan, masuk atau buat akun menggunakan alamat email yang diundang.</p></div><div className="mt-5 grid gap-2"><Link className="btn-primary auth-submit" href={`/auth/login?next=${encodeURIComponent(next)}`}>Masuk untuk bergabung</Link><Link className="btn-outline justify-center" href={`/auth/signup?next=${encodeURIComponent(next)}`}>Buat akun baru</Link></div></>}
    </div></section>
  </main>;
}
