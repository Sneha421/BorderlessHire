import {
  type CompanySignal,
  type DiversityBand,
  type LocalEmploymentBand,
  findCompanySignal
} from "@/lib/company-intelligence";

export type QualificationTier =
  | "Top-tier global university"
  | "Recognized university"
  | "Emerging university"
  | "No degree / unclear";

export type OccupationKey =
  | "Software engineering"
  | "Data and AI"
  | "Product and design"
  | "Finance and risk"
  | "Consulting and strategy"
  | "Healthcare and life sciences"
  | "Operations and business";

export type CompassInput = {
  targetCompany?: string;
  occupation: OccupationKey;
  monthlySalary: number;
  qualificationTier: QualificationTier;
  diversityBand?: DiversityBand;
  localEmploymentBand?: LocalEmploymentBand;
};

export type CompassDimension = {
  label: string;
  score: number;
  maxScore: number;
  summary: string;
};

export type CompassCalculation = {
  totalScore: number;
  threshold: number;
  eligible: boolean;
  benchmarkSalary: number;
  companySignal: CompanySignal | null;
  breakdown: {
    salary: CompassDimension;
    qualifications: CompassDimension;
    diversity: CompassDimension;
    localEmployment: CompassDimension;
  };
  recommendations: string[];
};

const COMPASS_THRESHOLD = 40;

export const occupationBenchmarks: Record<OccupationKey, number> = {
  "Software engineering": 7200,
  "Data and AI": 7600,
  "Product and design": 6800,
  "Finance and risk": 6500,
  "Consulting and strategy": 7000,
  "Healthcare and life sciences": 5600,
  "Operations and business": 5200
};

const qualificationScores: Record<QualificationTier, number> = {
  "Top-tier global university": 10,
  "Recognized university": 8,
  "Emerging university": 6,
  "No degree / unclear": 2
};

const diversityScores: Record<DiversityBand, number> = {
  "Highly diverse": 10,
  Balanced: 8,
  "Moderately concentrated": 5,
  Concentrated: 2
};

const localEmploymentScores: Record<LocalEmploymentBand, number> = {
  "Strong local PMET support": 20,
  "Balanced local PMET support": 16,
  "Mixed local PMET support": 10,
  "Weak local PMET support": 4
};

function scoreSalary(monthlySalary: number, benchmarkSalary: number) {
  const ratio = monthlySalary / benchmarkSalary;

  if (ratio >= 1.25) {
    return 20;
  }

  if (ratio >= 1.1) {
    return 16;
  }

  if (ratio >= 1) {
    return 12;
  }

  if (ratio >= 0.9) {
    return 8;
  }

  if (ratio >= 0.8) {
    return 4;
  }

  return 0;
}

function getSalarySummary(monthlySalary: number, benchmarkSalary: number, score: number) {
  const delta = monthlySalary - benchmarkSalary;

  if (score >= 16) {
    return `Your salary is comfortably above the benchmark by about SGD ${Math.max(delta, 0).toLocaleString()}.`;
  }

  if (score >= 12) {
    return "Your salary is around the benchmark, which is usually workable but not a standout advantage.";
  }

  if (score >= 8) {
    return "Your salary is slightly below the benchmark, so other dimensions need to work harder.";
  }

  return "Your salary is materially below the benchmark and is the main drag on the score.";
}

function getQualificationSummary(tier: QualificationTier) {
  switch (tier) {
    case "Top-tier global university":
      return "Your qualification profile is a strong positive signal.";
    case "Recognized university":
      return "Your degree profile is solid and should support the application.";
    case "Emerging university":
      return "Your degree is helpful, but role fit and salary become more important.";
    default:
      return "Qualification evidence is weaker, so the employer and salary case needs to compensate.";
  }
}

function getBandSummary(label: string, score: number, maxScore: number) {
  if (score === maxScore) {
    return `${label} is a clear strength.`;
  }

  if (score >= maxScore * 0.7) {
    return `${label} is supportive but not perfect.`;
  }

  if (score >= maxScore * 0.4) {
    return `${label} is mixed and could make the case more borderline.`;
  }

  return `${label} is a weak point right now.`;
}

export function inferOccupationFromTitle(title: string): OccupationKey {
  const normalized = title.toLowerCase();

  if (/(engineer|developer|platform|frontend|backend|full stack|devops)/.test(normalized)) {
    return "Software engineering";
  }

  if (/(data|ai|machine learning|analytics|scientist)/.test(normalized)) {
    return "Data and AI";
  }

  if (/(product|design|ux|ui)/.test(normalized)) {
    return "Product and design";
  }

  if (/(finance|risk|aml|compliance|investment|bank)/.test(normalized)) {
    return "Finance and risk";
  }

  if (/(consult|strategy|associate|business analyst)/.test(normalized)) {
    return "Consulting and strategy";
  }

  if (/(health|clinical|medical|hospital|life sciences)/.test(normalized)) {
    return "Healthcare and life sciences";
  }

  return "Operations and business";
}

export function calculateCompassScore(input: CompassInput): CompassCalculation {
  const benchmarkSalary = occupationBenchmarks[input.occupation];
  const companySignal = input.targetCompany
    ? findCompanySignal(input.targetCompany)
    : null;

  const diversityBand = input.diversityBand ?? companySignal?.diversityBand ?? "Balanced";
  const localEmploymentBand =
    input.localEmploymentBand ??
    companySignal?.localEmploymentBand ??
    "Balanced local PMET support";

  const salaryScore = scoreSalary(input.monthlySalary, benchmarkSalary);
  const qualificationScore = qualificationScores[input.qualificationTier];
  const diversityScore = diversityScores[diversityBand];
  const localEmploymentScore = localEmploymentScores[localEmploymentBand];

  const totalScore =
    salaryScore + qualificationScore + diversityScore + localEmploymentScore;

  const recommendations = [
    salaryScore < 12
      ? "Push for a salary band closer to or above the occupation benchmark."
      : null,
    qualificationScore < 8
      ? "Highlight scarce skills, internships, and cross-border experience to offset a weaker qualification signal."
      : null,
    diversityScore < 8
      ? "Prioritize employers with visibly international teams or regional remits."
      : null,
    localEmploymentScore < 16
      ? "Target roles at employers with stronger local PMET hiring support and clearer workforce balance."
      : null,
    companySignal?.sponsorshipTier === "Unlikely to Sponsor"
      ? "Favor companies with an established sponsorship track record instead of treating brand alone as a signal."
      : null
  ].filter((item): item is string => Boolean(item));

  return {
    totalScore,
    threshold: COMPASS_THRESHOLD,
    eligible: totalScore >= COMPASS_THRESHOLD,
    benchmarkSalary,
    companySignal,
    breakdown: {
      salary: {
        label: "Salary",
        score: salaryScore,
        maxScore: 20,
        summary: getSalarySummary(input.monthlySalary, benchmarkSalary, salaryScore)
      },
      qualifications: {
        label: "Qualifications",
        score: qualificationScore,
        maxScore: 10,
        summary: getQualificationSummary(input.qualificationTier)
      },
      diversity: {
        label: "Diversity",
        score: diversityScore,
        maxScore: 10,
        summary: getBandSummary("Employer nationality diversity", diversityScore, 10)
      },
      localEmployment: {
        label: "Support for local employment",
        score: localEmploymentScore,
        maxScore: 20,
        summary: getBandSummary("Local PMET support", localEmploymentScore, 20)
      }
    },
    recommendations:
      recommendations.length > 0
        ? recommendations
        : ["You are already above the threshold. Focus on role fit, recruiter clarity, and evidence of specialization."]
  };
}
