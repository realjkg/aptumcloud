"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { clsx } from "clsx";

const ACTIVITIES = [
  {
    id: "WC-2024-0891",
    claimant: "Maria Garcia",
    event: "IME report uploaded",
    status: "active",
    ts: new Date(Date.now() - 1000 * 60 * 14),
  },
  {
    id: "WC-2024-0876",
    claimant: "James Whitfield",
    event: "RTW modified duty offer accepted",
    status: "rtw",
    ts: new Date(Date.now() - 1000 * 60 * 47),
  },
  {
    id: "WC-2024-0902",
    claimant: "Sandra Lee",
    event: "Reserve increase — exceeds authority",
    status: "escalated",
    ts: new Date(Date.now() - 1000 * 60 * 90),
  },
  {
    id: "WC-2024-0855",
    claimant: "Derek Okafor",
    event: "MMI reached — impairment rating pending",
    status: "pending",
    ts: new Date(Date.now() - 1000 * 60 * 60 * 3),
  },
  {
    id: "WC-2024-0801",
    claimant: "Patricia Nowak",
    event: "Claim closed — full RTW",
    status: "closed",
    ts: new Date(Date.now() - 1000 * 60 * 60 * 6),
  },
];

const STATUS_BADGE: Record<string, string> = {
  active: "bg-blue-100 text-blue-700",
  rtw: "bg-green-100 text-green-700",
  escalated: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
  closed: "bg-slate-100 text-slate-600",
};

export function RecentActivity() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h2 className="font-semibold text-slate-900">Recent Activity</h2>
      </div>
      <ul className="divide-y divide-slate-100">
        {ACTIVITIES.map((a) => (
          <li key={a.id}>
            <Link
              href={`/claims/${a.id}`}
              className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-sm font-medium text-slate-900">
                    {a.claimant}
                  </span>
                  <span className="text-xs text-slate-400">{a.id}</span>
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
                  {formatDistanceToNow(a.ts, { addSuffix: true })}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
