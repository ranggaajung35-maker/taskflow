import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2,
  CheckSquare, Command, Layers3, LockKeyhole, MessageSquare,
  MousePointer2, Sparkles, Users2, Zap,
} from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Reveal } from "@/components/shared/reveal";

const features = [
  { icon: CheckSquare, title: "Manajemen tugas", desc: "Atur pekerjaan berdasarkan status, prioritas, tenggat, dan penanggung jawab." },
  { icon: Layers3, title: "Ruang proyek", desc: "Satukan tugas, progres, dan anggota tim dalam satu ruang kerja yang rapi." },
  { icon: CalendarDays, title: "Kalender terpusat", desc: "Lihat tenggat dan agenda dengan tampilan jadwal yang mudah dipahami." },
  { icon: BarChart3, title: "Analitik produktivitas", desc: "Pantau penyelesaian tugas, beban kerja, dan tren produktivitas tim." },
  { icon: Users2, title: "Kolaborasi tim", desc: "Undang anggota, diskusikan pekerjaan, dan jaga semua orang tetap searah." },
  { icon: LockKeyhole, title: "Data lebih terkontrol", desc: "Autentikasi dan kebijakan akses berbasis workspace dengan Supabase." },
];

export default function HomePage() {
  return (
    <main className="marketing-shell">
      <header className="marketing-nav wrap-wide">
        <Link href="/" aria-label="TaskFlow beranda"><Logo /></Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-slate-300">
          <a href="#fitur" className="nav-link">Fitur</a>
          <a href="#cara-kerja" className="nav-link">Cara kerja</a>
          <a href="#gratis" className="nav-link">Gratis</a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="btn-ghost hidden sm:inline-flex">Masuk</Link>
          <Link href="/auth/signup" className="btn-primary btn-small">Mulai gratis <ArrowRight size={15} /></Link>
        </div>
      </header>

      <section className="hero-section wrap-wide">
        <div className="hero-copy">
          <div className="eyebrow"><span className="eyebrow-pulse" /> WORKSPACE YANG BEKERJA BERSAMAMU</div>
          <h1>Kerja lebih terarah. <span className="gradient-text">Hasil lebih terasa.</span></h1>
          <p className="hero-description">TaskFlow membantu kamu mengubah pekerjaan yang berantakan menjadi rencana yang jelas — dari tugas harian hingga proyek bersama tim.</p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <Link href="/auth/signup" className="btn-primary">Buat workspace gratis <ArrowUpRight size={17} /></Link>
            <Link href="/dashboard" className="btn-outline">Lihat dashboard <ArrowRight size={16} /></Link>
          </div>
          <div className="hero-proof"><div className="avatar-stack"><span>AR</span><span>DN</span><span>FA</span><span>+ </span></div><div><div className="proof-stars">★★★★★</div><p>Dirancang untuk pekerjaan nyata, bukan sekadar daftar tugas.</p></div></div>
        </div>

        <div className="hero-visual" aria-label="Pratinjau dashboard TaskFlow">
          <div className="visual-glow" />
          <div className="floating-chip chip-one"><Zap size={14} /> Fokus hari ini</div>
          <div className="floating-chip chip-two"><CheckCircle2 size={14} /> Progres tersimpan</div>
          <div className="preview-window">
            <div className="preview-top"><div className="flex items-center gap-2"><Logo compact /><span className="preview-divider" /> <span className="text-xs text-slate-400">Workspace / Overview</span></div><div className="preview-avatar">AR</div></div>
            <div className="preview-content">
              <div className="flex items-start justify-between gap-4"><div><p className="text-xs text-slate-500">SELAMAT DATANG KEMBALI</p><h3 className="text-xl font-semibold mt-1">Mulai dengan fokus hari ini 👋</h3><p className="text-xs text-slate-400 mt-1">Inilah yang terjadi di proyek yang kamu akses.</p></div><span className="preview-date">4 Nov 2026</span></div>
              <div className="preview-stats"><div><span>Tugas aktif</span><strong>24</strong><small className="green-text">↑ 12% minggu ini</small></div><div><span>Selesai</span><strong>18</strong><small className="green-text">↑ 8% minggu ini</small></div><div><span>Proyek</span><strong>06</strong><small>2 mendekati tenggat</small></div></div>
              <div className="preview-lower"><div className="preview-task-card"><div className="flex justify-between items-center"><strong>Tugas terbaru</strong><span className="text-[10px] text-violet-300">Lihat semua →</span></div>{[["Siapkan landing page","Situs web","High"],["Review desain dashboard","Aplikasi","Medium"],["Susun laporan mingguan","Internal","Low"]].map(([t,s,p])=><div className="preview-task" key={t}><span className="preview-check"><CheckCircle2 size={13}/></span><div className="min-w-0 flex-1"><b>{t}</b><small>{s}</small></div><i className={`priority-dot ${p.toLowerCase()}`} /> </div>)}</div><div className="preview-progress"><strong>Progres mingguan</strong><div className="progress-donut"><span>76%<small>tercapai</small></span></div><p><span className="green-text">+14%</span> dibanding minggu lalu</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="trust-strip wrap-wide"><span>DIBUAT UNTUK ALUR KERJA YANG LEBIH BAIK</span><div><Command size={16}/> SIMPLE</div><div><MousePointer2 size={16}/> INTUITIVE</div><div><Sparkles size={16}/> THOUGHTFUL</div><div><LockKeyhole size={16}/> PRIVATE</div></section>

      <section id="fitur" className="section-wrap wrap-wide">
        <Reveal><div className="section-heading"><span className="section-kicker">SEMUA YANG KAMU BUTUHKAN</span><h2>Satu ruang kerja. <span className="gradient-text">Banyak kemungkinan.</span></h2><p>Fokus pada pekerjaan yang penting. TaskFlow menjaga detail tetap teratur di belakang layar.</p></div></Reveal>
        <div className="feature-grid">{features.map((feature, index) => { const Icon = feature.icon; return <Reveal key={feature.title} delay={index * 0.06}><article className="feature-card"><div className="feature-icon"><Icon size={20}/></div><h3>{feature.title}</h3><p>{feature.desc}</p><span className="feature-arrow"><ArrowUpRight size={16}/></span></article></Reveal>; })}</div>
      </section>

      <section id="cara-kerja" className="workflow-section"><div className="wrap-wide workflow-inner"><div><span className="section-kicker">CARA KERJA</span><h2>Dari ide menjadi <span className="gradient-text">kemajuan.</span></h2><p className="muted-copy">Alur sederhana yang membantumu mulai bergerak tanpa harus menghabiskan waktu mengatur alat.</p><div className="workflow-steps"><div><b>01</b><section><strong>Buat workspace</strong><p>Siapkan ruang khusus untuk pekerjaan pribadi atau tim.</p></section></div><div><b>02</b><section><strong>Atur proyek dan tugas</strong><p>Ubah target besar menjadi langkah kecil yang jelas.</p></section></div><div><b>03</b><section><strong>Pantau progres</strong><p>Gunakan kalender dan analitik untuk menjaga momentum.</p></section></div></div></div><div className="workflow-art"><div className="workflow-orbit orbit-a"/><div className="workflow-orbit orbit-b"/><div className="workflow-core"><Layers3 size={48}/><span>TF</span></div><div className="orbit-card orbit-card-a"><CheckCircle2 size={15}/> Target tercapai</div><div className="orbit-card orbit-card-b"><BarChart3 size={15}/> +32% produktivitas</div><div className="orbit-card orbit-card-c"><MessageSquare size={15}/> Kolaborasi aktif</div></div></div></section>

      <section id="gratis" className="section-wrap wrap-wide pricing-section"><Reveal><div className="section-heading"><span className="section-kicker">100% GRATIS</span><h2>Semua fitur. <span className="gradient-text">Tanpa biaya berlangganan.</span></h2><p>TaskFlow menyediakan seluruh fitur produktivitas untuk akun personal maupun workspace tim tanpa paket berbayar, biaya tersembunyi, atau kewajiban memasukkan kartu.</p></div></Reveal><div className="pricing-grid single-plan-grid"><Reveal><article className="price-card price-featured"><div className="popular-tag">SEMUA FITUR TERBUKA</div><h3>TaskFlow</h3><p>Satu ruang kerja lengkap untuk mengatur pekerjaan pribadi maupun kolaborasi tim.</p><div className="price-amount">Rp0<small>selamanya</small></div><ul>{["Workspace pribadi dan tim", "Proyek aktif tanpa batas", "Tugas, prioritas, dan tenggat", "Kalender dan analitik produktivitas", "Kolaborasi dan aktivitas workspace", "Tanpa pembayaran atau langganan"].map(item=><li key={item}><CheckCircle2 size={16}/>{item}</li>)}</ul><Link href="/auth/signup" className="btn-primary w-full">Buat akun gratis <ArrowRight size={16}/></Link></article></Reveal></div><p className="pricing-note">Tidak ada paket premium, checkout, atau perpanjangan berbayar. Semua fitur yang tersedia dapat digunakan secara gratis.</p></section>

      <section className="closing-section wrap-wide"><div><span className="section-kicker">MULAI HARI INI</span><h2>Pekerjaan yang baik dimulai dengan <span className="gradient-text">sistem yang baik.</span></h2><p>Buat workspace pertamamu dan rapikan langkah berikutnya.</p><Link href="/auth/signup" className="btn-primary">Mulai gunakan TaskFlow <ArrowRight size={16}/></Link></div><div className="closing-spark"><Sparkles size={82}/></div></section>

      <footer className="marketing-footer wrap-wide"><Link href="/"><Logo/></Link><p>© 2026 TaskFlow. Dibuat untuk membantu pekerjaan bergerak maju.</p><div><a href="#fitur">Fitur</a><Link href="/auth/login">Masuk</Link><Link href="/auth/signup">Daftar</Link></div></footer>
    </main>
  );
}
