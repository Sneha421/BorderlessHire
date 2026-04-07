import { NextRequest } from "next/server";

import { createInterviewCoachStream } from "@/app/actions/chat";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    type ChatRole = "user" | "assistant";

    const body = (await request.json()) as {
      company?: string;
      history?: Array<{
        role?: ChatRole;
        content?: string;
      }>;
      message?: string;
      mode?: "text" | "voice";
    };

    const history: Array<{ role: ChatRole; content: string }> =
      body.history
        ?.map((message) => ({
          role: (message.role === "assistant" ? "assistant" : "user") as ChatRole,
          content: message.content?.trim() || ""
        }))
        .filter((message) => message.content.length > 0) ?? [];

    if (history.length === 0) {
      const message = body.message?.trim();

      if (!message) {
        return Response.json(
          { error: "A message or conversation history is required." },
          { status: 400 }
        );
      }

      history.push({
        role: "user",
        content: message
      });
    }

    const stream = await createInterviewCoachStream({
      company: body.company,
      history,
      mode: body.mode
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to start interview coach.";

    return Response.json({ error: message }, { status: 500 });
  }
}
