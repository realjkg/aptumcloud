import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";
import type { ActivityItem } from "@/lib/claims";

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-blue-100 text-blue-700",
  rtw:       "bg-green-100 text-green-700",
  escalated: "bg-red-100 text-red-700",
  pending:   "bg-amber-100 text-amber-700",
  closed:    "bg-slate-100 text-slate-600",
};

export function RecentActivity({ items }: { items: ActivityItem[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Recent Activity</h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {items.map((a) => (
          <li key={`${a.claimId}-${a.timestamp}`}>
            <Link
              href={`/claims/${a.claimId}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-900">{a.claimantName}</span>
                  <span className="text-xs text-slate-400">{a.claimId}</span>
                </div>
                <p className="text-sm text-slate-600 truncate">{a.event}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={clsx(
                    "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                    STATUS_BADGE[a.status]
                  )}
                >
                  {a.status}
                </span>
                <span className="text-xs text-slate-400">
                  {formatDistanceToNow(new Date(a.timestamp), { addSuffix: true })}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
