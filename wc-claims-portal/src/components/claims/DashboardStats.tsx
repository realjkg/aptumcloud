import { FileText, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import type { DashboardMetrics } from "@/lib/claims";

export function DashboardStats({ metrics }: { metrics: DashboardMetrics }) {
  const STATS = [
    {
      label: "Open Claims",
      value: metrics.openClaims,
      change: "Currently active",
      icon: FileText,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Pending Review",
      value: metrics.pendingReview,
      change: "Requires action",
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Closed This Month",
      value: metrics.closedThisMonth,
      change: "Month to date",
      icon: CheckCircle,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "High Risk / Escalated",
      value: metrics.highRisk,
      change: "Needs escalation",
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map((stat) => (
        <div
          key={stat.label}
          className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-slate-600">{stat.label}</span>
            <div className={`${stat.bg} p-2 rounded-lg`}>
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
          <p className="text-xs text-slate-500 mt-1">{stat.change}</p>
        </div>
      ))}
    </div>
  );
}
