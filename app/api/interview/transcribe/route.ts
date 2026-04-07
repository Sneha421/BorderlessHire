import { NextRequest } from "next/server";

import { getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio");

    if (!(audio instanceof File) || audio.size === 0) {
      return Response.json({ error: "Audio file is required." }, { status: 400 });
    }

    const client = getOpenAIClient();
    const transcription = await client.audio.transcriptions.create({
      file: audio,
      model: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-transcribe",
      language: "en",
      prompt:
        "This is a spoken Singapore job interview answer from an international student. Preserve terms such as Employment Pass, EP, PR, CPF, notice period, bond period, and MNC."
    });

    const text = typeof transcription === "string" ? transcription : transcription.text;

    if (!text.trim()) {
      return Response.json(
        { error: "No speech detected. Try recording again." },
        { status: 422 }
      );
    }

    return Response.json({ transcript: text.trim() });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to transcribe interview answer.";

    return Response.json({ error: message }, { status: 500 });
  }
}
