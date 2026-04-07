import { createJsonResponse, canUseOpenAI, getModelName } from "@/lib/ai";
import {
  buildCompassWorker,
  buildForeignSignalWorker,
  buildSponsorshipWorker,
  deriveVerdictFromWorkers,
  extractTextFromHtml,
  heuristicExtractFacts,
  type ExtractedJobFacts,
  type ShouldApplyResult
} from "@/lib/job-analysis";

export const runtime = "nodejs";

type RequestBody = {
  mode: "url" | "text";
  source: string;
};

async function resolveSource(body: RequestBody) {
  if (body.mode !== "url") {
    return body.source;
  }

  const response = await fetch(body.source, {
    headers: {
      "User-Agent": "Mozilla/5.0 BorderlessHire Analyzer"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Unable to fetch the job URL (${response.status}).`);
  }

  const html = await response.text();
  return extractTextFromHtml(html).slice(0, 12000);
}

type ExtractionResponse = ExtractedJobFacts;
type SynthesisResponse = Pick<ShouldApplyResult, "verdict" | "confidence" | "reasoning" | "followUpQuestions">;

async function runExtractionWorker(sourceText: string) {
  if (!canUseOpenAI()) {
    return heuristicExtractFacts(sourceText);
  }

  try {
    return await createJsonResponse<ExtractionResponse>({
      model: getModelName("orchestrator"),
      instructions:
        "Extract job facts from the provided posting. Return JSON with company, role, industry, salaryMin, salaryMax, requirements, and summary.",
      input: sourceText
    });
  } catch {
    return heuristicExtractFacts(sourceText);
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RequestBody;

    if (!body.source?.trim()) {
      return Response.json({ error: "Paste a job URL or job description first." }, { status: 400 });
    }

    const sourceText = await resolveSource(body);

    const [extraction, compass, sponsorship, foreignerSignals] = await Promise.all([
      runExtractionWorker(sourceText),
      Promise.resolve(buildCompassWorker(sourceText)),
      Promise.resolve(buildSponsorshipWorker(sourceText)),
      Promise.resolve(buildForeignSignalWorker(sourceText))
    ]);

    let result = deriveVerdictFromWorkers(
      extraction,
      compass,
      sponsorship,
      foreignerSignals
    );

    if (canUseOpenAI()) {
      try {
        const synthesis = await createJsonResponse<SynthesisResponse>({
          model: getModelName("orchestrator"),
          instructions:
            "You are the BorderlessHire orchestrator. Return JSON with verdict, confidence, reasoning, and followUpQuestions. Verdict must be PASS, BORDERLINE, or SKIP.",
          input: JSON.stringify({
            extraction,
            compass,
            sponsorship,
            foreignerSignals
          })
        });

        result = {
          ...result,
          verdict: synthesis.verdict,
          confidence: synthesis.confidence,
          reasoning: synthesis.reasoning,
          followUpQuestions: synthesis.followUpQuestions
        };
      } catch {
        result = result;
      }
    }

    return Response.json({
      sourcePreview: sourceText.slice(0, 320),
      result
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to run the apply check.";

    return Response.json({ error: message }, { status: 500 });
  }
}
