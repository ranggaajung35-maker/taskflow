import { addDays, addMonths, endOfMonth, endOfWeek, format, isSameDay, isSameMonth, isValid, startOfMonth, startOfWeek } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { DemoBanner } from "@/components/shared/demo-banner";
import { getTasks, getWorkspaceContext } from "@/lib/data/queries";

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const [{ month }, tasks, context] = await Promise.all([searchParams, getTasks(), getWorkspaceContext()]);
  const parsedMonth = month && /^\d{4}-\d{2}$/.test(month) ? new Date(`${month}-01T12:00:00`) : new Date();
  const selectedMonth = startOfMonth(isValid(parsedMonth) ? parsedMonth : new Date());
  const actualToday = new Date();
  const monthStart = startOfMonth(selectedMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(endOfMonth(selectedMonth), { weekStartsOn: 1 });
  const days: Date[] = [];
  for (let day = calendarStart; day <= calendarEnd; day = addDays(day, 1)) days.push(day);
  const labels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
  return <div className="app-content">
    {context.demo && <DemoBanner/>}
    <PageHeading eyebrow="WORKSPACE / KALENDER" title="Kalender pekerjaan" description="Lihat tenggat tugas agar jadwal dan prioritas lebih mudah dikelola." action={<div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.02] px-3 py-2 text-[10px] text-slate-300"><CalendarDays size={14} className="text-violet-300"/>{format(selectedMonth, "MMMM yyyy", { locale: id })}</div>}/>
    <div className="dashboard-grid">
      <section className="panel"><div className="panel-header"><div><h2 className="section-title">{format(selectedMonth, "MMMM yyyy", { locale: id })}</h2><p className="section-subtitle">Tenggat tugas berdasarkan tanggal</p></div><div className="flex gap-1"><Link className="icon-button" aria-label="Bulan sebelumnya" href={`/calendar?month=${format(addMonths(selectedMonth, -1), "yyyy-MM")}`}><ChevronLeft size={14}/></Link><Link className="icon-button" aria-label="Bulan berikutnya" href={`/calendar?month=${format(addMonths(selectedMonth, 1), "yyyy-MM")}`}><ChevronRight size={14}/></Link></div></div><div className="panel-body"><div className="calendar-grid">{labels.map((label) => <div key={label} className="calendar-day-name">{label}</div>)}{days.map((day) => { const dayTasks = tasks.filter((task) => task.due_date && isSameDay(new Date(`${task.due_date}T00:00:00`), day)); return <div key={day.toISOString()} className={`calendar-day ${!isSameMonth(day, selectedMonth) ? "muted" : ""} ${isSameDay(day, actualToday) ? "today" : ""}`}><span>{format(day, "d")}</span>{dayTasks.slice(0, 2).map((task) => <span key={task.id} title={task.title} className="calendar-event">{task.title}</span>)}{dayTasks.length > 2 && <span className="block text-[7px] text-slate-500 mt-1">+{dayTasks.length - 2} lainnya</span>}</div>; })}</div></div></section>
      <section className="panel"><div className="panel-header"><div><h2 className="section-title">Tenggat terdekat</h2><p className="section-subtitle">Tugas dengan tanggal paling dekat</p></div></div><div className="panel-body space-y-3">{tasks.filter((task) => task.due_date && task.status !== "done").sort((a,b) => String(a.due_date).localeCompare(String(b.due_date))).slice(0,8).map((task) => <div key={task.id} className="flex items-start gap-3 border-b border-white/[.06] pb-3"><div className="w-9 h-9 rounded-lg bg-violet-400/10 text-violet-200 grid place-items-center text-[9px] font-bold">{format(new Date(`${task.due_date}T00:00:00`), "dd")}</div><div className="min-w-0 flex-1"><strong className="block text-[10px] text-slate-200">{task.title}</strong><small className="block text-[8px] text-slate-500 mt-1">{task.project?.name ?? "Tanpa proyek"}</small></div><span className="text-[8px] text-slate-500 whitespace-nowrap">{format(new Date(`${task.due_date}T00:00:00`), "d MMM", { locale: id })}</span></div>)}{tasks.filter((task) => task.due_date && task.status !== "done").length === 0 && <p className="text-[10px] text-slate-500">Tidak ada tenggat yang akan datang.</p>}</div></section>
    </div>
    <p className="text-[8px] text-slate-600 mt-4">Kalender menampilkan tugas yang memiliki tanggal tenggat. Gunakan panah di bagian atas kalender untuk berpindah bulan.</p>
  </div>;
}
