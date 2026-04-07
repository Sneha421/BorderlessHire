import "server-only";

import type { ResponseInput } from "openai/resources/responses/responses";

import { getOpenAIClient, hasOpenAIKey } from "@/lib/openai";

type JsonObject = Record<string, unknown>;

type JsonRequest = {
  model: string;
  instructions: string;
  input: string | ResponseInput;
};

export function canUseOpenAI() {
  return hasOpenAIKey();
}

export function getModelName(kind: "coach" | "json" | "vision" | "orchestrator") {
  switch (kind) {
    case "coach":
      return process.env.OPENAI_INTERVIEW_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
    case "vision":
      return process.env.OPENAI_ANALYZER_MODEL || "gpt-4o";
    case "orchestrator":
      return process.env.OPENAI_ORCHESTRATOR_MODEL || "gpt-4o";
    default:
      return process.env.OPENAI_JSON_MODEL || process.env.OPENAI_MODEL || "gpt-4.1-mini";
  }
}

export async function createJsonResponse<T extends JsonObject>({
  model,
  instructions,
  input
}: JsonRequest) {
  const client = getOpenAIClient();

  const response = await client.responses.create({
    model,
    instructions,
    input,
    text: {
      format: {
        type: "json_schema",
        name: "borderlesshire_json_response",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: true
        }
      },
      verbosity: "medium"
    }
  });

  return JSON.parse(response.output_text) as T;
}
