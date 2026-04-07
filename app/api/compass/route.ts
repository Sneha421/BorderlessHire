import { createJsonResponse, canUseOpenAI, getModelName } from "@/lib/ai";
import { calculateCompassScore, type CompassInput } from "@/lib/compass";

export const runtime = "nodejs";

type CompassAdvice = {
  headline: string;
  whatToImprove: string[];
  recruiterTalkingPoints: string[];
};

function buildFallbackAdvice(result: ReturnType<typeof calculateCompassScore>): CompassAdvice {
  return {
    headline: result.eligible
      ? "You are above the indicative COMPASS threshold."
      : "You are below the indicative COMPASS threshold right now.",
    whatToImprove: result.recommendations,
    recruiterTalkingPoints: [
      "Ask whether the team has recent Employment Pass sponsorship experience.",
      "Clarify whether salary is flexible for candidates with scarce skills.",
      "Frame your regional exposure and niche skills as the reason you add differentiated value."
    ]
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CompassInput;

    const result = calculateCompassScore(body);
    let advice = buildFallbackAdvice(result);

    if (canUseOpenAI()) {
      try {
        advice = await createJsonResponse<CompassAdvice>({
          model: getModelName("json"),
          instructions:
            "You are a Singapore employment-pass advisor. Return a JSON object with headline, whatToImprove, and recruiterTalkingPoints. Keep each recommendation practical and specific for an international student.",
          input: `COMPASS result: ${JSON.stringify(result)}`
        });
      } catch {
        advice = buildFallbackAdvice(result);
      }
    }

    return Response.json({
      ...result,
      advice
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to calculate COMPASS eligibility.";

    return Response.json({ error: message }, { status: 500 });
  }
}
