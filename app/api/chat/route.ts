import { NextRequest } from "next/server";

import { createInterviewCoachStream } from "@/app/actions/chat";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      company?: string;
      message?: string;
    };

    if (!body.message?.trim()) {
      return Response.json({ error: "Message is required." }, { status: 400 });
    }

    const stream = await createInterviewCoachStream({
      company: body.company,
      message: body.message.trim()
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
