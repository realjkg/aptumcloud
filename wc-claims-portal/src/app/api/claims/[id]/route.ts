import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getClaimsAdapter } from "@/lib/claims";

export const runtime = "nodejs";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const adapter = getClaimsAdapter();
    const claim = await adapter.getClaim(id);
    if (!claim) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    return NextResponse.json(claim);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load claim";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
