import { NextRequest } from "next/server";

import { getOpenAIClient } from "@/lib/openai";

export const runtime = "nodejs";

const MAX_TTS_INPUT = 4096;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      text?: string;
    };

    const text = body.text?.trim();

    if (!text) {
      return Response.json({ error: "Text is required." }, { status: 400 });
    }

    const client = getOpenAIClient();
    const speech = await client.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
      voice: process.env.OPENAI_TTS_VOICE || "nova",
      response_format: "mp3",
      input: text.slice(0, MAX_TTS_INPUT),
      instructions:
        "Speak as Sarah Lim, a warm and pleasant Singaporean woman and senior HR manager at a Singapore MNC. Use polished Singapore business English with a light Singaporean accent. Sound warm, calm, approachable, practical, and credible. Deliver feedback like a real interviewer, but keep the tone encouraging, professional, and concise. Avoid exaggerated slang or caricature."
    });

    const audioBuffer = Buffer.from(await speech.arrayBuffer());

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store"
      }
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to synthesize Sarah's reply.";

    return Response.json({ error: message }, { status: 500 });
  }
}
