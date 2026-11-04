"use client";

import { useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, FolderKanban, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { createProjectAction } from "@/lib/actions/projects";
import type { Project } from "@/lib/types";

const colors = {
  violet: { background: "rgba(153,112,255,.13)", color: "#b699ff" },
  blue: { background: "rgba(90,137,255,.13)", color: "#8fb1ff" },
  green: { background: "rgba(73,204,157,.13)", color: "#74ddb7" },
  orange: { background: "rgba(239,174,91,.13)", color: "#f0bf7d" },
};

export function ProjectGrid({ initialProjects }: { initialProjects: Project[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ name: "", description: "", color: "violet" as keyof typeof colors });

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await createProjectAction(form);
      if (!result.ok) { toast.error(result.message); return; }
      if (result.demo) setProjects((current) => [{ id: `local-${Date.now()}`, name: form.name, description: form.description, color: form.color, status: "active", tasks_count: 0, completed_count: 0 }, ...current]);
      else window.location.reload();
      setForm({ name: "", description: "", color: "violet" });
      setModalOpen(false);
      toast.success("Proyek berhasil ditambahkan.");
    });
  }

  return <>
    <div className="flex items-center justify-between mb-4"><p className="text-[10px] text-slate-500">{projects.length} proyek di workspace ini</p><button className="btn-primary btn-small" onClick={() => setModalOpen(true)}><Plus size={14}/> Proyek baru</button></div>
    <div className="project-grid">{projects.map((project, index) => {
      const tone = colors[project.color as keyof typeof colors] ?? colors.violet;
      const count = project.tasks_count ?? 0;
      const completed = project.completed_count ?? 0;
      const progress = count > 0 ? Math.round((completed / count) * 100) : 0;
      return <motion.article layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .04 }} className="project-card" key={project.id}>
        <div className="project-card-top"><div className="project-icon" style={{ background: tone.background, color: tone.color }}><FolderKanban size={18}/></div><span className={`status-pill ${project.status === "completed" ? "status-done" : "status-in_progress"}`}>{project.status === "completed" ? "Selesai" : "Aktif"}</span></div>
        <h3>{project.name}</h3><p>{project.description || "Belum ada deskripsi proyek."}</p>
        <div className="project-meta"><span>{completed} dari {count} tugas selesai</span><strong>{progress}%</strong></div><div className="mini-progress"><span style={{ width: `${progress}%` }}/></div>
        <div className="flex justify-between items-center mt-4 text-[8px] text-slate-500"><span>Dibuat untuk kolaborasi</span><ArrowUpRight size={13} className="text-violet-300"/></div>
      </motion.article>;
    })}</div>
    {projects.length === 0 && <div className="panel empty-state"><FolderKanban size={24}/><strong>Belum ada proyek</strong><p>Buat proyek pertama untuk mengelompokkan tugas dan mengukur progres.</p></div>}
    <AnimatePresence>{modalOpen && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><motion.div initial={{ opacity: 0, y: 12, scale: .98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8 }} className="modal-card"><div className="flex items-start justify-between"><div><h2>Buat proyek baru</h2><p>Siapkan ruang untuk target dan pekerjaan baru.</p></div><button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Tutup"><X size={15}/></button></div><form onSubmit={submit}><label className="field-label">Nama proyek *</label><input className="field-control" autoFocus required minLength={2} maxLength={80} placeholder="Contoh: Website toko online" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/><label className="field-label">Deskripsi</label><textarea className="field-control min-h-20 resize-y" placeholder="Apa tujuan utama proyek ini?" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/><label className="field-label">Warna proyek</label><div className="flex gap-2">{Object.keys(colors).map((color) => <button key={color} type="button" onClick={() => setForm({ ...form, color: color as keyof typeof colors })} className={`rounded-lg px-3 py-2 text-[9px] capitalize border ${form.color === color ? "border-violet-300 bg-violet-400/15 text-violet-100" : "border-white/10 text-slate-400"}`}>{color}</button>)}</div><div className="modal-actions"><button className="btn-outline" type="button" onClick={() => setModalOpen(false)}>Batal</button><button className="btn-primary" type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Buat proyek"}<Plus size={14}/></button></div></form></motion.div></motion.div>}</AnimatePresence>
  </>;
}
