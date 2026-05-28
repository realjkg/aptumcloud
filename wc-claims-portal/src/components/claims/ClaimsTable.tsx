import Link from "next/link";
import { clsx } from "clsx";
import { MessageSquare } from "lucide-react";
import type { ClaimSummary } from "@/lib/claims";

const STATUS_BADGE: Record<string, string> = {
  active:    "bg-blue-100 text-blue-700",
  rtw:       "bg-green-100 text-green-700",
  escalated: "bg-red-100 text-red-700",
  pending:   "bg-amber-100 text-amber-700",
  closed:    "bg-slate-100 text-slate-600",
};

export function ClaimsTable({ claims }: { claims: ClaimSummary[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              {["Claim #", "Claimant", "Date of Loss", "Employer", "State", "Type", "Status", "Adjuster", ""].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {claims.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-mono text-xs text-slate-700">{c.id}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{c.claimantName}</td>
                <td className="px-4 py-3 text-slate-600">{c.dateOfLoss}</td>
                <td className="px-4 py-3 text-slate-600">{c.employer}</td>
                <td className="px-4 py-3">
                  <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {c.jurisdiction}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.type}</td>
                <td className="px-4 py-3">
                  <span
                    className={clsx(
                      "text-xs font-medium px-2 py-0.5 rounded-full capitalize",
                      STATUS_BADGE[c.status]
                    )}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">{c.adjuster}</td>
                <td className="px-4 py-3">
                  <Link
                    href={`/claims/${c.id}`}
                    className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700 font-medium text-xs"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Open
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
