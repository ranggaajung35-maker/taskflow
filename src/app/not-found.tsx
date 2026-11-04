import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return <main className="min-h-screen bg-[#090c18] grid place-items-center px-6"><div className="text-center max-w-md"><div className="mb-8 flex justify-center"><Logo/></div><SearchX size={42} className="mx-auto text-violet-300 mb-4"/><p className="text-[10px] tracking-[2px] text-violet-300 font-bold">404 — PAGE NOT FOUND</p><h1 className="text-3xl font-bold tracking-tight mt-3">Halaman tidak ditemukan</h1><p className="text-sm text-slate-400 leading-relaxed mt-3">Alamat yang kamu buka tidak tersedia atau sudah dipindahkan.</p><Link className="btn-primary mt-7" href="/dashboard"><ArrowLeft size={15}/> Kembali ke dashboard</Link></div></main>;
}
