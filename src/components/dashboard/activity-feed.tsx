import { formatDistanceToNow, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import type { Activity } from "@/lib/types";

export function ActivityFeed({ activities }: { activities: Activity[] }) {
  return <div className="activity-list">{activities.length ? activities.map((activity) => <div className="activity-item" key={activity.id}><span className="activity-dot"/><div><p><strong className="text-slate-200">{activity.actor_name ?? "Anggota"}</strong> {activity.description}</p><small>{formatDistanceToNow(parseISO(activity.created_at), { addSuffix: true, locale: id })}</small></div></div>) : <p className="text-[10px] text-slate-500">Belum ada aktivitas terbaru.</p>}</div>;
}
