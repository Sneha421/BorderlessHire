"use client";

import { FormEvent, useMemo, useRef, useState } from "react";

type InterviewCoachProps = {
  company: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status?: "ready" | "streaming";
};

const starterPrompts = [
  "Give me a first-round mock interview for this company.",
  "Ask me behavioural questions and grade my answers.",
  "What company-specific questions should I prepare for?"
];

export function InterviewCoach({ company }: InterviewCoachProps) {
  const [input, setInput] = useState(
    company
      ? `Give me a first-round mock interview for ${company}.`
      : "Give me a first-round mock interview for a sponsor-friendly Singapore employer."
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messageIdRef = useRef(0);

  const coachStatus = useMemo(() => {
    if (isStreaming) {
      return {
        label: "Coach is drafting feedback",
        tone: "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100"
      };
    }

    return {
      label: "Interview coach ready",
      tone: "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
    };
  }, [isStreaming]);

  function createMessage(role: Message["role"], content: string, status?: Message["status"]) {
    messageIdRef.current += 1;

    return {
      id: `${role}-${messageIdRef.current}`,
      role,
      content,
      status
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isStreaming) {
      return;
    }

    setError(null);
    setIsStreaming(true);

    const userMessage = createMessage("user", trimmed);
    const assistantMessage = createMessage("assistant", "", "streaming");

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setInput("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          company,
          message: trimmed
        })
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(payload?.error || "Coach request failed.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) {
          continue;
        }

        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessage.id
              ? {
                  ...message,
                  content: message.content + chunk
                }
              : message
          )
        );
      }

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, status: "ready" }
            : message
        )
      );
    } catch (streamError) {
      const message =
        streamError instanceof Error ? streamError.message : "Streaming failed.";

      setError(message);
      setMessages((current) =>
        current.map((entry) =>
          entry.id === assistantMessage.id
            ? {
                ...entry,
                content:
                  entry.content ||
                  "I couldn't reach the interview coach. Add your OpenAI API key and try again.",
                status: "ready"
              }
            : entry
        )
      );
    } finally {
      setIsStreaming(false);
    }
  }

  function applyStarter(prompt: string) {
    setInput(company ? prompt.replace("this company", company) : prompt);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="space-y-5">
        <div className={`rounded-[1.75rem] border p-5 ${coachStatus.tone}`}>
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em]">
            Coach status
          </p>
          <p className="mt-3 text-xl font-semibold">{coachStatus.label}</p>
          <p className="mt-2 text-sm leading-6 opacity-90">
            Streaming replies appear token by token so you can start reading before
            the full answer finishes.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-amber-200 bg-amber-50 p-5 dark:border-amber-500/30 dark:bg-amber-500/10">
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-amber-900 dark:text-amber-200">
            Coach notes
          </p>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-amber-950 dark:text-amber-100">
            <li>Anchor answers in Singapore market context, not generic global interview advice.</li>
            <li>Mention teamwork across cultures and your reason for targeting Singapore.</li>
            <li>For sponsor-friendly firms, connect your value to regional scale and specialization.</li>
          </ul>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-5 dark:border-slate-800 dark:bg-slate-900/80">
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Selected company
          </p>
          <p className="mt-2 text-2xl font-semibold text-slate-950 dark:text-white">
            {company || "Choose a role from the board"}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {starterPrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => applyStarter(prompt)}
                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </aside>

      <section className="rounded-[2rem] border border-slate-200 bg-white/85 p-4 shadow-card dark:border-slate-800 dark:bg-slate-950/80 sm:p-6">
        <div className="flex min-h-[26rem] flex-col gap-4 rounded-[1.5rem] bg-slate-50 p-4 dark:bg-slate-900/90">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center rounded-[1.25rem] border border-dashed border-slate-300 bg-white/70 p-6 text-center dark:border-slate-700 dark:bg-slate-950/70">
              <div className="max-w-md">
                <p className="text-lg font-semibold text-slate-950 dark:text-white">
                  Start a mock interview
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Ask for behavioural questions, company-specific drills, or answer
                  feedback. Responses will stream into this panel live.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[92%] rounded-[1.5rem] px-4 py-3 ${
                  message.role === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "mr-auto bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-slate-100"
                } [content-visibility:auto] [contain-intrinsic-size:0_120px]`}
              >
                <p className="font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.24em] opacity-70">
                  {message.role === "user" ? "You" : "Interview Coach"}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                  {message.status === "streaming" ? (
                    <span className="ml-1 inline-block h-4 w-2 animate-pulse rounded-full bg-amber-400 align-middle" />
                  ) : null}
                </p>
              </article>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="grid gap-2">
            <span className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Prompt the coach
            </span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              rows={4}
              placeholder="Ask for questions, model answers, or feedback on your draft."
              className="w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {error ? <span className="text-rose-600 dark:text-rose-300">{error}</span> : "In-memory chat only. No auth, no database, no saved transcripts."}
            </p>
            <button
              type="submit"
              disabled={isStreaming}
              className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isStreaming ? "Streaming..." : "Send to Coach"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
