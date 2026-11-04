import { Mail, ShieldCheck, Users2 } from "lucide-react";
import { PageHeading } from "@/components/shared/page-heading";
import { DemoBanner } from "@/components/shared/demo-banner";
import { getMembers, getWorkspaceContext } from "@/lib/data/queries";
import { initials } from "@/lib/utils";
import { MemberActions } from "@/components/team/member-actions";
import { InviteMemberDialog } from "@/components/team/invite-member-dialog";

export default async function TeamPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, members, context] = await Promise.all([searchParams, getMembers(), getWorkspaceContext()]);
  const query = (q ?? "").trim().toLowerCase();
  const filteredMembers = query ? members.filter((member) => `${member.full_name} ${member.email} ${member.role}`.toLowerCase().includes(query)) : members;
  const owners = filteredMembers.filter((member) => member.role === "owner").length;
  const admins = filteredMembers.filter((member) => member.role === "admin").length;
  const canInvite = context.role === "owner" || context.role === "admin";
  return <div className="app-content">
    {context.demo && <DemoBanner/>}
    <PageHeading eyebrow="WORKSPACE / TIM" title="Anggota workspace" description="Kenali orang-orang yang bekerja bersama dalam workspace ini." action={<span className="demo-mode-badge">{members.length} ANGGOTA</span>}/>
    <div className="stat-grid"><div className="stat-card"><div className="stat-top">Total anggota</div><div className="stat-value">{members.length}</div><div className="stat-foot">Terdaftar di workspace</div></div><div className="stat-card"><div className="stat-top">Owner</div><div className="stat-value">{owners}</div><div className="stat-foot">Pemilik workspace</div></div><div className="stat-card"><div className="stat-top">Admin</div><div className="stat-value">{admins}</div><div className="stat-foot">Pengelola workspace</div></div><div className="stat-card"><div className="stat-top">Anggota</div><div className="stat-value">{filteredMembers.length - owners - admins}</div><div className="stat-foot">Kolaborator</div></div></div>
    <div className="panel mt-5"><div className="panel-header"><div><h2 className="section-title">Daftar anggota</h2><p className="section-subtitle">{query ? `${filteredMembers.length} hasil untuk “${q}”` : "Informasi peran dalam workspace"}</p></div><Users2 size={16} className="text-violet-300"/></div><div className="overflow-x-auto"><table className="task-table"><thead><tr><th>ANGGOTA</th><th>EMAIL</th><th>PERAN</th><th>STATUS</th><th></th></tr></thead><tbody>{filteredMembers.map((member) => <tr key={member.id}><td><div className="flex items-center gap-3"><div className="user-avatar">{initials(member.full_name)}</div><div className="task-title-cell"><strong>{member.full_name}</strong><small>Anggota TaskFlow</small></div></div></td><td>{member.email}</td><td><span className="status-pill status-in_progress">{member.role === "owner" ? "Owner" : member.role === "admin" ? "Admin" : "Member"}</span></td><td><span className="inline-flex items-center gap-1.5 text-[8px] text-emerald-300"><i className="w-1.5 h-1.5 bg-emerald-400 rounded-full"/> Aktif</span></td><td><MemberActions name={member.full_name} email={member.email} role={member.role}/></td></tr>)}</tbody></table>{filteredMembers.length === 0 && <div className="panel-body py-10 text-center text-[10px] text-slate-500">Tidak ada anggota yang cocok dengan pencarian.</div>}</div><div className="panel-body border-t border-white/[.06] mt-1"><div className="flex gap-3 items-start"><ShieldCheck size={16} className="text-violet-300 mt-0.5"/><p className="text-[9px] text-slate-500 leading-relaxed">Undangan menggunakan tautan sekali pakai yang berlaku 7 hari. Penerima harus masuk dengan email yang dituju agar dapat bergabung.</p></div></div></div>
    <div className="panel mt-4 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div><div className="flex items-center gap-2"><Mail size={15} className="text-violet-300"/><strong className="text-xs">Ingin mengundang anggota baru?</strong></div><p className="text-[9px] text-slate-500 mt-2">Buat tautan undangan dan bagikan melalui chat atau email.</p></div><InviteMemberDialog canInvite={canInvite}/></div>
  </div>;
}
