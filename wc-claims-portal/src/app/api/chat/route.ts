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

export const runtime = "nodejs";
export const maxDuration = 60;

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
});

export async function POST(req: NextRequest) {
  // Require authenticated session
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

  const { messages, claimId } = parsed.data;

  const systemContent = claimId
    ? `${WC_SYSTEM_PROMPT}\n\n## Active Claim Context\nClaim ID: ${claimId}`
    : WC_SYSTEM_PROMPT;

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
