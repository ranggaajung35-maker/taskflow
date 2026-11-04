"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { Pause, Play, RotateCcw, Timer } from "lucide-react";
import { toast } from "sonner";

const FOCUS_SECONDS = 25 * 60;

function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function FocusTimer() {
  const [remaining, setRemaining] = useState(FOCUS_SECONDS);
  const [running, setRunning] = useState(false);
  const [deadline, setDeadline] = useState<number | null>(null);
  const [sessions, setSessions] = useState(0);
  const progress = useMemo(() => (FOCUS_SECONDS - remaining) / FOCUS_SECONDS, [remaining]);
  const dashOffset = 326.7 * (1 - progress);

  useEffect(() => {
    if (!running || deadline === null) return;

    const timerId = window.setInterval(() => {
      const nextRemaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining((current) => current === nextRemaining ? current : nextRemaining);

      if (nextRemaining === 0) {
        window.clearInterval(timerId);
        setRunning(false);
        setDeadline(null);
        setSessions((count) => count + 1);
        toast.success("Sesi fokus selesai. Saatnya istirahat sejenak!");
      }
    }, 250);

    return () => window.clearInterval(timerId);
  }, [running, deadline]);

  function resetTimer() {
    setRunning(false);
    setDeadline(null);
    setRemaining(FOCUS_SECONDS);
  }

  function toggleTimer() {
    if (remaining === 0) {
      resetTimer();
      return;
    }

    if (running) {
      setRunning(false);
      setDeadline(null);
      return;
    }

    setDeadline(Date.now() + remaining * 1000);
    setRunning(true);
  }

  return <div className="focus-widget">
    <div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2"><span className="focus-icon"><Timer size={14}/></span><div><strong className="block text-[10px] text-slate-200">Focus session</strong><small className="block text-[8px] text-slate-500 mt-1">Siklus fokus 25 menit</small></div></div><span className="focus-session-count">{sessions} sesi selesai</span></div>
    <div className="flex items-center gap-5 mt-4"><div className="focus-ring"><svg viewBox="0 0 120 120" aria-label={`Sisa waktu ${formatClock(remaining)}`}><circle cx="60" cy="60" r="52" fill="none" stroke="rgba(148,160,205,.13)" strokeWidth="7"/><motion.circle cx="60" cy="60" r="52" fill="none" stroke="url(#focusGradient)" strokeWidth="7" strokeLinecap="round" strokeDasharray="326.7" animate={{ strokeDashoffset: dashOffset }} transition={{ duration: .35 }} transform="rotate(-90 60 60)"/><defs><linearGradient id="focusGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#b18cff"/><stop offset="100%" stopColor="#5d8eff"/></linearGradient></defs></svg><div className="focus-time">{formatClock(remaining)}</div></div><div className="min-w-0 flex-1"><p className="text-[9px] leading-relaxed text-slate-400">{remaining === 0 ? "Sesi selesai. Ambil jeda, lalu mulai lagi." : running ? "Jauhkan distraksi dan fokus pada satu hal." : "Mulai timer saat kamu siap mengerjakan satu tugas."}</p><div className="flex items-center gap-2 mt-3"><button className="btn-primary btn-small" onClick={toggleTimer}>{remaining === 0 ? <RotateCcw size={12}/> : running ? <Pause size={12}/> : <Play size={12}/>} {remaining === 0 ? "Ulangi" : running ? "Jeda" : "Mulai fokus"}</button><button className="icon-button" onClick={resetTimer} aria-label="Reset timer"><RotateCcw size={13}/></button></div></div></div>
  </div>;
}
