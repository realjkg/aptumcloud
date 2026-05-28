import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getClaimsAdapter } from "@/lib/claims";

export const runtime = "nodejs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const adapter = getClaimsAdapter();
    const claims = await adapter.listClaims();
    return NextResponse.json(claims);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to load claims";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
