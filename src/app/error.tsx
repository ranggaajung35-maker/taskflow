"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <main className="min-h-screen bg-[#090c18] grid place-items-center px-6"><div className="text-center max-w-md"><AlertTriangle size={38} className="mx-auto text-amber-300 mb-5"/><h1 className="text-2xl font-bold">Terjadi kendala</h1><p className="text-sm text-slate-400 leading-relaxed mt-3">Halaman belum dapat dimuat. Coba muat ulang, dan periksa koneksi atau konfigurasi database jika masalah berlanjut.</p><button className="btn-primary mt-7" onClick={() => reset()}><RefreshCw size={15}/> Coba lagi</button></div></main>;
}
