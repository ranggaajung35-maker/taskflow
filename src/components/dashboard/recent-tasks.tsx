import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Task } from "@/lib/types";
import { dueLabel } from "@/lib/utils";

export function RecentTasks({ tasks }: { tasks: Task[] }) {
  const labels = { todo: "Belum mulai", in_progress: "Dikerjakan", done: "Selesai" };
  return <div className="overflow-x-auto"><table className="task-table"><thead><tr><th>TUGAS</th><th>PROYEK</th><th>TENGGAT</th><th>STATUS</th></tr></thead><tbody>{tasks.slice(0, 5).map((task) => <tr key={task.id}><td><div className="task-title-cell"><strong>{task.title}</strong><small>{task.priority === "high" ? "Prioritas tinggi" : task.priority === "medium" ? "Prioritas sedang" : "Prioritas rendah"}</small></div></td><td>{task.project?.name ?? "—"}</td><td>{dueLabel(task.due_date)}</td><td><span className={`status-pill status-${task.status}`}>{labels[task.status]}</span></td></tr>)}</tbody></table>{tasks.length === 0 && <div className="empty-state"><p>Belum ada tugas.</p></div>}<div className="pt-3"><Link href="/tasks" className="btn-quiet">Buka semua tugas <ArrowUpRight size={13}/></Link></div></div>;
}
