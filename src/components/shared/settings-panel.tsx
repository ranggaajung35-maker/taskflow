"use client";

import { useState, useTransition } from "react";
import { Bell, Check, Globe2, LockKeyhole, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import { updateProfileAction } from "@/lib/actions/profile";

export function SettingsPanel({ fullName, email, demo }: { fullName: string; email: string; demo: boolean }) {
  const [name, setName] = useState(fullName);
  const [timezone, setTimezone] = useState("Asia/Makassar");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [taskReminders, setTaskReminders] = useState(true);
  const [pending, startTransition] = useTransition();
  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      const result = await updateProfileAction({ full_name: name, timezone });
      if (!result.ok) toast.error(result.message);
      else toast.success(result.message);
    });
  }
  return <div className="settings-grid">
    <div className="panel settings-nav"><a href="#profile" className="active"><UserRound size={14}/> Profil</a><a href="#notifications"><Bell size={14}/> Notifikasi</a><a href="#security"><LockKeyhole size={14}/> Keamanan</a><a href="#preferences"><Globe2 size={14}/> Preferensi</a></div>
    <div className="space-y-4">
      <section id="profile" className="panel settings-form"><div className="flex items-center gap-2 mb-2"><UserRound size={15} className="text-violet-300"/><h3>Informasi profil</h3></div><p>Perbarui informasi dasar akun TaskFlow kamu.</p><form onSubmit={saveProfile}><label className="field-label">Nama lengkap</label><input className="field-control" value={name} onChange={(event) => setName(event.target.value)} minLength={2} maxLength={80} required/><label className="field-label">Alamat email</label><input className="field-control opacity-60" value={email} readOnly/><label className="field-label">Zona waktu</label><select className="field-control" value={timezone} onChange={(event) => setTimezone(event.target.value)}><option value="Asia/Makassar">WITA — Makassar</option><option value="Asia/Jakarta">WIB — Jakarta</option><option value="Asia/Jayapura">WIT — Jayapura</option></select><div className="flex justify-end mt-5"><button className="btn-primary btn-small" type="submit" disabled={pending}><Save size={13}/>{pending ? "Menyimpan..." : "Simpan perubahan"}</button></div></form></section>
      <section id="notifications" className="panel settings-form"><div className="flex items-center gap-2 mb-2"><Bell size={15} className="text-violet-300"/><h3>Preferensi notifikasi</h3></div><p>Kontrol notifikasi yang ingin kamu terima.</p><div className="flex items-center justify-between py-3 border-b border-white/[.06]"><div><strong className="block text-[10px]">Notifikasi email</strong><small className="block text-[8px] text-slate-500 mt-1">Ringkasan aktivitas workspace melalui email.</small></div><button onClick={() => setEmailNotifications(!emailNotifications)} className={`w-9 h-5 rounded-full p-0.5 transition-colors ${emailNotifications ? "bg-violet-500" : "bg-slate-700"}`} aria-label="Toggle notifikasi email"><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${emailNotifications ? "translate-x-4" : "translate-x-0"}`}/></button></div><div className="flex items-center justify-between py-3"><div><strong className="block text-[10px]">Pengingat tenggat</strong><small className="block text-[8px] text-slate-500 mt-1">Pengingat untuk tugas yang mendekati tenggat.</small></div><button onClick={() => setTaskReminders(!taskReminders)} className={`w-9 h-5 rounded-full p-0.5 transition-colors ${taskReminders ? "bg-violet-500" : "bg-slate-700"}`} aria-label="Toggle pengingat tenggat"><span className={`block h-4 w-4 rounded-full bg-white transition-transform ${taskReminders ? "translate-x-4" : "translate-x-0"}`}/></button></div><p className="text-[8px] text-slate-600">Preferensi notifikasi ini masih tersimpan pada sesi antarmuka dan belum disimpan ke database.</p></section>
      <section id="security" className="panel settings-form"><div className="flex items-center gap-2 mb-2"><LockKeyhole size={15} className="text-violet-300"/><h3>Keamanan akun</h3></div><p>Pengamanan akun dikelola oleh Supabase Auth saat integrasi aktif.</p><div className="flex items-center justify-between py-3 border-y border-white/[.06]"><div><strong className="block text-[10px]">Autentikasi email</strong><small className="block text-[8px] text-slate-500 mt-1">{demo ? "Belum dikonfigurasi dalam mode demo" : "Dikelola melalui penyedia autentikasi"}</small></div><span className="status-pill status-in_progress">{demo ? "Demo" : "Terhubung"}</span></div><p className="mt-4">Gunakan password yang unik dan jangan membagikan kode konfirmasi akun.</p></section>
      <section id="preferences" className="panel settings-form"><div className="flex items-center gap-2 mb-2"><Globe2 size={15} className="text-violet-300"/><h3>Preferensi aplikasi</h3></div><p>Pengaturan bahasa dan tampilan aplikasi.</p><div className="flex items-center justify-between py-2"><div><strong className="block text-[10px]">Bahasa aplikasi</strong><small className="block text-[8px] text-slate-500 mt-1">Bahasa antarmuka saat ini.</small></div><span className="text-[10px] text-slate-300">Bahasa Indonesia</span></div><div className="flex items-center justify-between py-2"><div><strong className="block text-[10px]">Tema</strong><small className="block text-[8px] text-slate-500 mt-1">Tema gelap TaskFlow.</small></div><span className="text-[10px] text-slate-300 flex items-center gap-1"><Check size={12} className="text-emerald-300"/> Gelap</span></div></section>
    </div>
  </div>;
}
