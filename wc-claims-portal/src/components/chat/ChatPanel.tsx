"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { clsx } from "clsx";
import type { Message } from "@/types/chat";

interface Props {
  claimId?: string;
}

let _msgId = 0;
const uid = () => `msg-${++_msgId}-${Date.now()}`;

export function ChatPanel({ claimId }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: uid(),
      role: "assistant",
      content: claimId
        ? `I'm your WC claims assistant. I have context for claim **${claimId}**. How can I help you with this claim today?`
        : "I'm your WC claims assistant. Ask me about any claim, coverage analysis, return-to-work planning, reserves, or jurisdiction requirements.",
      createdAt: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || streaming) return;

    const userMsg: Message = {
      id: uid(),
      role: "user",
      content,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setStreaming(true);

    const assistantId = uid();
    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", createdAt: new Date() },
    ]);

    try {
      const history = [...messages, userMsg]
        .filter((m) => m.role !== "system")
        .map(({ role, content }) => ({ role, content }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, claimId }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      if (!reader) throw new Error("No response body");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data) as {
              content?: string;
              error?: string;
            };
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, content: m.content + parsed.content! }
                    : m
                )
              );
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (err) {
      const errorText =
        err instanceof Error ? err.message : "Something went wrong";
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `_Error: ${errorText}. Please try again._`,
              }
            : m
        )
      );
    } finally {
      setStreaming(false);
    }
  }, [input, streaming, messages, claimId]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
        <Bot className="w-4 h-4 text-brand-600" />
        <span className="text-sm font-semibold text-slate-900">
          WC Claims Assistant
        </span>
        {claimId && (
          <span className="text-xs font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded ml-auto">
            {claimId}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scrollbar-thin">
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="px-4 py-3 border-t border-slate-100">
        <div className="flex gap-2 items-end">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Ask about this claim… (Shift+Enter for new line)"
            rows={2}
            disabled={streaming}
            className="flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-slate-50 disabled:text-slate-400"
          />
          <button
            onClick={send}
            disabled={!input.trim() || streaming}
            className="p-2.5 rounded-lg bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Send message"
          >
            {streaming ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5">
          AI-generated responses. Verify against jurisdiction statutes and
          clinical guidelines.
        </p>
      </div>
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={clsx("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={clsx(
          "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5",
          isUser ? "bg-brand-600" : "bg-slate-100"
        )}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5 text-white" />
        ) : (
          <Bot className="w-3.5 h-3.5 text-slate-600" />
        )}
      </div>
      <div
        className={clsx(
          "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
          isUser
            ? "bg-brand-600 text-white"
            : "bg-slate-50 border border-slate-200 text-slate-900"
        )}
      >
        {message.content ? (
          <ReactMarkdown
            className={clsx(
              "prose prose-sm max-w-none",
              isUser
                ? "prose-invert"
                : "prose-slate prose-headings:text-slate-900 prose-code:text-brand-700"
            )}
          >
            {message.content}
          </ReactMarkdown>
        ) : (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
        )}
      </div>
    </div>
  );
}
