import "server-only";

export type PortalResult = {
  title: string;
  url: string;
  source: string;
  snippet: string;
};

type SearchJobPortalsInput = {
  applyUrl: string;
  company: string;
  title: string;
  query: string;
};

type ExaResult = {
  title?: string;
  url?: string;
  publishedDate?: string;
  text?: string;
};

type SearchCandidate = PortalResult & {
  freshnessScore: number;
  score: number;
};

const SEARCH_DOMAINS = [
  "linkedin.com",
  "sg.linkedin.com",
  "jobstreet.com",
  "jobstreet.com.sg",
  "jobs.sg",
  "indeed.com",
  "sg.indeed.com",
  "jobsdb.com",
  "mycareersfuture.gov.sg",
  "greenhouse.io",
  "lever.co",
  "ashbyhq.com",
  "workable.com",
  "workdayjobs.com",
  "myworkdayjobs.com",
  "smartrecruiters.com",
  "successfactors.com",
  "taleo.net"
];

const SOURCE_LABELS = [
  { pattern: /(^|\.)linkedin\.com$/i, label: "LinkedIn" },
  { pattern: /(^|\.)jobstreet\.com$/i, label: "JobStreet" },
  { pattern: /(^|\.)jobs\.sg$/i, label: "JobsSG" },
  { pattern: /(^|\.)indeed\.com$/i, label: "Indeed" },
  { pattern: /(^|\.)jobsdb\.com$/i, label: "JobsDB" },
  { pattern: /(^|\.)mycareersfuture\.gov\.sg$/i, label: "MyCareersFuture" },
  { pattern: /(^|\.)greenhouse\.io$/i, label: "Greenhouse" },
  { pattern: /(^|\.)lever\.co$/i, label: "Lever" },
  { pattern: /(^|\.)ashbyhq\.com$/i, label: "Ashby" },
  { pattern: /(^|\.)workable\.com$/i, label: "Workable" },
  { pattern: /(^|\.)workdayjobs\.com$/i, label: "Workday" },
  { pattern: /(^|\.)myworkdayjobs\.com$/i, label: "Workday" },
  { pattern: /(^|\.)smartrecruiters\.com$/i, label: "SmartRecruiters" },
  { pattern: /(^|\.)successfactors\.com$/i, label: "SAP SuccessFactors" },
  { pattern: /(^|\.)taleo\.net$/i, label: "Taleo" }
] as const;

const SOURCE_PRIORITY: Record<string, number> = {
  LinkedIn: 8,
  JobStreet: 8,
  JobsSG: 8,
  JobsDB: 7,
  MyCareersFuture: 7,
  Indeed: 7,
  Greenhouse: 6,
  Lever: 6,
  Ashby: 6,
  Workable: 6,
  Workday: 5,
  SmartRecruiters: 5,
  "SAP SuccessFactors": 5,
  Taleo: 5,
  "Direct posting": 3
};

function buildSearchText(parts: Array<string | undefined>) {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .toLowerCase();
}

function normalizeUrl(url: string) {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.replace(/\/+$/, "") || "/";
    const params = parsed.searchParams;
    const postingId =
      params.get("jk") ||
      params.get("vjk") ||
      params.get("jobId") ||
      params.get("job_id") ||
      params.get("gh_jid") ||
      params.get("ashby_jid") ||
      params.get("wid");

    return postingId
      ? `${parsed.hostname.toLowerCase()}${pathname.toLowerCase()}?id=${postingId.toLowerCase()}`
      : `${parsed.hostname.toLowerCase()}${pathname.toLowerCase()}`;
  } catch {
    return url.toLowerCase().split(/[?#]/)[0].replace(/\/+$/, "");
  }
}

function stripBoardSuffix(title?: string) {
  if (!title) {
    return "";
  }

  return title
    .replace(
      /\s+[|\-–]\s+(linkedin|jobstreet|indeed|jobs\.sg|jobsdb|mycareersfuture|greenhouse|lever|ashby|workable|smartrecruiters).*$/i,
      ""
    )
    .trim();
}

function sanitizeSnippet(text?: string) {
  if (!text) {
    return "";
  }

  const sanitized = text.replace(/\s+/g, " ").trim();
  if (sanitized.length <= 220) {
    return sanitized;
  }

  return `${sanitized.slice(0, 217).trimEnd()}...`;
}

function extractTerms(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((term) => term.length > 2);
}

function deriveFreshnessFromPublishedDate(publishedDate?: string) {
  if (!publishedDate) {
    return 0;
  }

  const publishedAt = new Date(publishedDate);
  if (Number.isNaN(publishedAt.getTime())) {
    return 0;
  }

  const ageInDays = Math.max(
    0,
    Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (ageInDays <= 1) {
    return 5;
  }

  if (ageInDays <= 7) {
    return 4;
  }

  if (ageInDays <= 14) {
    return 3;
  }

  if (ageInDays <= 30) {
    return 2;
  }

  return 1;
}

function deriveFreshnessFromText(text?: string) {
  if (!text) {
    return 0;
  }

  const normalized = text.toLowerCase();

  if (/\btoday\b|\bjust posted\b/.test(normalized)) {
    return 5;
  }

  const dayMatch = normalized.match(/\b(\d+)\s+day[s]?\s+ago\b/);
  if (dayMatch) {
    const days = Number(dayMatch[1]);
    if (days <= 1) {
      return 5;
    }
    if (days <= 7) {
      return 4;
    }
    if (days <= 14) {
      return 3;
    }
    if (days <= 30) {
      return 2;
    }
  }

  const weekMatch = normalized.match(/\b(\d+)\s+week[s]?\s+ago\b/);
  if (weekMatch) {
    return Number(weekMatch[1]) === 1 ? 3 : 2;
  }

  if (/\brecent\b|\blatest\b|\bnew\b/.test(normalized)) {
    return 2;
  }

  return 0;
}

function labelSourceFromUrl(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();

    for (const source of SOURCE_LABELS) {
      if (source.pattern.test(hostname)) {
        return source.label;
      }
    }
  } catch {
    return "Direct posting";
  }

  return "Direct posting";
}

function isSpecificJobPostingUrl(url: string) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase().replace(/\/+$/, "");
    const segments = pathname.split("/").filter(Boolean);

    if (hostname.includes("linkedin.com")) {
      return /\/jobs\/view\/\d+/.test(pathname);
    }

    if (hostname.includes("indeed.com")) {
      return pathname === "/viewjob";
    }

    if (hostname.includes("mycareersfuture.gov.sg")) {
      return /\/job\//.test(pathname);
    }

    if (hostname.includes("greenhouse.io")) {
      return /\/jobs\/\d+/.test(pathname);
    }

    if (hostname.includes("lever.co")) {
      return segments.length >= 2 && pathname !== "/jobs";
    }

    if (hostname.includes("ashbyhq.com")) {
      return /\/job\//.test(pathname);
    }

    if (hostname.includes("workable.com")) {
      return /\/j\//.test(pathname);
    }

    if (
      hostname.includes("workdayjobs.com") ||
      hostname.includes("myworkdayjobs.com")
    ) {
      return /(\/job\/|\/posting\/|\/en-us\/job\/)/.test(pathname);
    }

    if (hostname.includes("smartrecruiters.com")) {
      return /\/jobs\/[a-z0-9-]+/i.test(pathname);
    }

    if (hostname.includes("successfactors.com")) {
      return /job(req|details)|career\?career_ns=job_listing/i.test(
        `${pathname}${parsed.search}`
      );
    }

    if (hostname.includes("taleo.net")) {
      return /careersection|requisition/i.test(`${pathname}${parsed.search}`);
    }

    if (
      hostname.includes("jobstreet.com") ||
      hostname.includes("jobsdb.com") ||
      hostname.includes("jobs.sg")
    ) {
      return /\/job\//.test(pathname);
    }

    const genericCareersPath =
      pathname === "/" ||
      /\/(careers?|jobs?|job-search|search-results|vacancies|positions?)$/.test(
        pathname
      );

    if (genericCareersPath) {
      return false;
    }

    return /\/(job|jobs|positions?|vacancies|opening|posting)\//.test(pathname);
  } catch {
    return false;
  }
}

function createFallbackPortal(input: SearchJobPortalsInput): PortalResult[] {
  return [
    {
      title: `${input.company} careers`,
      url: input.applyUrl,
      source: "Company careers",
      snippet: `Fallback direct apply link for ${input.title} at ${input.company}.`
    }
  ];
}

function buildPortalQueries(input: SearchJobPortalsInput) {
  return Array.from(
    new Set([
      [
        `"${input.title}"`,
        `"${input.company}"`,
        "Singapore",
        '"job" OR "jobs" OR "vacancy" OR "opening"',
        '"apply" OR "view job" OR "job details"'
      ]
        .filter(Boolean)
        .join(" "),
      [input.query, "Singapore", '"apply" OR "jobs" OR "hiring"']
        .filter(Boolean)
        .join(" ")
    ])
  );
}

async function runExaSearch(query: string) {
  const apiKey = process.env.EXA_API_KEY;

  if (!apiKey) {
    return null;
  }

  const response = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      query,
      num_results: 12,
      use_autoprompt: true,
      include_domains: SEARCH_DOMAINS,
      start_published_date: new Date(
        Date.now() - 1000 * 60 * 60 * 24 * 180
      ).toISOString()
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Exa search failed with status ${response.status}`);
  }

  const data = (await response.json()) as { results?: ExaResult[] };
  return data.results ?? [];
}

function scoreCandidate(input: SearchJobPortalsInput, result: ExaResult) {
  const searchText = buildSearchText([result.title, result.text, result.url]);
  const companyTerms = extractTerms(input.company);
  const titleTerms = extractTerms(input.title);
  let score = 0;

  for (const term of companyTerms) {
    if (searchText.includes(term)) {
      score += 4;
    }
  }

  for (const term of titleTerms) {
    if (searchText.includes(term)) {
      score += 2;
    }
  }

  const source = result.url ? labelSourceFromUrl(result.url) : "Direct posting";
  score += SOURCE_PRIORITY[source] ?? 0;
  score += Math.max(
    deriveFreshnessFromPublishedDate(result.publishedDate),
    deriveFreshnessFromText([result.title, result.text].filter(Boolean).join(" "))
  );

  if (searchText.includes("singapore")) {
    score += 1;
  }

  return score;
}

function mapSearchResultsToPortals(
  input: SearchJobPortalsInput,
  results: ExaResult[]
) {
  const seen = new Set<string>();

  return results
    .filter((result): result is ExaResult & { url: string } => Boolean(result.url))
    .filter((result) => isSpecificJobPostingUrl(result.url))
    .filter((result) => {
      const normalized = normalizeUrl(result.url);
      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .map((result): SearchCandidate => ({
      title: stripBoardSuffix(result.title) || `${input.title} at ${input.company}`,
      url: result.url,
      source: labelSourceFromUrl(result.url),
      snippet:
        sanitizeSnippet(result.text) ||
        `Direct vacancy link for ${input.title} at ${input.company}.`,
      freshnessScore: Math.max(
        deriveFreshnessFromPublishedDate(result.publishedDate),
        deriveFreshnessFromText([result.title, result.text].filter(Boolean).join(" "))
      ),
      score: scoreCandidate(input, result)
    }))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.freshnessScore - left.freshnessScore;
    })
    .slice(0, 6)
    .map(({ title, url, source, snippet }) => ({
      title,
      url,
      source,
      snippet
    }));
}

export async function searchJobPortals(input: SearchJobPortalsInput) {
  if (!process.env.EXA_API_KEY) {
    return createFallbackPortal(input);
  }

  try {
    const results = await Promise.all(
      buildPortalQueries(input).map((query) => runExaSearch(query))
    );
    const portals = mapSearchResultsToPortals(input, results.flatMap((result) => result ?? []));

    return portals.length > 0 ? portals : createFallbackPortal(input);
  } catch {
    return createFallbackPortal(input);
  }
}
