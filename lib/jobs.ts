export type SponsorshipTier =
  | "Foreigner-Friendly"
  | "Case-by-Case"
  | "Unlikely to Sponsor";
export type JobType = "Full-time" | "Contract";
export type VisaType = "EP" | "S Pass" | "EP / S Pass";
export type CompanySize = "Startup (<=25)" | "SME (26-200)" | "Large (200+)";

export type SalaryBand = {
  id: string;
  label: string;
  min: number;
  max: number | null;
};

export type JobListing = {
  id: string;
  title: string;
  company: string;
  industry: "Tech" | "Finance" | "Consulting" | "Healthcare" | "Government-linked";
  salaryMin: number;
  salaryMax: number;
  sponsorshipTier: SponsorshipTier;
  sponsorshipNote: string;
  compassPoints: number;
  jobType: JobType;
  requiresDegree: boolean;
  visaType: VisaType;
  companySize: CompanySize;
  employeeCount: number;
  activeForeignHiringQuota: boolean;
  fairConsiderationFramework: boolean;
  applyUrl: string;
  portalSearchQuery: string;
};

type JobSeed = Omit<JobListing, "fairConsiderationFramework" | "portalSearchQuery">;

const jobSeeds: JobSeed[] = [
  {
    id: "grab-product-analyst",
    title: "Product Analyst",
    company: "Grab",
    industry: "Tech",
    salaryMin: 6200,
    salaryMax: 8200,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "Regional product and analytics hiring at Grab has a strong record of sponsoring EP candidates.",
    compassPoints: 15,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP / S Pass",
    companySize: "Large (200+)",
    employeeCount: 3500,
    activeForeignHiringQuota: true,
    applyUrl: "https://grab.careers/"
  },
  {
    id: "grab-software-engineer",
    title: "Software Engineer, Platform",
    company: "Grab",
    industry: "Tech",
    salaryMin: 7000,
    salaryMax: 9800,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "Grab platform teams routinely hire specialized engineering talent from abroad.",
    compassPoints: 17,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 3500,
    activeForeignHiringQuota: true,
    applyUrl: "https://grab.careers/"
  },
  {
    id: "sea-risk-analyst",
    title: "Risk Analyst",
    company: "Sea",
    industry: "Tech",
    salaryMin: 5600,
    salaryMax: 7600,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "Sea's Singapore HQ has a long track record of regional analyst hiring and sponsorship support.",
    compassPoints: 14,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP / S Pass",
    companySize: "Large (200+)",
    employeeCount: 5000,
    activeForeignHiringQuota: true,
    applyUrl: "https://www.sea.com/careers"
  },
  {
    id: "shopee-bizops",
    title: "Business Operations Associate",
    company: "Shopee",
    industry: "Tech",
    salaryMin: 4800,
    salaryMax: 6500,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "Shopee remains open to international early-career talent in cross-border operations roles.",
    compassPoints: 12,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "S Pass",
    companySize: "Large (200+)",
    employeeCount: 4000,
    activeForeignHiringQuota: true,
    applyUrl: "https://careers.shopee.sg/jobs"
  },
  {
    id: "bytedance-data-scientist",
    title: "Data Scientist",
    company: "ByteDance SG",
    industry: "Tech",
    salaryMin: 8000,
    salaryMax: 11000,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "ByteDance Singapore regularly sponsors niche machine learning and recommendation talent.",
    compassPoints: 18,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 2500,
    activeForeignHiringQuota: true,
    applyUrl: "https://jobs.bytedance.com/en"
  },
  {
    id: "google-cloud-consultant",
    title: "Cloud Solutions Consultant",
    company: "Google Singapore",
    industry: "Tech",
    salaryMin: 9000,
    salaryMax: 13000,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "Google Singapore commonly sponsors technical customer-facing roles with strong specialization.",
    compassPoints: 19,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 2000,
    activeForeignHiringQuota: true,
    applyUrl: "https://www.google.com/about/careers/applications/jobs/results/?location=Singapore"
  },
  {
    id: "dbs-aml-analyst",
    title: "AML Analyst",
    company: "DBS",
    industry: "Finance",
    salaryMin: 5200,
    salaryMax: 6900,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "DBS routinely hires international candidates into specialist compliance and analytics tracks.",
    compassPoints: 13,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP / S Pass",
    companySize: "Large (200+)",
    employeeCount: 12000,
    activeForeignHiringQuota: true,
    applyUrl: "https://www.dbs.com/careers"
  },
  {
    id: "dbs-data-engineer",
    title: "Data Engineer",
    company: "DBS",
    industry: "Finance",
    salaryMin: 7000,
    salaryMax: 9200,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "DBS tech transformation programs are comfortable sponsoring international engineering talent.",
    compassPoints: 16,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 12000,
    activeForeignHiringQuota: true,
    applyUrl: "https://www.dbs.com/careers"
  },
  {
    id: "uob-product-manager",
    title: "Digital Product Manager",
    company: "UOB",
    industry: "Finance",
    salaryMin: 6800,
    salaryMax: 9000,
    sponsorshipTier: "Case-by-Case",
    sponsorshipNote: "UOB sponsors selectively when candidates bring regional digital banking or platform experience.",
    compassPoints: 14,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 8000,
    activeForeignHiringQuota: false,
    applyUrl: "https://www.uobgroup.com/uobgroup/careers/index.page"
  },
  {
    id: "standard-chartered-analyst",
    title: "Strategy Analyst",
    company: "Standard Chartered",
    industry: "Finance",
    salaryMin: 6300,
    salaryMax: 8400,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "Standard Chartered Singapore has recurring analyst and graduate openings open to international talent.",
    compassPoints: 15,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 9000,
    activeForeignHiringQuota: true,
    applyUrl: "https://www.sc.com/en/global-careers/"
  },
  {
    id: "ocbc-risk-manager",
    title: "Risk Management Associate",
    company: "OCBC",
    industry: "Finance",
    salaryMin: 5100,
    salaryMax: 6800,
    sponsorshipTier: "Case-by-Case",
    sponsorshipNote: "OCBC tends to sponsor when the candidate has clear quantitative or regulatory niche value.",
    compassPoints: 12,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP / S Pass",
    companySize: "Large (200+)",
    employeeCount: 9000,
    activeForeignHiringQuota: false,
    applyUrl: "https://www.ocbc.com/group/careers"
  },
  {
    id: "mckinsey-ba",
    title: "Business Analyst",
    company: "McKinsey & Company",
    industry: "Consulting",
    salaryMin: 7800,
    salaryMax: 9800,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "Global consulting firms in Singapore regularly sponsor internationally mobile consultants.",
    compassPoints: 17,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 1000,
    activeForeignHiringQuota: true,
    applyUrl: "https://www.mckinsey.com/careers/search-jobs"
  },
  {
    id: "bcg-associate",
    title: "Associate",
    company: "BCG",
    industry: "Consulting",
    salaryMin: 7600,
    salaryMax: 9800,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "BCG Singapore frequently sponsors early-career strategy hires with strong academic profiles.",
    compassPoints: 17,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 1000,
    activeForeignHiringQuota: true,
    applyUrl: "https://careers.bcg.com/global/en/search-results"
  },
  {
    id: "accenture-cloud-analyst",
    title: "Cloud Transformation Analyst",
    company: "Accenture",
    industry: "Consulting",
    salaryMin: 5000,
    salaryMax: 6900,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "Accenture Singapore has mature work-pass processes for client-facing transformation roles.",
    compassPoints: 13,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP / S Pass",
    companySize: "Large (200+)",
    employeeCount: 6000,
    activeForeignHiringQuota: true,
    applyUrl: "https://www.accenture.com/sg-en/careers/jobsearch"
  },
  {
    id: "ey-tech-consultant",
    title: "Technology Consultant",
    company: "EY",
    industry: "Consulting",
    salaryMin: 4700,
    salaryMax: 6200,
    sponsorshipTier: "Case-by-Case",
    sponsorshipNote: "Big Four sponsorship is possible, but offer level and specialization matter more than title alone.",
    compassPoints: 11,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "S Pass",
    companySize: "Large (200+)",
    employeeCount: 3000,
    activeForeignHiringQuota: false,
    applyUrl: "https://careers.ey.com"
  },
  {
    id: "kpmg-cyber-analyst",
    title: "Cybersecurity Analyst",
    company: "KPMG",
    industry: "Consulting",
    salaryMin: 4800,
    salaryMax: 6500,
    sponsorshipTier: "Case-by-Case",
    sponsorshipNote: "KPMG is more likely to sponsor cyber and data-risk roles than generalist consulting openings.",
    compassPoints: 12,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "S Pass",
    companySize: "Large (200+)",
    employeeCount: 3000,
    activeForeignHiringQuota: false,
    applyUrl: "https://kpmg.com/sg/en/home/careers.html"
  },
  {
    id: "singhealth-data-analyst",
    title: "Healthcare Data Analyst",
    company: "SingHealth",
    industry: "Healthcare",
    salaryMin: 4600,
    salaryMax: 6100,
    sponsorshipTier: "Case-by-Case",
    sponsorshipNote: "Public healthcare groups sponsor selectively for analytics, informatics, and domain-heavy functions.",
    compassPoints: 10,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "S Pass",
    companySize: "Large (200+)",
    employeeCount: 15000,
    activeForeignHiringQuota: false,
    applyUrl: "https://careers.singhealth.com.sg"
  },
  {
    id: "singhealth-project-manager",
    title: "Transformation Project Manager",
    company: "SingHealth",
    industry: "Healthcare",
    salaryMin: 5800,
    salaryMax: 7600,
    sponsorshipTier: "Case-by-Case",
    sponsorshipNote: "Project-based transformation roles can justify sponsorship when tied to scarce healthcare operations expertise.",
    compassPoints: 12,
    jobType: "Contract",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 15000,
    activeForeignHiringQuota: false,
    applyUrl: "https://careers.singhealth.com.sg"
  },
  {
    id: "raffles-ops-executive",
    title: "Hospital Operations Executive",
    company: "Raffles Medical",
    industry: "Healthcare",
    salaryMin: 3900,
    salaryMax: 5200,
    sponsorshipTier: "Unlikely to Sponsor",
    sponsorshipNote: "Private healthcare operators usually reserve sponsorship for more specialized clinical or niche corporate functions.",
    compassPoints: 8,
    jobType: "Full-time",
    requiresDegree: false,
    visaType: "S Pass",
    companySize: "Large (200+)",
    employeeCount: 1800,
    activeForeignHiringQuota: false,
    applyUrl: "https://www.rafflesmedicalgroup.com/careers/"
  },
  {
    id: "ihh-business-analyst",
    title: "Business Analyst",
    company: "IHH Healthcare Singapore",
    industry: "Healthcare",
    salaryMin: 4300,
    salaryMax: 5600,
    sponsorshipTier: "Unlikely to Sponsor",
    sponsorshipNote: "Sponsorship is less common for generalist corporate healthcare roles without scarce skill signals.",
    compassPoints: 9,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "S Pass",
    companySize: "Large (200+)",
    employeeCount: 1200,
    activeForeignHiringQuota: false,
    applyUrl: "https://careers.ihhhealthcare.com"
  },
  {
    id: "gic-investment-analyst",
    title: "Investment Analyst",
    company: "GIC",
    industry: "Government-linked",
    salaryMin: 8200,
    salaryMax: 11500,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "GIC hires globally and supports sponsorship for high-caliber investment and research talent.",
    compassPoints: 18,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 1800,
    activeForeignHiringQuota: true,
    applyUrl: "https://careers.gic.com.sg"
  },
  {
    id: "temasek-data-analyst",
    title: "Portfolio Data Analyst",
    company: "Temasek",
    industry: "Government-linked",
    salaryMin: 7200,
    salaryMax: 9800,
    sponsorshipTier: "Foreigner-Friendly",
    sponsorshipNote: "Temasek sponsors selectively, but data and investment-adjacent roles remain open to international profiles.",
    compassPoints: 16,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 900,
    activeForeignHiringQuota: true,
    applyUrl: "https://www.temasek.com.sg/en/careers"
  },
  {
    id: "st-engineering-ai-engineer",
    title: "AI Engineer",
    company: "ST Engineering",
    industry: "Government-linked",
    salaryMin: 6200,
    salaryMax: 8200,
    sponsorshipTier: "Case-by-Case",
    sponsorshipNote: "Government-linked employers sponsor most readily in high-skill engineering tracks tied to strategic projects.",
    compassPoints: 14,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP",
    companySize: "Large (200+)",
    employeeCount: 9000,
    activeForeignHiringQuota: false,
    applyUrl: "https://careers.stengg.com"
  },
  {
    id: "enterprise-singapore-manager",
    title: "Market Development Manager",
    company: "Enterprise Singapore",
    industry: "Government-linked",
    salaryMin: 5000,
    salaryMax: 6800,
    sponsorshipTier: "Unlikely to Sponsor",
    sponsorshipNote: "Public-sector adjacent roles usually prioritize locally eligible applicants before sponsorship is considered.",
    compassPoints: 9,
    jobType: "Contract",
    requiresDegree: true,
    visaType: "S Pass",
    companySize: "Large (200+)",
    employeeCount: 600,
    activeForeignHiringQuota: false,
    applyUrl: "https://www.enterprisesg.gov.sg/careers"
  },
  {
    id: "ncs-software-engineer",
    title: "Software Engineer",
    company: "NCS",
    industry: "Government-linked",
    salaryMin: 4800,
    salaryMax: 6500,
    sponsorshipTier: "Case-by-Case",
    sponsorshipNote: "NCS sponsors when delivery teams need niche engineering experience that is hard to source locally.",
    compassPoints: 11,
    jobType: "Full-time",
    requiresDegree: true,
    visaType: "EP / S Pass",
    companySize: "Large (200+)",
    employeeCount: 12000,
    activeForeignHiringQuota: false,
    applyUrl: "https://www.ncs.co/en-sg/careers/"
  }
];

export const jobs: JobListing[] = jobSeeds.map((job) => ({
  ...job,
  fairConsiderationFramework: job.employeeCount > 25,
  portalSearchQuery: `${job.title} ${job.company} Singapore apply jobs`
}));

export const industries = Array.from(new Set(jobs.map((job) => job.industry)));
export const visaTypes = Array.from(new Set(jobs.map((job) => job.visaType)));
export const companySizes = Array.from(new Set(jobs.map((job) => job.companySize)));

export const salaryBands: SalaryBand[] = [
  { id: "any", label: "Any salary", min: 0, max: null },
  { id: "below-5k", label: "Below SGD 5k", min: 0, max: 4999 },
  { id: "5k-7k", label: "SGD 5k - 7k", min: 5000, max: 7000 },
  { id: "7k-9k", label: "SGD 7k - 9k", min: 7001, max: 9000 },
  { id: "9k-plus", label: "SGD 9k+", min: 9001, max: null }
];

export function matchesSalaryBand(job: JobListing, selectedBandId: string) {
  if (selectedBandId === "any") {
    return true;
  }

  const selectedBand = salaryBands.find((band) => band.id === selectedBandId);

  if (!selectedBand) {
    return true;
  }

  const withinUpperBound =
    selectedBand.max === null || job.salaryMin <= selectedBand.max;
  const withinLowerBound = job.salaryMax >= selectedBand.min;

  return withinLowerBound && withinUpperBound;
}
