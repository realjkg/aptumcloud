import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/ui/AppShell";
import { DashboardStats } from "@/components/claims/DashboardStats";
import { RecentActivity } from "@/components/claims/RecentActivity";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {session.user.name?.split(" ")[0]}
          </h1>
          <p className="text-slate-500 mt-1">
            WC Claims Dashboard — {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <DashboardStats />
        <div className="mt-8">
          <RecentActivity />
        </div>
      </div>
    </AppShell>
  );
}
