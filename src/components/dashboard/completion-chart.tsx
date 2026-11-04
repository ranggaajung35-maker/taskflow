"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type CompletionPoint = { day: string; completed: number; created: number };

export function CompletionChart({ data }: { data: CompletionPoint[] }) {
  return <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ top: 12, right: 12, bottom: 0, left: -22 }}>
    <defs><linearGradient id="linePurple" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#9567f8"/><stop offset="100%" stopColor="#6b94ff"/></linearGradient></defs>
    <CartesianGrid stroke="rgba(164,175,222,.09)" strokeDasharray="4 5" vertical={false}/>
    <XAxis dataKey="day" tick={{ fill: "#7782a1", fontSize: 9 }} axisLine={false} tickLine={false} dy={8}/>
    <YAxis tick={{ fill: "#7782a1", fontSize: 9 }} axisLine={false} tickLine={false}/>
    <Tooltip contentStyle={{ background: "#171d34", border: "1px solid rgba(169,150,255,.25)", borderRadius: 10, color: "#e5e7f5", fontSize: 10 }} labelStyle={{ color: "#a99aff" }} />
    <Line type="monotone" dataKey="completed" name="Selesai" stroke="url(#linePurple)" strokeWidth={2.7} dot={{ r: 3, fill: "#a786ff", strokeWidth: 0 }} activeDot={{ r: 5, stroke: "#171d34", strokeWidth: 3 }}/>
    <Line type="monotone" dataKey="created" name="Dibuat" stroke="#54d4b0" strokeWidth={1.8} strokeDasharray="4 4" dot={false}/>
  </LineChart></ResponsiveContainer></div>;
}
