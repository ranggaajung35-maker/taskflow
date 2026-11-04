import Link from "next/link";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <svg viewBox="0 0 40 40" aria-hidden="true" className="brand-mark">
        <defs><linearGradient id="taskflowGradient" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#B58CFF"/><stop offset="1" stopColor="#5B6CFF"/></linearGradient></defs>
        <path d="M20 3.5 35.5 12.4v15.2L20 36.5 4.5 27.6V12.4L20 3.5Z" fill="url(#taskflowGradient)" opacity=".18"/>
        <path d="m10.3 20.7 6.1 6.1 13.4-14" fill="none" stroke="url(#taskflowGradient)" strokeWidth="5.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {!compact && <span className="brand-word">Task<span>Flow</span></span>}
    </span>
  );
}
