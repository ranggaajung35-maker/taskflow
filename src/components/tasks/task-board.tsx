"use client";

import { useMemo, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Filter, MessageCircle, Plus, Search, Send, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { createTaskAction, createTaskCommentAction, deleteTaskAction, loadTaskCommentsAction, updateTaskStatusAction } from "@/lib/actions/tasks";
import type { Project, Task, TaskPriority, TaskStatus } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const statuses: { value: TaskStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua" }, { value: "todo", label: "Belum mulai" }, { value: "in_progress", label: "Dikerjakan" }, { value: "done", label: "Selesai" },
];
const priorityLabel: Record<TaskPriority, string> = { high: "Tinggi", medium: "Sedang", low: "Rendah" };
const statusLabel: Record<TaskStatus, string> = { todo: "Belum mulai", in_progress: "Dikerjakan", done: "Selesai" };

export function TaskBoard({ initialTasks, projects, query = "" }: { initialTasks: Task[]; projects: Project[]; query?: string }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [filter, setFilter] = useState<TaskStatus | "all">("all");
  const [search, setSearch] = useState(query);
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({ title: "", description: "", priority: "medium" as TaskPriority, due_date: "", project_id: "" });
  const [commentTask, setCommentTask] = useState<Task | null>(null);
  const [commentsByTask, setCommentsByTask] = useState<Record<string, Array<{ id: string; body: string; created_at: string; user_id: string }>>>({});
  const [commentText, setCommentText] = useState("");
  const [commentPending, setCommentPending] = useState(false);

  const filtered = useMemo(() => tasks.filter((task) => {
    const matchesFilter = filter === "all" || task.status === filter;
    const value = `${task.title} ${task.description ?? ""} ${task.project?.name ?? ""}`.toLowerCase();
    return matchesFilter && value.includes(search.toLowerCase());
  }), [tasks, filter, search]);

  function changeStatus(task: Task, status: TaskStatus) {
    const previous = tasks;
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status } : item));
    startTransition(async () => {
      const result = await updateTaskStatusAction(task.id, status);
      if (!result.ok) { setTasks(previous); toast.error(result.message); }
      else if (!result.demo) toast.success("Status tugas diperbarui.");
    });
  }

  function removeTask(task: Task) {
    const previous = tasks;
    setTasks((current) => current.filter((item) => item.id !== task.id));
    startTransition(async () => {
      const result = await deleteTaskAction(task.id);
      if (!result.ok) { setTasks(previous); toast.error(result.message); }
      else if (!result.demo) toast.success("Tugas dihapus.");
    });
  }

  async function openComments(task: Task) {
    setCommentTask(task);
    setCommentText("");
    if (commentsByTask[task.id]) return;
    setCommentPending(true);
    const result = await loadTaskCommentsAction(task.id);
    if (result.ok) setCommentsByTask((current) => ({ ...current, [task.id]: result.comments }));
    else toast.error(result.message);
    setCommentPending(false);
  }

  async function submitComment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!commentTask || !commentText.trim()) return;
    setCommentPending(true);
    const result = await createTaskCommentAction({ taskId: commentTask.id, body: commentText });
    if (!result.ok) {
      toast.error(result.message);
      setCommentPending(false);
      return;
    }
    const newComment = { id: `local-comment-${Date.now()}`, body: commentText.trim(), created_at: new Date().toISOString(), user_id: "current-user" };
    if (result.demo) {
      setCommentsByTask((current) => ({ ...current, [commentTask.id]: [...(current[commentTask.id] ?? []), newComment] }));
    } else {
      const refreshed = await loadTaskCommentsAction(commentTask.id);
      if (refreshed.ok) setCommentsByTask((current) => ({ ...current, [commentTask.id]: refreshed.comments }));
    }
    setCommentText("");
    setCommentPending(false);
    toast.success("Komentar berhasil dikirim.");
  }

  function submitTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (form.title.trim().length < 2) { toast.error("Judul tugas minimal 2 karakter."); return; }
    const selectedProject = projects.find((project) => project.id === form.project_id);
    startTransition(async () => {
      const result = await createTaskAction(form);
      if (!result.ok) { toast.error(result.message); return; }
      if (result.demo) {
        setTasks((current) => [{ id: `local-${Date.now()}`, title: form.title.trim(), description: form.description, status: "todo", priority: form.priority, due_date: form.due_date || null, project: selectedProject ? { name: selectedProject.name } : null }, ...current]);
      } else {
        window.location.reload();
      }
      setForm({ title: "", description: "", priority: "medium", due_date: "", project_id: "" });
      setModalOpen(false);
      toast.success("Tugas berhasil ditambahkan.");
    });
  }

  return <>
    <div className="task-toolbar"><div className="toolbar-left">{statuses.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={`filter-chip ${filter === item.value ? "active" : ""}`}>{item.label}{item.value === "all" ? ` (${tasks.length})` : ` (${tasks.filter((task) => task.status === item.value).length})`}</button>)}</div><div className="flex items-center gap-2 w-full sm:w-auto"><div className="topbar-search flex-1 sm:w-52"><Search size={13}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari tugas..."/></div><button className="btn-primary btn-small whitespace-nowrap" onClick={() => setModalOpen(true)}><Plus size={14}/> Tugas baru</button></div></div>
    <div className="task-list"><AnimatePresence initial={false}>{filtered.map((task) => <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: .18 }} className="task-row" key={task.id}>
      <button className={`task-toggle ${task.status === "done" ? "checked" : ""}`} onClick={() => changeStatus(task, task.status === "done" ? "todo" : "done")} aria-label={task.status === "done" ? "Tandai belum selesai" : "Tandai selesai"}>{task.status === "done" && <Check size={13}/>}</button>
      <div className="task-row-main"><strong className={task.status === "done" ? "line-through text-slate-500" : ""}>{task.title}</strong><small>{task.project?.name ?? "Tanpa proyek"} <span className="mx-1">·</span> <span className={task.priority === "high" ? "text-rose-300" : task.priority === "medium" ? "text-amber-200" : "text-emerald-300"}>{priorityLabel[task.priority]}</span> <span className="mx-1">·</span> {formatDate(task.due_date, "d MMM yyyy")}</small></div>
      <div className="task-row-controls"><button className="icon-button" aria-label="Buka komentar" onClick={() => void openComments(task)}><MessageCircle size={13}/></button><select className="select-control" aria-label="Ubah status" value={task.status} onChange={(event) => changeStatus(task, event.target.value as TaskStatus)}>{Object.entries(statusLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button className="icon-button" aria-label="Hapus tugas" onClick={() => removeTask(task)}><Trash2 size={13}/></button></div>
    </motion.article>)}</AnimatePresence>{filtered.length === 0 && <div className="panel empty-state"><Filter size={23}/><strong>Tidak ada tugas yang cocok</strong><p>Ubah filter pencarian atau tambahkan tugas baru untuk mulai mengisi daftar.</p></div>}</div>
    {pending && <p className="text-[9px] text-slate-500 mt-3">Menyimpan perubahan...</p>}
    {modalOpen && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setModalOpen(false); }}><div className="modal-card"><div className="flex items-start justify-between"><div><h2>Buat tugas baru</h2><p>Tambahkan pekerjaan ke workspace kamu.</p></div><button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Tutup"><X size={15}/></button></div><form onSubmit={submitTask}><label className="field-label">Judul tugas *</label><input className="field-control" autoFocus required minLength={2} maxLength={120} placeholder="Contoh: Selesaikan desain dashboard" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}/><label className="field-label">Deskripsi</label><textarea className="field-control min-h-20 resize-y" placeholder="Detail singkat tentang tugas..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}/><div className="settings-row"><div><label className="field-label">Prioritas</label><select className="field-control" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as TaskPriority })}><option value="low">Rendah</option><option value="medium">Sedang</option><option value="high">Tinggi</option></select></div><div><label className="field-label">Tenggat</label><input className="field-control" type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}/></div></div><label className="field-label">Proyek</label><select className="field-control" value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })}><option value="">Tanpa proyek</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select><div className="modal-actions"><button className="btn-outline" type="button" onClick={() => setModalOpen(false)}>Batal</button><button className="btn-primary" type="submit" disabled={pending}>{pending ? "Menyimpan..." : "Simpan tugas"}<Plus size={14}/></button></div></form></div></div>}
    {commentTask && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setCommentTask(null); }}><div className="modal-card"><div className="flex items-start justify-between gap-3"><div><div className="page-eyebrow mb-2">DISKUSI TUGAS</div><h2>{commentTask.title}</h2><p>Catatan dan komentar untuk pekerjaan ini.</p></div><button className="icon-button" onClick={() => setCommentTask(null)} aria-label="Tutup komentar"><X size={15}/></button></div><div className="max-h-64 overflow-y-auto space-y-3 py-2">{commentPending && !(commentsByTask[commentTask.id]?.length) && <p className="text-[10px] text-slate-500">Memuat komentar...</p>}{(commentsByTask[commentTask.id] ?? []).map((comment) => <div key={comment.id} className="rounded-xl border border-white/[.07] bg-white/[.025] p-3"><div className="flex items-center justify-between gap-3"><strong className="text-[9px] text-violet-200">Anggota workspace</strong><span className="text-[8px] text-slate-600">{new Date(comment.created_at).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" })}</span></div><p className="text-[10px] leading-relaxed text-slate-300 mt-2 whitespace-pre-wrap">{comment.body}</p></div>)}{!commentPending && !(commentsByTask[commentTask.id]?.length) && <div className="empty-state py-6"><MessageCircle size={22}/><strong>Belum ada komentar</strong><p>Mulai diskusi dengan menuliskan catatan pertama untuk tugas ini.</p></div>}</div><form onSubmit={submitComment} className="mt-3"><label className="field-label">Tulis komentar</label><textarea className="field-control min-h-20 resize-y" maxLength={3000} placeholder="Tambahkan konteks, pertanyaan, atau pembaruan..." value={commentText} onChange={(event) => setCommentText(event.target.value)}/><div className="modal-actions"><button className="btn-outline" type="button" onClick={() => setCommentTask(null)}>Tutup</button><button className="btn-primary" type="submit" disabled={commentPending || !commentText.trim()}><Send size={13}/>{commentPending ? "Mengirim..." : "Kirim komentar"}</button></div></form></div></div>}
  </>;
}
