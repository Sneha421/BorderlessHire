import "server-only";

import { getOpenAIClient } from "@/lib/openai";

type ChatStreamInput = {
  company?: string;
  message: string;
};

export async function createInterviewCoachStream({
  company,
  message
}: ChatStreamInput) {
  const client = getOpenAIClient();
  const encoder = new TextEncoder();

  const stream = await client.responses.create({
    model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
    stream: true,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are BorderlessHire Interview Coach. Help international students in Singapore prepare for interviews. Keep answers practical, concise, and encouraging without fluff. When useful, structure replies as: likely question, strong answer direction, company angle, and one follow-up they should prepare."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Target company: ${company || "Not provided"}\nCandidate request: ${message}`
          }
        ]
      }
    ]
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
