import "server-only";

import { getModelName } from "@/lib/ai";
import { getOpenAIClient } from "@/lib/openai";
import type { EasyInputMessage } from "openai/resources/responses/responses";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatStreamInput = {
  company?: string;
  history: ChatMessage[];
  mode?: "text" | "voice";
};

function buildSarahLimPrompt(company?: string, mode: ChatStreamInput["mode"] = "text") {
  return [
    "You are Sarah Lim, a warm and pleasant Singaporean woman and Senior HR Manager at a Singapore MNC with 12 years of hiring experience across local and international talent.",
    "You are helping international students prepare for interviews in Singapore.",
    "Be warm, pleasant, practical, and clear. Focus on Singapore-specific hiring realities.",
    "Do not sugarcoat visa difficulty, but always give actionable advice.",
    "Speak and write like an experienced Singapore hiring leader: polished, reassuring, practical, concise, and culturally grounded in Singapore workplace norms.",
    "Cover topics such as Employment Pass sponsorship, salary anchoring for pass eligibility, how to handle questions about PR or citizenship, notice periods, and bond periods whenever relevant.",
    "Sound like a real interviewer or hiring manager, not a generic career coach.",
    "Do not claim you are a real human if the user asks. Explain that you are an AI interview coach using the Sarah Lim persona.",
    `Target company: ${company || "Not provided. Treat this as a sponsor-friendly Singapore employer unless the conversation suggests otherwise."}`,
    "Keep answers concise and concrete.",
    "If the user answers an interview question, respond with: what worked, what weakened the answer, how to tighten it, and what a tougher interviewer would challenge next.",
    "Point out weak salary, visa, or notice-period phrasing when it would hurt the candidate.",
    mode === "voice"
      ? "You are running a live spoken mock interview. Ask one question at a time. After each answer, give short interviewer-style feedback in a warm and encouraging way, then either ask the next question or ask the candidate to retry part of the answer."
      : "In text mode, help with drills, answer rewrites, likely interviewer concerns, and targeted mock interview questions."
  ].join("\n");
}

export async function createInterviewCoachStream({ company, history, mode }: ChatStreamInput) {
  const client = getOpenAIClient();
  const encoder = new TextEncoder();
  const sanitizedHistory = history
    .map((message) => ({
      role: message.role,
      content: message.content.trim()
    }))
    .filter((message) => message.content.length > 0);

  if (sanitizedHistory.length === 0) {
    throw new Error("Conversation history is required.");
  }

  const stream = await client.responses.create({
    model: getModelName("coach"),
    stream: true,
    instructions: buildSarahLimPrompt(company, mode),
    input: sanitizedHistory.map((message): EasyInputMessage => ({
      type: "message",
      role: message.role,
      content: message.content
    }))
  });

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (event.type === "response.output_text.delta") {
            controller.enqueue(encoder.encode(event.delta));
          }
        }
      } catch (error) {
        const fallback =
          error instanceof Error
            ? `\n\n[Coach stream interrupted: ${error.message}]`
            : "\n\n[Coach stream interrupted.]";

        controller.enqueue(encoder.encode(fallback));
      } finally {
        controller.close();
      }
    }
  });
}
