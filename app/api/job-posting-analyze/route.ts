import { NextRequest } from "next/server";

import { getOpenAIClient } from "@/lib/openai";
import { searchJobPortals } from "@/lib/apify";

export const runtime = "nodejs";

const analysisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    title: { type: "string" },
    company: { type: "string" },
    industry: { type: "string" },
    visaType: { type: "string" },
    salaryMin: { type: "integer" },
    salaryMax: { type: "integer" },
    companySize: { type: "string" },
    employeeCount: { type: "integer" },
    activeForeignHiringQuota: { type: "boolean" },
    sponsorshipTier: { type: "string" },
    sponsorshipNote: { type: "string" },
    summary: { type: "string" },
    searchQuery: { type: "string" }
  },
  required: [
    "title",
    "company",
    "industry",
    "visaType",
    "salaryMin",
    "salaryMax",
    "companySize",
    "employeeCount",
    "activeForeignHiringQuota",
    "sponsorshipTier",
    "sponsorshipNote",
    "summary",
    "searchQuery"
  ]
} as const;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const uploadedFile = formData.get("file");
    const postingText = String(formData.get("postingText") || "").trim();

    if (!(uploadedFile instanceof File) && !postingText) {
      return Response.json(
        { error: "Upload an image or paste job-posting text." },
        { status: 400 }
      );
    }

    let imageDataUrl: string | undefined;
    if (uploadedFile instanceof File) {
      if (uploadedFile.size > 7_500_000) {
        return Response.json(
          { error: "Uploaded image is too large. Keep it below 7.5 MB." },
          { status: 400 }
        );
      }

      const fileBuffer = Buffer.from(await uploadedFile.arrayBuffer());
      imageDataUrl = `data:${uploadedFile.type};base64,${fileBuffer.toString("base64")}`;
    }

    const client = getOpenAIClient();
    const response = await client.responses.create({
      model: process.env.OPENAI_MODEL || "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text:
                "Analyze this Singapore job posting for an international student. Extract the role/company if visible, estimate the likely visa path, infer sponsorship friendliness, estimate company size, and produce a practical apply query for searching job portals. If salary is missing, return 0 for salaryMin and salaryMax."
            },
            ...(postingText
              ? [
                  {
                    type: "input_text" as const,
                    text: `Pasted posting text:\n${postingText}`
                  }
                ]
              : []),
            ...(imageDataUrl
              ? [
                  {
                    type: "input_image" as const,
                    image_url: imageDataUrl,
                    detail: "high" as const
                  }
                ]
              : [])
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "job_posting_analysis",
          strict: true,
          schema: analysisSchema
        }
      }
    });

    const outputText = response.output_text;
    if (!outputText) {
      throw new Error("Model did not return a structured analysis.");
    }

    const analysis = JSON.parse(outputText) as {
      title: string;
      company: string;
      industry: string;
      visaType: string;
      salaryMin: number;
      salaryMax: number;
      companySize: string;
      employeeCount: number;
      activeForeignHiringQuota: boolean;
      sponsorshipTier: string;
      sponsorshipNote: string;
      summary: string;
      searchQuery: string;
    };

    const fallbackApplyUrl =
      analysis.company && analysis.company !== "Unknown"
        ? `https://www.google.com/search?q=${encodeURIComponent(`${analysis.company} careers Singapore`)}` 
        : `https://www.google.com/search?q=${encodeURIComponent(analysis.searchQuery)}`;

    const portals = await searchJobPortals({
      applyUrl: fallbackApplyUrl,
      company: analysis.company,
      title: analysis.title,
      query: analysis.searchQuery
    });

    return Response.json({
      analysis: {
        ...analysis,
        fairConsiderationFramework: analysis.employeeCount > 25
      },
      portals
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to analyze the job posting.";

    return Response.json({ error: message }, { status: 500 });
  }
}
