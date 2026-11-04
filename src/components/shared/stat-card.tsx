import type { LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";

export function StatCard({ label, value, foot, icon: Icon, tone = "purple" }: { label: string; value: string | number; foot: string; icon: LucideIcon; tone?: "purple" | "blue" | "green" | "orange" }) {
  const tones = {
    purple: { background: "rgba(151,111,255,.14)", color: "#b79cff", glow: "rgba(148,109,255,.18)" },
    blue: { background: "rgba(93,139,255,.14)", color: "#8db2ff", glow: "rgba(93,139,255,.18)" },
    green: { background: "rgba(79,211,163,.13)", color: "#70e1b8", glow: "rgba(79,211,163,.14)" },
    orange: { background: "rgba(244,183,102,.13)", color: "#f4c47e", glow: "rgba(244,183,102,.14)" },
  };
  const toneValue = tones[tone];
  return <article className="stat-card" style={{ "--stat-glow": toneValue.glow } as CSSProperties & { "--stat-glow": string }}><div className="stat-top"><span>{label}</span><span className="stat-icon" style={{ background: toneValue.background, color: toneValue.color }}><Icon size={16}/></span></div><div className="stat-value">{value}</div><div className="stat-foot"><span className="trend-up">● </span>{foot}</div></article>;
}
