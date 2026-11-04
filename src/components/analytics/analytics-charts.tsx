"use client";

import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Distribution = { name: string; value: number; color: string };
type Weekly = { day: string; value: number };

export function AnalyticsCharts({ distribution, weeklyData }: { distribution: Distribution[]; weeklyData: Weekly[] }) {
  return <div className="dashboard-grid mt-4">
    <div className="panel"><div className="panel-header"><div><h2 className="section-title">Tugas selesai per hari</h2><p className="section-subtitle">Data tugas selesai dalam tujuh hari terakhir</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={weeklyData} margin={{ top: 12, right: 12, bottom: 0, left: -20 }}><CartesianGrid stroke="rgba(164,175,222,.09)" strokeDasharray="4 5" vertical={false}/><XAxis dataKey="day" tick={{ fill: "#7782a1", fontSize: 9 }} axisLine={false} tickLine={false}/><YAxis tick={{ fill: "#7782a1", fontSize: 9 }} axisLine={false} tickLine={false}/><Tooltip contentStyle={{ background: "#171d34", border: "1px solid rgba(169,150,255,.25)", borderRadius: 10, fontSize: 10 }}/><Bar dataKey="value" name="Tugas selesai" radius={[6,6,0,0]} fill="#9471f5"/></BarChart></ResponsiveContainer></div></div>
    <div className="panel"><div className="panel-header"><div><h2 className="section-title">Distribusi status tugas</h2><p className="section-subtitle">Perbandingan status pekerjaan</p></div></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={4} stroke="none">{distribution.map((entry) => <Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip contentStyle={{ background: "#171d34", border: "1px solid rgba(169,150,255,.25)", borderRadius: 10, fontSize: 10 }}/></PieChart></ResponsiveContainer></div><div className="flex flex-wrap justify-center gap-4 pb-5">{distribution.map((item) => <span key={item.name} className="flex items-center gap-2 text-[8px] text-slate-400"><i className="w-2 h-2 rounded-full" style={{ background: item.color }}/>{item.name}: {item.value}</span>)}</div></div>
  </div>;
}
