import { jobs, type JobListing, type SponsorshipTier } from "@/lib/jobs";

export type DiversityBand =
  | "Highly diverse"
  | "Balanced"
  | "Moderately concentrated"
  | "Concentrated";

export type LocalEmploymentBand =
  | "Strong local PMET support"
  | "Balanced local PMET support"
  | "Mixed local PMET support"
  | "Weak local PMET support";

export type SponsorshipHistoryBand =
  | "Established"
  | "Selective"
  | "Limited";

export type CompanySignal = {
  company: string;
  industry: JobListing["industry"];
  sponsorshipTier: SponsorshipTier;
  sponsorshipHistory: SponsorshipHistoryBand;
  diversityBand: DiversityBand;
  localEmploymentBand: LocalEmploymentBand;
  sponsorshipScore: number;
  reasons: string[];
  foreignerFriendlySignals: string[];
  redFlags: string[];
};

export const companySignals: CompanySignal[] = [
  {
    company: "Grab",
    industry: "Tech",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Highly diverse",
    localEmploymentBand: "Balanced local PMET support",
    sponsorshipScore: 88,
    reasons: [
      "Regional HQ with repeated Singapore sponsorship patterns.",
      "Product and engineering roles usually clear niche-skills screening better than generalist roles."
    ],
    foreignerFriendlySignals: [
      "Cross-border product teams",
      "Regional mobility language",
      "Experience hiring international graduates"
    ],
    redFlags: ["Operations roles face tighter competition at lower salary bands."]
  },
  {
    company: "Sea",
    industry: "Tech",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Highly diverse",
    localEmploymentBand: "Balanced local PMET support",
    sponsorshipScore: 86,
    reasons: [
      "Large Singapore base with international analyst and product hiring.",
      "Regional platform work strengthens specialized-skills story."
    ],
    foreignerFriendlySignals: [
      "Regional market ownership",
      "International business lines"
    ],
    redFlags: ["Entry-level commercial roles can be more salary-sensitive."]
  },
  {
    company: "Shopee",
    industry: "Tech",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Highly diverse",
    localEmploymentBand: "Balanced local PMET support",
    sponsorshipScore: 82,
    reasons: [
      "Known regional hiring engine in Singapore.",
      "Cross-functional roles often reference Southeast Asia market scope."
    ],
    foreignerFriendlySignals: ["Regional remit", "Multi-market coordination"],
    redFlags: ["Lower-end salary offers can make EP discussions harder."]
  },
  {
    company: "ByteDance SG",
    industry: "Tech",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Highly diverse",
    localEmploymentBand: "Mixed local PMET support",
    sponsorshipScore: 90,
    reasons: [
      "Heavy concentration of specialized engineering and data roles.",
      "Strong precedent for high-skill international hiring."
    ],
    foreignerFriendlySignals: [
      "Niche ML or recommendation expertise",
      "Regional product scale"
    ],
    redFlags: ["Generalist support roles have weaker pass narrative."]
  },
  {
    company: "Google Singapore",
    industry: "Tech",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Highly diverse",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 92,
    reasons: [
      "Global employer with consistent sponsorship processes.",
      "High salary bands support COMPASS outcomes."
    ],
    foreignerFriendlySignals: [
      "Global internal mobility",
      "Specialized technical consulting"
    ],
    redFlags: ["Competition is intense, so role fit matters more than sponsorship history alone."]
  },
  {
    company: "DBS",
    industry: "Finance",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Balanced",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 79,
    reasons: [
      "Large regulated employer with mature pass processes.",
      "Data, engineering, and compliance tracks tend to be the strongest cases."
    ],
    foreignerFriendlySignals: [
      "Transformation programs",
      "Digital banking specialization"
    ],
    redFlags: ["Generalist banking roles still compete against strong local pipelines."]
  },
  {
    company: "UOB",
    industry: "Finance",
    sponsorshipTier: "Case-by-Case",
    sponsorshipHistory: "Selective",
    diversityBand: "Balanced",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 67,
    reasons: [
      "Selective sponsorship in digital and regional functions.",
      "Compensation and specialization drive outcomes."
    ],
    foreignerFriendlySignals: ["Regional banking programs"],
    redFlags: ["Mainstream local-market roles can be harder to justify."]
  },
  {
    company: "OCBC",
    industry: "Finance",
    sponsorshipTier: "Case-by-Case",
    sponsorshipHistory: "Selective",
    diversityBand: "Balanced",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 63,
    reasons: [
      "More selective than the largest international or regional tech employers.",
      "Quantitative and regulated-risk work performs better."
    ],
    foreignerFriendlySignals: ["Risk or quant specialization"],
    redFlags: ["Relationship or branch-oriented roles are weaker sponsorship bets."]
  },
  {
    company: "Standard Chartered",
    industry: "Finance",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Highly diverse",
    localEmploymentBand: "Balanced local PMET support",
    sponsorshipScore: 81,
    reasons: [
      "Strong international mobility and analyst hiring track.",
      "Regional finance narratives are easier to defend."
    ],
    foreignerFriendlySignals: ["Cross-border banking", "Global rotation mindset"],
    redFlags: ["Support functions can be less sponsor-friendly than front-office or digital roles."]
  },
  {
    company: "McKinsey & Company",
    industry: "Consulting",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Highly diverse",
    localEmploymentBand: "Balanced local PMET support",
    sponsorshipScore: 84,
    reasons: [
      "Global consulting firm with proven relocation and sponsorship patterns.",
      "High salary bands and regional project exposure help."
    ],
    foreignerFriendlySignals: ["Global staffing model", "Regional client work"],
    redFlags: ["Only top-fit profiles make it through screening."]
  },
  {
    company: "BCG",
    industry: "Consulting",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Highly diverse",
    localEmploymentBand: "Balanced local PMET support",
    sponsorshipScore: 83,
    reasons: [
      "International mobility is common for strategy consulting roles.",
      "Compensation usually supports pass eligibility."
    ],
    foreignerFriendlySignals: ["Regional casework", "Cross-office staffing"],
    redFlags: ["Local candidate competition stays high."]
  },
  {
    company: "Accenture",
    industry: "Consulting",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Balanced",
    localEmploymentBand: "Balanced local PMET support",
    sponsorshipScore: 74,
    reasons: [
      "Large delivery engine with stable sponsorship processes.",
      "Tech transformation roles are stronger than generic analyst roles."
    ],
    foreignerFriendlySignals: ["Client delivery scale", "Cloud transformation"],
    redFlags: ["Lower salary bands can make borderline EP cases."]
  },
  {
    company: "EY",
    industry: "Consulting",
    sponsorshipTier: "Case-by-Case",
    sponsorshipHistory: "Selective",
    diversityBand: "Balanced",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 60,
    reasons: [
      "Sponsorship exists, but specialization matters more than brand alone.",
      "Cyber, data, and niche advisory functions are the better bets."
    ],
    foreignerFriendlySignals: ["Risk and data advisory"],
    redFlags: ["General audit or broad advisory roles can be tougher."]
  },
  {
    company: "KPMG",
    industry: "Consulting",
    sponsorshipTier: "Case-by-Case",
    sponsorshipHistory: "Selective",
    diversityBand: "Balanced",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 59,
    reasons: [
      "Sponsorship depends on skill scarcity and salary support.",
      "Cyber and data risk remain the stronger lanes."
    ],
    foreignerFriendlySignals: ["Cybersecurity specialization"],
    redFlags: ["Generalist consulting positions are more crowded."]
  },
  {
    company: "SingHealth",
    industry: "Healthcare",
    sponsorshipTier: "Case-by-Case",
    sponsorshipHistory: "Selective",
    diversityBand: "Balanced",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 57,
    reasons: [
      "Healthcare analytics and transformation roles can qualify.",
      "Operational roles are more scrutinized."
    ],
    foreignerFriendlySignals: ["Clinical informatics", "Healthcare analytics"],
    redFlags: ["Lower salary healthcare ops roles often sit near the line."]
  },
  {
    company: "Raffles Medical",
    industry: "Healthcare",
    sponsorshipTier: "Unlikely to Sponsor",
    sponsorshipHistory: "Limited",
    diversityBand: "Moderately concentrated",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 42,
    reasons: [
      "Private healthcare groups tend to reserve sponsorship for scarce functions.",
      "General operations roles are weaker candidates."
    ],
    foreignerFriendlySignals: ["Specialized clinical operations only"],
    redFlags: ["General corporate and ops roles look difficult."]
  },
  {
    company: "IHH Healthcare Singapore",
    industry: "Healthcare",
    sponsorshipTier: "Unlikely to Sponsor",
    sponsorshipHistory: "Limited",
    diversityBand: "Moderately concentrated",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 40,
    reasons: [
      "Sponsorship is possible but less common for broad business roles.",
      "Need strong domain specialization to compensate."
    ],
    foreignerFriendlySignals: ["Healthcare transformation specialization"],
    redFlags: ["General analyst roles are weak sponsorship signals."]
  },
  {
    company: "GIC",
    industry: "Government-linked",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Highly diverse",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 85,
    reasons: [
      "Global investment employer with international hiring track record.",
      "High salary levels help materially."
    ],
    foreignerFriendlySignals: ["Global investment scope", "Cross-market experience"],
    redFlags: ["Only highly competitive profiles convert."]
  },
  {
    company: "Temasek",
    industry: "Government-linked",
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipHistory: "Established",
    diversityBand: "Balanced",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 77,
    reasons: [
      "Strategic and data-intensive work can support international hiring.",
      "Compensation remains healthy for niche roles."
    ],
    foreignerFriendlySignals: ["Portfolio analytics", "Regional strategy"],
    redFlags: ["Policy-adjacent roles can be more restrictive."]
  },
  {
    company: "ST Engineering",
    industry: "Government-linked",
    sponsorshipTier: "Case-by-Case",
    sponsorshipHistory: "Selective",
    diversityBand: "Balanced",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 61,
    reasons: [
      "Selective sponsorship for high-skill engineering roles.",
      "Security-sensitive roles can narrow eligibility."
    ],
    foreignerFriendlySignals: ["Advanced engineering specialization"],
    redFlags: ["Security clearance or citizenship constraints may appear."]
  },
  {
    company: "Enterprise Singapore",
    industry: "Government-linked",
    sponsorshipTier: "Unlikely to Sponsor",
    sponsorshipHistory: "Limited",
    diversityBand: "Concentrated",
    localEmploymentBand: "Strong local PMET support",
    sponsorshipScore: 35,
    reasons: [
      "Public-sector adjacent hiring is typically less sponsor-friendly.",
      "Role justification needs to be unusually strong."
    ],
    foreignerFriendlySignals: ["Rare specialist market development needs"],
    redFlags: ["Local eligibility expectations are usually stronger."]
  },
  {
    company: "NCS",
    industry: "Government-linked",
    sponsorshipTier: "Case-by-Case",
    sponsorshipHistory: "Selective",
    diversityBand: "Balanced",
    localEmploymentBand: "Balanced local PMET support",
    sponsorshipScore: 58,
    reasons: [
      "Delivery roles can sponsor when skills are hard to source locally.",
      "Project-specific specialization matters."
    ],
    foreignerFriendlySignals: ["Enterprise delivery specialization"],
    redFlags: ["Commodity engineering profiles can be borderline."]
  }
];

const normalizedSignals = new Map(
  companySignals.map((signal) => [normalizeCompanyName(signal.company), signal])
);

export function normalizeCompanyName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

export function findCompanySignal(company: string) {
  const normalized = normalizeCompanyName(company);
  return normalizedSignals.get(normalized) ?? null;
}

export function inferCompanySignalFromText(text: string) {
  const normalizedText = normalizeCompanyName(text);

  for (const signal of companySignals) {
    if (normalizedText.includes(normalizeCompanyName(signal.company))) {
      return signal;
    }
  }

  return null;
}

export function getJobSnapshot(id: string) {
  return jobs.find((job) => job.id === id) ?? null;
}

export function getCompanyNames() {
  return companySignals.map((signal) => signal.company).sort();
}
