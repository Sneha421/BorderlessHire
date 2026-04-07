import {
  findCompanySignal,
  inferCompanySignalFromText,
  type CompanySignal
} from "@/lib/company-intelligence";
import {
  calculateCompassScore,
  inferOccupationFromTitle,
  type OccupationKey,
  type QualificationTier
} from "@/lib/compass";

export type ExtractedJobFacts = {
  company: string;
  role: string;
  industry: string;
  salaryMin: number | null;
  salaryMax: number | null;
  requirements: string[];
  summary: string;
};

export type PostingAnalysisResult = {
  company: string;
  role: string;
  salaryRange: string;
  requirements: string[];
  sponsorshipLikelihoodScore: number;
  sponsorshipHistory: string;
  redFlags: string[];
  recruiterQuestions: string[];
  rationale: string[];
  matchedSignals: string[];
};

export type ForeignWorkerResult = {
  positiveSignals: string[];
  cautionSignals: string[];
  summary: string;
};

export type SponsorshipWorkerResult = {
  company: string;
  matched: boolean;
  score: number;
  history: string;
  reasons: string[];
  redFlags: string[];
};

export type CompassWorkerResult = {
  occupation: OccupationKey;
  monthlySalary: number;
  totalScore: number;
  eligible: boolean;
  recommendations: string[];
};

export type ShouldApplyVerdict = "PASS" | "BORDERLINE" | "SKIP";

export type ShouldApplyResult = {
  verdict: ShouldApplyVerdict;
  confidence: number;
  extracted: ExtractedJobFacts;
  workerOutputs: {
    extractionSummary: string;
    compass: CompassWorkerResult;
    sponsorship: SponsorshipWorkerResult;
    foreignerSignals: ForeignWorkerResult;
  };
  reasoning: string[];
  followUpQuestions: string[];
};

const positiveSignalMatchers = [
  "visa sponsorship",
  "employment pass",
  "work pass",
  "regional role",
  "global team",
  "all nationalities",
  "international candidates",
  "relocation support"
];

const cautionSignalMatchers = [
  "singaporean only",
  "citizens only",
  "pr only",
  "must be singaporean",
  "no sponsorship",
  "no work visa",
  "security clearance",
  "immediate joiner",
  "bond period"
];

export function extractTextFromHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

export function extractSalaryRange(text: string) {
  const matches = Array.from(
    text.matchAll(
      /(?:sgd|s\$|\$)\s*([0-9][0-9,]{2,5})(?:\s*(?:-|to|–)\s*(?:sgd|s\$|\$)?\s*([0-9][0-9,]{2,5}))?/gi
    )
  );

  if (matches.length === 0) {
    return { salaryMin: null, salaryMax: null };
  }

  const parsed = matches
    .map((match) => ({
      min: Number(match[1].replace(/,/g, "")),
      max: match[2] ? Number(match[2].replace(/,/g, "")) : null
    }))
    .filter((entry) => Number.isFinite(entry.min) && entry.min > 0);

  if (parsed.length === 0) {
    return { salaryMin: null, salaryMax: null };
  }

  const first = parsed[0];

  return {
    salaryMin: first.min,
    salaryMax: first.max ?? first.min
  };
}

export function inferRoleFromText(text: string) {
  const normalized = text.trim();
  const lineMatch = normalized.match(
    /(software engineer|data scientist|product manager|product analyst|business analyst|strategy analyst|risk analyst|consultant|associate|project manager|operations executive|ai engineer|cloud solutions consultant)/i
  );

  return lineMatch?.[1] ?? "Role not clearly identified";
}

export function inferCompanyFromText(text: string) {
  const signal = inferCompanySignalFromText(text);

  if (signal) {
    return signal.company;
  }

  const match = text.match(/(?:company|employer|organization)\s*[:\-]\s*([A-Z][A-Za-z0-9&.,' -]{2,})/);
  return match?.[1]?.trim() ?? "Unknown company";
}

export function buildForeignSignalWorker(text: string): ForeignWorkerResult {
  const lowered = text.toLowerCase();
  const positiveSignals = positiveSignalMatchers.filter((signal) => lowered.includes(signal));
  const cautionSignals = cautionSignalMatchers.filter((signal) => lowered.includes(signal));

  let summary = "No explicit visa-friendliness language found.";

  if (positiveSignals.length > 0 && cautionSignals.length === 0) {
    summary = "Posting language is moderately friendly to international applicants.";
  } else if (positiveSignals.length > 0 && cautionSignals.length > 0) {
    summary = "Posting has mixed signals: some global language, but also cautionary restrictions.";
  } else if (cautionSignals.length > 0) {
    summary = "Posting contains restrictions that may weaken sponsorship chances.";
  }

  return {
    positiveSignals,
    cautionSignals,
    summary
  };
}

export function buildSponsorshipWorker(text: string, companyHint?: string): SponsorshipWorkerResult {
  const company = companyHint || inferCompanyFromText(text);
  const signal = findCompanySignal(company) ?? inferCompanySignalFromText(text);

  if (!signal) {
    return {
      company,
      matched: false,
      score: 50,
      history: "Unknown",
      reasons: ["No direct sponsorship history match in the local company signal dataset."],
      redFlags: ["Treat this as unverified and confirm sponsorship directly with the recruiter."]
    };
  }

  return {
    company: signal.company,
    matched: true,
    score: signal.sponsorshipScore,
    history: signal.sponsorshipHistory,
    reasons: signal.reasons,
    redFlags: signal.redFlags
  };
}

export function buildCompassWorker(text: string, roleHint?: string): CompassWorkerResult {
  const role = roleHint || inferRoleFromText(text);
  const occupation = inferOccupationFromTitle(role);
  const { salaryMin, salaryMax } = extractSalaryRange(text);
  const monthlySalary = salaryMax ?? salaryMin ?? 5000;
  const qualificationTier: QualificationTier = /bachelor|master|degree|university/i.test(text)
    ? "Recognized university"
    : "No degree / unclear";

  const result = calculateCompassScore({
    occupation,
    monthlySalary,
    qualificationTier
  });

  return {
    occupation,
    monthlySalary,
    totalScore: result.totalScore,
    eligible: result.eligible,
    recommendations: result.recommendations
  };
}

export function heuristicExtractFacts(text: string) {
  const company = inferCompanyFromText(text);
  const role = inferRoleFromText(text);
  const { salaryMin, salaryMax } = extractSalaryRange(text);
  const industry =
    findCompanySignal(company)?.industry ??
    inferCompanySignalFromText(text)?.industry ??
    "Unknown";

  const requirements = Array.from(
    text.matchAll(
      /(?:requirements|skills|must have|you should have)\s*[:\-]?\s*([^.\n]{20,180})/gi
    )
  )
    .map((match) => match[1].trim())
    .slice(0, 4);

  return {
    company,
    role,
    industry,
    salaryMin,
    salaryMax,
    requirements,
    summary:
      text.trim().slice(0, 220) +
      (text.trim().length > 220 ? "..." : "")
  } satisfies ExtractedJobFacts;
}

function salaryRangeLabel(facts: ExtractedJobFacts) {
  if (!facts.salaryMin) {
    return "Not stated";
  }

  if (!facts.salaryMax || facts.salaryMax === facts.salaryMin) {
    return `SGD ${facts.salaryMin.toLocaleString()} / month`;
  }

  return `SGD ${facts.salaryMin.toLocaleString()} - ${facts.salaryMax.toLocaleString()} / month`;
}

export function buildPostingAnalysis(
  facts: ExtractedJobFacts,
  signal: CompanySignal | null
): PostingAnalysisResult {
  const sponsorshipScore = signal?.sponsorshipScore ?? 50;
  const rationale = signal?.reasons ?? [
    "No exact company match in the local signal set, so this score is conservative."
  ];
  const matchedSignals = signal?.foreignerFriendlySignals ?? [];
  const redFlags = signal?.redFlags ?? [
    "Confirm whether the team has recently hired Employment Pass candidates."
  ];

  return {
    company: facts.company,
    role: facts.role,
    salaryRange: salaryRangeLabel(facts),
    requirements: facts.requirements,
    sponsorshipLikelihoodScore: sponsorshipScore,
    sponsorshipHistory: signal?.sponsorshipHistory ?? "Unknown",
    redFlags,
    recruiterQuestions: [
      "Has this team sponsored Employment Pass candidates in the last 12 months?",
      "Is the posted salary band fixed, or can it move for strong niche candidates?",
      "What notice period and relocation timing are acceptable for this role?"
    ],
    rationale,
    matchedSignals
  };
}

export function deriveVerdictFromWorkers(
  extraction: ExtractedJobFacts,
  compass: CompassWorkerResult,
  sponsorship: SponsorshipWorkerResult,
  foreignerSignals: ForeignWorkerResult
): ShouldApplyResult {
  const riskPenalty =
    sponsorship.redFlags.length * 4 + foreignerSignals.cautionSignals.length * 5;
  const strengthScore =
    compass.totalScore + Math.round(sponsorship.score / 4) + foreignerSignals.positiveSignals.length * 3;
  const netScore = strengthScore - riskPenalty;

  let verdict: ShouldApplyVerdict = "BORDERLINE";

  if (compass.eligible && sponsorship.score >= 70 && foreignerSignals.cautionSignals.length === 0) {
    verdict = "PASS";
  } else if (!compass.eligible && sponsorship.score < 55) {
    verdict = "SKIP";
  } else if (netScore < 48) {
    verdict = "SKIP";
  }

  return {
    verdict,
    confidence: Math.max(45, Math.min(90, netScore)),
    extracted: extraction,
    workerOutputs: {
      extractionSummary: extraction.summary,
      compass,
      sponsorship,
      foreignerSignals
    },
    reasoning: [
      `Estimated COMPASS score is ${compass.totalScore}/60.`,
      `Local sponsorship history signal is ${sponsorship.score}/100.`,
      foreignerSignals.summary
    ],
    followUpQuestions: [
      "Can the recruiter confirm the salary range and pass sponsorship policy?",
      "Is the role open to candidates who need EP sponsorship from day one?",
      "What notice period or relocation lead time is acceptable?"
    ]
  };
}
