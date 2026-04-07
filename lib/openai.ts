import "server-only";

import OpenAI from "openai";

let client: OpenAI | null = null;

export function hasOpenAIKey() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAIClient() {
  if (!hasOpenAIKey()) {
    throw new Error("Missing OPENAI_API_KEY environment variable.");
  }

  client ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

  return client;
}
