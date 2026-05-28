import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getClaimsAdapter } from "@/lib/claims";
import { AppShell } from "@/components/ui/AppShell";
import { ClaimsTable } from "@/components/claims/ClaimsTable";

export default async function ClaimsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const claims = await getClaimsAdapter().listClaims();

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Claims</h1>
          <p className="text-slate-500 mt-1">
            Manage and review workers&apos; compensation claims
          </p>
        </div>
        <ClaimsTable claims={claims} />
      </div>
    </AppShell>
  );
}
