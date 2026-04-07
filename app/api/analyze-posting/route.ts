import type { ResponseInputMessageItem } from "openai/resources/responses/responses";

import { getModelName } from "@/lib/ai";
import { buildPostingAnalysis, type ExtractedJobFacts } from "@/lib/job-analysis";
import { findCompanySignal } from "@/lib/company-intelligence";
import { getOpenAIClient, hasOpenAIKey } from "@/lib/openai";

export const runtime = "nodejs";

type VisionExtraction = {
  company: string;
  role: string;
  salaryMin: number;
  salaryMax: number;
  requirements: string[];
  summary: string;
};

const visionExtractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    company: { type: "string" },
    role: { type: "string" },
    salaryMin: { type: "integer" },
    salaryMax: { type: "integer" },
    requirements: {
      type: "array",
      items: { type: "string" }
    },
    summary: { type: "string" }
  },
  required: [
    "company",
    "role",
    "salaryMin",
    "salaryMax",
    "requirements",
    "summary"
  ]
} as const;

export async function POST(request: Request) {
  try {
    if (!hasOpenAIKey()) {
      return Response.json(
        { error: "Job Posting Analyzer needs OPENAI_API_KEY because it uses multimodal analysis." },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json({ error: "Upload a screenshot or PDF first." }, { status: 400 });
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const base64 = bytes.toString("base64");
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    const content: ResponseInputMessageItem["content"] = [
      {
        type: "input_text",
        text:
          "Extract the role, company, salary range if present, key requirements, and a one-paragraph summary of the posting. Respond as a JSON object."
      },
      isPdf
        ? {
            type: "input_file",
            filename: file.name,
            file_data: base64
          }
        : {
            type: "input_image",
            detail: "high",
            image_url: `data:${file.type || "image/png"};base64,${base64}`
          }
    ];

    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: getModelName("vision"),
      instructions:
        "You are a job-posting extraction agent for Singapore hiring analysis. Extract only what is visibly present or strongly implied by the posting. If salary is not stated, return 0 for salaryMin and salaryMax. If company or role is unclear, return 'Unknown company' or 'Unknown role'. Keep requirements concise.",
      input: [
        {
          role: "user",
          content
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "posting_vision_extraction",
          strict: true,
          schema: visionExtractionSchema
        }
      }
    });

    if (!response.output_text) {
      throw new Error("Model did not return a structured posting analysis.");
    }

    const extracted = JSON.parse(response.output_text) as VisionExtraction;

    const facts: ExtractedJobFacts = {
      company: extracted.company || "Unknown company",
      role: extracted.role || "Unknown role",
      industry: findCompanySignal(extracted.company)?.industry || "Unknown",
      salaryMin: extracted.salaryMin > 0 ? extracted.salaryMin : null,
      salaryMax: extracted.salaryMax > 0 ? extracted.salaryMax : null,
      requirements: extracted.requirements ?? [],
      summary: extracted.summary ?? "No summary generated."
    };

    const analysis = buildPostingAnalysis(facts, findCompanySignal(facts.company));

    return Response.json({
      extracted: facts,
      analysis
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to analyze that posting.";

    return Response.json({ error: message }, { status: 500 });
  }
}
