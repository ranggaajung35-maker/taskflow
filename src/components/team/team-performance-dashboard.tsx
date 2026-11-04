"use client";

import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, CheckCircle2, Clock3, Target, Users2,
} from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from "recharts";
import type { Project, Task, WorkspaceMember } from "@/lib/types";
import { initials } from "@/lib/utils";

type Period = "30" | "90" | "all";
type MemberMetric = {
  member: WorkspaceMember;
  tasks: Task[];
  assigned: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  completionRate: number;
  onTimeRate: number | null;
  onTimeEligible: number;
};

const chartTooltipStyle = {
  background: "#171d34",
  border: "1px solid rgba(169,150,255,.25)",
  borderRadius: 10,
  color: "#e7e9f5",
  fontSize: 10,
};

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatShortDate(value: string | null | undefined) {
  if (!value) return "Tanpa tenggat";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", year: "numeric" }).format(date);
}

function statusLabel(status: Task["status"]) {
  if (status === "done") return "Selesai";
  if (status === "in_progress") return "Dikerjakan";
  return "Belum mulai";
}

export function TeamPerformanceDashboard({
  members,
  tasks,
  currentUserId,
  manageableProjectIds,
  projects,
}: {
  members: WorkspaceMember[];
  tasks: Task[];
  projects: Project[];
  currentUserId: string;
  manageableProjectIds: string[];
}) {
  const [period, setPeriod] = useState<Period>("30");
  const [selectedMemberId, setSelectedMemberId] = useState("all");
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id ?? "all");
  const canViewTeam = selectedProjectId === "all"
    ? projects.length > 0 && projects.every((project) => manageableProjectIds.includes(project.id))
    : manageableProjectIds.includes(selectedProjectId);
  const visibleProjectTasks = useMemo(() => selectedProjectId === "all" ? tasks : tasks.filter((task) => task.project_id === selectedProjectId), [tasks, selectedProjectId]);
  // Members can only inspect their own performance. Owners/Project Managers can inspect
  // everyone only inside projects they manage; selecting "all" is team-wide only when
  // every accessible project is manageable by the current account.
  const projectScopedTasks = useMemo(() => canViewTeam ? visibleProjectTasks : visibleProjectTasks.filter((task) => task.assignee_id === currentUserId), [canViewTeam, visibleProjectTasks, currentUserId]);
  const visibleProjectMembers = useMemo(() => selectedProjectId === "all" ? members : members.filter((member) => member.project_ids.includes(selectedProjectId)).map((member) => ({
    ...member,
    role: member.project_roles?.[selectedProjectId] ?? member.role,
  })), [members, selectedProjectId]);
  const projectScopedMembers = useMemo(() => canViewTeam ? visibleProjectMembers : visibleProjectMembers.filter((member) => member.user_id === currentUserId), [canViewTeam, visibleProjectMembers, currentUserId]);
  const selectedProjectName = projects.find((project) => project.id === selectedProjectId)?.name;
  const today = localDateKey(new Date());

  const scopedTasks = useMemo(() => {
    if (period === "all") return projectScopedTasks;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(period));
    return projectScopedTasks.filter((task) => !task.created_at || new Date(task.created_at) >= cutoff);
  }, [projectScopedTasks, period]);

  const metrics = useMemo<MemberMetric[]>(() => projectScopedMembers.map((member) => {
    const memberTasks = scopedTasks.filter((task) => task.assignee_id === member.user_id);
    const doneTasks = memberTasks.filter((task) => task.status === "done");
    const onTimeTasks = doneTasks.filter((task) => task.due_date && task.completed_at);
    const onTimeCount = onTimeTasks.filter((task) => {
      const due = new Date(`${task.due_date}T23:59:59`);
      return new Date(task.completed_at as string) <= due;
    }).length;
    const overdue = memberTasks.filter((task) => Boolean(task.due_date && task.due_date < today && task.status !== "done")).length;
    return {
      member,
      tasks: memberTasks,
      assigned: memberTasks.length,
      todo: memberTasks.filter((task) => task.status === "todo").length,
      inProgress: memberTasks.filter((task) => task.status === "in_progress").length,
      done: doneTasks.length,
      overdue,
      completionRate: memberTasks.length ? Math.round(doneTasks.length / memberTasks.length * 100) : 0,
      onTimeRate: onTimeTasks.length ? Math.round(onTimeCount / onTimeTasks.length * 100) : null,
      onTimeEligible: onTimeTasks.length,
    };
  }).sort((a, b) => b.done - a.done || b.completionRate - a.completionRate || a.member.full_name.localeCompare(b.member.full_name)), [projectScopedMembers, scopedTasks, today]);

  const assignedTasks = scopedTasks.filter((task) => Boolean(task.assignee_id));
  const unassignedCount = scopedTasks.filter((task) => !task.assignee_id).length;
  const totalDone = assignedTasks.filter((task) => task.status === "done").length;
  const totalInProgress = assignedTasks.filter((task) => task.status === "in_progress").length;
  const totalOverdue = assignedTasks.filter((task) => Boolean(task.due_date && task.due_date < today && task.status !== "done")).length;
  const totalCompletion = assignedTasks.length ? Math.round(totalDone / assignedTasks.length * 100) : 0;

  const selectedTasks = useMemo(() => {
    const base = selectedMemberId === "all"
      ? scopedTasks.filter((task) => Boolean(task.assignee_id))
      : scopedTasks.filter((task) => task.assignee_id === selectedMemberId);
    return [...base].sort((a, b) => {
      if (a.status === "done" && b.status !== "done") return 1;
      if (a.status !== "done" && b.status === "done") return -1;
      return (a.due_date ?? "9999-12-31").localeCompare(b.due_date ?? "9999-12-31");
    }).slice(0, 12);
  }, [scopedTasks, selectedMemberId]);

  const memberChartData = metrics.filter((item) => item.assigned > 0).map((item) => ({
    name: item.member.full_name.length > 16 ? `${item.member.full_name.slice(0, 15)}…` : item.member.full_name,
    selesai: item.done,
    dikerjakan: item.inProgress,
    terlambat: item.overdue,
  }));

  const trendData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - index));
      const key = localDateKey(date);
      return {
        key,
        day: new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short" }).format(date),
        selesai: 0,
      };
    });
    const byDate = new Map(days.map((day) => [day.key, day]));
    for (const task of projectScopedTasks) {
      if (!task.assignee_id || task.status !== "done" || !task.completed_at) continue;
      const key = task.completed_at.slice(0, 10);
      const bucket = byDate.get(key);
      if (bucket) bucket.selesai += 1;
    }
    return days;
  }, [projectScopedTasks]);

  const canSeeOwnTasks = !canViewTeam;

  return (
    <div className="space-y-4">
      <section className="panel p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="page-eyebrow">TEAM PERFORMANCE / OVERVIEW</div>
            <h2 className="text-base font-semibold text-slate-100">Produktivitas {canSeeOwnTasks ? "saya" : "tim"}</h2>
            <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
              {canSeeOwnTasks
                ? "Laporan ini hanya menampilkan tugas yang ditugaskan kepada akunmu pada proyek yang kamu ikuti."
                : "Pilih satu proyek untuk melihat kinerja timnya. Anggota dan tugas dari proyek lain tidak dicampur pada laporan ini."}
            </p>
            {selectedProjectName && <p className="mt-1 text-[9px] text-violet-200">Proyek aktif: {selectedProjectName}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-[10px] text-slate-400">
            Proyek
            <select className="select-control max-w-44" value={selectedProjectId} onChange={(event) => { setSelectedProjectId(event.target.value); setSelectedMemberId("all"); }} aria-label="Filter proyek">
              {projects.length > 1 && <option value="all">Semua proyek yang dapat diakses</option>}
              {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
              {projects.length === 0 && <option value="all">Belum ada proyek</option>}
            </select>
          </label>
          <label className="flex items-center gap-2 text-[10px] text-slate-400">
            Periode
            <select className="select-control" value={period} onChange={(event) => setPeriod(event.target.value as Period)}>
              <option value="30">30 hari terakhir</option>
              <option value="90">90 hari terakhir</option>
              <option value="all">Semua waktu</option>
            </select>
          </label>
          </div>
        </div>
      </section>

      <section className="stat-grid">
        <div className="stat-card"><div className="stat-top">Tugas ditugaskan <Users2 size={14}/></div><div className="stat-value">{assignedTasks.length}</div><div className="stat-foot">Tugas dengan penanggung jawab</div></div>
        <div className="stat-card"><div className="stat-top">Tugas selesai <CheckCircle2 size={14}/></div><div className="stat-value text-emerald-300">{totalDone}</div><div className="stat-foot">{totalCompletion}% dari tugas ditugaskan</div></div>
        <div className="stat-card"><div className="stat-top">Sedang dikerjakan <Activity size={14}/></div><div className="stat-value">{totalInProgress}</div><div className="stat-foot">Masih dalam proses</div></div>
        <div className="stat-card"><div className="stat-top">Terlambat <AlertTriangle size={14}/></div><div className="stat-value text-amber-200">{totalOverdue}</div><div className="stat-foot">Belum selesai dan melewati tenggat</div></div>
      </section>

      {canViewTeam ? (
        <section className="panel">
          <div className="panel-header">
            <div><h2 className="section-title">Perbandingan kinerja anggota</h2><p className="section-subtitle">Jumlah tugas selesai, berjalan, dan terlambat pada proyek terpilih</p></div>
            <Target size={16} className="text-violet-300"/>
          </div>
          {memberChartData.length > 0 ? (
            <div className="px-3 pb-5" style={{ height: Math.max(230, memberChartData.length * 48) }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberChartData} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 4 }} barCategoryGap={12}>
                  <CartesianGrid stroke="rgba(164,175,222,.09)" strokeDasharray="4 5" horizontal={false}/>
                  <XAxis type="number" allowDecimals={false} tick={{ fill: "#7782a1", fontSize: 9 }} axisLine={false} tickLine={false}/>
                  <YAxis type="category" dataKey="name" width={105} tick={{ fill: "#aeb7d0", fontSize: 9 }} axisLine={false} tickLine={false}/>
                  <Tooltip contentStyle={chartTooltipStyle}/>
                  <Legend wrapperStyle={{ fontSize: 9, color: "#99a3bd" }}/>
                  <Bar dataKey="selesai" name="Selesai" stackId="tasks" fill="#60dcb0" radius={[0, 4, 4, 0]}/>
                  <Bar dataKey="dikerjakan" name="Dikerjakan" stackId="tasks" fill="#9b7aff"/>
                  <Bar dataKey="terlambat" name="Terlambat" fill="#f0ad65" radius={[0, 4, 4, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="empty-state"><Users2 size={24}/><strong>Belum ada tugas yang ditugaskan</strong><p>Tugaskan pekerjaan kepada anggota melalui halaman Tugas. Setelah ada penugasan, perbandingan kinerja akan muncul di sini.</p></div>
          )}
        </section>
      ) : null}

      <div className="dashboard-grid">
        <section className="panel">
          <div className="panel-header"><div><h2 className="section-title">Tren penyelesaian</h2><p className="section-subtitle">Tugas selesai selama 14 hari terakhir</p></div><Activity size={15} className="text-emerald-300"/></div>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 12, bottom: 0, left: -20 }}>
                <CartesianGrid stroke="rgba(164,175,222,.09)" strokeDasharray="4 5" vertical={false}/>
                <XAxis dataKey="day" tick={{ fill: "#7782a1", fontSize: 8 }} axisLine={false} tickLine={false}/>
                <YAxis allowDecimals={false} tick={{ fill: "#7782a1", fontSize: 9 }} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={chartTooltipStyle}/>
                <Line type="monotone" dataKey="selesai" name="Tugas selesai" stroke="#60dcb0" strokeWidth={2.5} dot={{ r: 3, fill: "#60dcb0" }} activeDot={{ r: 5 }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header"><div><h2 className="section-title">Ketepatan waktu</h2><p className="section-subtitle">Persentase tugas selesai sebelum tenggat</p></div><Clock3 size={15} className="text-blue-300"/></div>
          <div className="panel-body space-y-4">
            {metrics.filter((item) => item.onTimeEligible > 0).length > 0 ? metrics.filter((item) => item.onTimeEligible > 0).map((item) => (
              <div key={item.member.user_id}>
                <div className="mb-2 flex items-center justify-between gap-3"><span className="text-[10px] text-slate-200">{item.member.full_name}</span><span className="text-[9px] text-slate-400">{item.onTimeRate}% · {item.onTimeEligible} tugas bertenggat</span></div>
                <div className="mini-progress"><span style={{ width: `${item.onTimeRate ?? 0}%`, background: "linear-gradient(90deg,#60dcb0,#4b9edb)" }}/></div>
              </div>
            )) : <div className="py-7 text-center"><Clock3 size={22} className="mx-auto mb-2 text-slate-600"/><p className="text-[10px] text-slate-400">Belum ada tugas selesai dengan tenggat yang tercatat.</p></div>}
          </div>
        </section>
      </div>

      <section className="panel">
        <div className="panel-header"><div><h2 className="section-title">Rincian kinerja anggota</h2><p className="section-subtitle">Persentase selesai dihitung hanya dari tugas pada proyek terpilih</p></div><Users2 size={15} className="text-violet-300"/></div>
        {metrics.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="task-table min-w-[720px]">
              <thead><tr><th>ANGGOTA</th><th>DITUGASKAN</th><th>SELESAI</th><th>BERJALAN</th><th>TERLAMBAT</th><th>PENYELESAIAN</th><th>TEPAT WAKTU</th></tr></thead>
              <tbody>
                {metrics.map((item) => (
                  <tr key={item.member.user_id}>
                    <td><div className="flex items-center gap-2.5"><div className="user-avatar !h-8 !w-8">{initials(item.member.full_name)}</div><div><strong className="block text-[10px] text-slate-200">{item.member.full_name}</strong><span className="text-[8px] text-slate-500">{item.member.role === "owner" ? "Owner" : item.member.role === "manager" ? "Project Manager" : "Member"}</span></div></div></td>
                    <td>{item.assigned}</td>
                    <td><span className="text-emerald-300">{item.done}</span></td>
                    <td>{item.inProgress + item.todo}</td>
                    <td><span className={item.overdue ? "text-amber-200" : "text-slate-400"}>{item.overdue}</span></td>
                    <td><div className="min-w-24"><div className="mb-1 text-[9px] text-slate-300">{item.completionRate}%</div><div className="mini-progress"><span style={{ width: `${item.completionRate}%` }}/></div></div></td>
                    <td>{item.onTimeRate === null ? <span className="text-slate-600">—</span> : <span className="text-slate-300">{item.onTimeRate}%</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state"><Users2 size={24}/><strong>Belum ada anggota yang dapat ditampilkan</strong><p>Anggota proyek akan muncul di sini setelah menerima undangan proyek.</p></div>
        )}
        <div className="border-t border-white/[.06] px-5 py-3 text-[9px] text-slate-500">{unassignedCount} tugas belum memiliki penanggung jawab dan tidak dihitung pada kinerja individu.</div>
      </section>

      <section className="panel">
        <div className="panel-header flex-wrap gap-3">
          <div><h2 className="section-title">Tugas berdasarkan anggota</h2><p className="section-subtitle">Lihat pekerjaan yang diberikan dan status terkini</p></div>
          <select className="select-control" value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)} aria-label="Pilih anggota">
            <option value="all">Semua anggota</option>
            {metrics.map((item) => <option key={item.member.user_id} value={item.member.user_id}>{item.member.full_name}</option>)}
          </select>
        </div>
        {selectedTasks.length > 0 ? <div className="overflow-x-auto"><table className="task-table min-w-[560px]"><thead><tr><th>TUGAS</th><th>PENANGGUNG JAWAB</th><th>TENGGAT</th><th>STATUS</th></tr></thead><tbody>{selectedTasks.map((task) => <tr key={task.id}><td><strong className="text-[10px] text-slate-200">{task.title}</strong><span className="mt-1 block text-[8px] text-slate-500">{task.project?.name ?? "Tanpa proyek"}</span></td><td>{task.assignee?.full_name ?? metrics.find((item) => item.member.user_id === task.assignee_id)?.member.full_name ?? "Anggota"}</td><td>{formatShortDate(task.due_date)}</td><td><span className={`status-pill ${task.status === "done" ? "status-done" : task.status === "in_progress" ? "status-in_progress" : "status-todo"}`}>{statusLabel(task.status)}</span></td></tr>)}</tbody></table></div> : <div className="empty-state"><CheckCircle2 size={24}/><strong>Belum ada tugas untuk ditampilkan</strong><p>Buat tugas lalu pilih anggota pada bagian Penanggung jawab. Tugas yang sudah ada juga bisa ditugaskan dari halaman Tugas.</p></div>}
      </section>

      {canViewTeam && unassignedCount > 0 && <div className="rounded-xl border border-amber-300/15 bg-amber-300/[.05] px-4 py-3 text-[10px] leading-relaxed text-amber-100/80"><strong className="font-semibold">Ada {unassignedCount} tugas belum ditugaskan.</strong> Tugaskan pekerjaan melalui pilihan Penanggung jawab pada daftar Tugas agar kinerjanya tercatat untuk anggota yang tepat.</div>}
      {canSeeOwnTasks && <p className="text-[9px] leading-relaxed text-slate-500">Sebagai anggota, kamu hanya dapat melihat laporan proyek yang dibagikan kepadamu. Owner proyek dan Project Manager dapat melihat ringkasan anggota proyek tersebut.</p>}
      <p className="text-[8px] text-slate-600">Perhitungan berdasarkan data tugas di Supabase. Grafik tren selalu memakai 14 hari terakhir. Tugas selesai tepat waktu hanya dihitung jika tanggal selesai dan tenggat tersedia; tugas tanpa penanggung jawab tidak masuk ke metrik individu.</p>
    </div>
  );
}
