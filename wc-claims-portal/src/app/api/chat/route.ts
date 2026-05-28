import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import {
  getAzureOpenAIClient,
  DEPLOYMENT,
  WC_SYSTEM_PROMPT,
  type ChatRequestMessage,
} from "@/lib/azure-openai";
import { z } from "zod";
import { ROLES, forbiddenIfMissingRole } from "@/lib/rbac";
import { auditLog, buildAuditEvent } from "@/lib/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

// ---------------------------------------------------------------------------
// Per-user sliding window rate limiter — 20 requests / 60 seconds.
// Resets on cold start; sufficient to prevent runaway Azure OpenAI spend.
// ---------------------------------------------------------------------------
const _windows = new Map<string, number[]>();

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const window = (_windows.get(userId) ?? []).filter((t) => now - t < 60_000);
  if (window.length >= 20) return true;
  window.push(now);
  _windows.set(userId, window);
  return false;
}

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(32_000),
      })
    )
    .min(1)
    .max(50),
  claimId: z.string().optional(),
  jurisdiction: z.string().length(2).toUpperCase().optional(),
});

export async function POST(req: NextRequest) {
  // Require authenticated session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // RBAC — only adjusters and supervisors may invoke the AI
  const rbacDenied = forbiddenIfMissingRole(
    session.user.roles,
    ROLES.ADJUSTER,
    ROLES.SUPERVISOR
  );
  if (rbacDenied) return rbacDenied;

  const userId = session.user.oid ?? session.user.email ?? "unknown";
  if (isRateLimited(userId)) {
    auditLog(buildAuditEvent("chat.rate_limited", session.user));
    return NextResponse.json(
      { error: "Too many requests. Please wait a moment before sending another message." },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Bad request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { messages, claimId, jurisdiction } = parsed.data;

  auditLog(
    buildAuditEvent("chat.request", session.user, {
      claimId,
      jurisdiction,
      metadata: { messageCount: messages.length },
    })
  );

  let systemContent = WC_SYSTEM_PROMPT;
  if (claimId || jurisdiction) {
    const ctx = ["## Active Claim Context"];
    if (claimId)     ctx.push(`Claim ID: ${claimId}`);
    if (jurisdiction) ctx.push(`Jurisdiction: ${jurisdiction} — apply ${jurisdiction} Workers' Compensation statutes, deadlines, and form requirements.`);
    systemContent += "\n\n" + ctx.join("\n");
  }

  const client = getAzureOpenAIClient();

  const chatMessages: ChatRequestMessage[] = [
    { role: "system", content: systemContent },
    ...messages,
  ];

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();

      try {
        const events = await client.streamChatCompletions(
          DEPLOYMENT,
          chatMessages,
          { maxTokens: 2048, temperature: 0.2 }
        );

        for await (const event of events) {
          for (const choice of event.choices) {
            const delta = choice.delta?.content;
            if (delta) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
              );
            }
          }
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Azure OpenAI error";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: message })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
