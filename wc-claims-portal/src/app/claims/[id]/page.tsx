import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AppShell } from "@/components/ui/AppShell";
import { ClaimDetail } from "@/components/claims/ClaimDetail";
import { ChatPanel } from "@/components/chat/ChatPanel";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ClaimPage({ params }: Props) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/signin");

  const { id } = await params;

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 h-[calc(100vh-10rem)]">
          <div className="overflow-y-auto scrollbar-thin">
            <ClaimDetail claimId={id} />
          </div>
          <div className="flex flex-col">
            <ChatPanel claimId={id} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
