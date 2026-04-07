"use server";

import { getOpenAIClient, hasOpenAIKey } from "@/lib/openai";
import { jobs as seedJobs, type JobListing } from "@/lib/jobs";

type ExaResult = {
  title?: string;
  url?: string;
  publishedDate?: string;
  text?: string;
  id?: string;
};

type AnalyzedJob = {
  seedId: string;
  resultId: string;
  title: string;
  company: string;
  source: string;
  postedDate: string;
  freshnessScore: number;
  sponsorshipTier: JobListing["sponsorshipTier"];
  sponsorshipNote: string;
  listingSnippet: string;
};

type SearchJobsResponse = {
  jobs: JobListing[];
  reason?: string;
};

type SearchJobsCacheEntry = {
  value: SearchJobsResponse;
  expiresAt: number;
};

declare global {
  var __borderlessHireJobsCache: Map<string, SearchJobsCacheEntry> | undefined;
  var __borderlessHireJobsInFlight:
    | Map<string, Promise<SearchJobsResponse>>
    | undefined;
}

const CLOSED_LANGUAGE =
  /no longer accepting applications|applications closed|position filled|job expired|no sponsorship available/i;
const MIN_LIVE_FRESHNESS_SCORE = 2;
const MAX_LIVE_RESULTS = 36;
const MAX_COMPANY_QUERIES = 8;
const MAX_BROAD_QUERY_BATCHES = 3;
const EXA_QUERY_CONCURRENCY = 4;
const LIVE_JOBS_CACHE_TTL_MS = Number(
  process.env.LIVE_JOBS_CACHE_TTL_MS ?? 1_200_000
);
const EMPTY_JOBS_CACHE_TTL_MS = Number(
  process.env.EMPTY_JOBS_CACHE_TTL_MS ?? 180_000
);

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

const responseSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    jobs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          seedId: { type: "string" },
          resultId: { type: "string" },
          title: { type: "string" },
          company: { type: "string" },
          source: { type: "string" },
          postedDate: { type: "string" },
          freshnessScore: { type: "integer", minimum: 0, maximum: 5 },
          sponsorshipTier: {
            type: "string",
            enum: [
              "Foreigner-Friendly",
              "Case-by-Case",
              "Unlikely to Sponsor"
            ]
          },
          sponsorshipNote: { type: "string" },
          listingSnippet: { type: "string" }
        },
        required: [
          "seedId",
          "resultId",
          "title",
          "company",
          "source",
          "postedDate",
          "freshnessScore",
          "sponsorshipTier",
          "sponsorshipNote",
          "listingSnippet"
        ]
      }
    }
  },
  required: ["jobs"]
} as const;

function getJobsCache() {
  if (!globalThis.__borderlessHireJobsCache) {
    globalThis.__borderlessHireJobsCache = new Map();
  }

  return globalThis.__borderlessHireJobsCache;
}

function getJobsInFlight() {
  if (!globalThis.__borderlessHireJobsInFlight) {
    globalThis.__borderlessHireJobsInFlight = new Map();
  }

  return globalThis.__borderlessHireJobsInFlight;
}

function normalizeSearchCacheKey(query?: string) {
  return query?.trim().toLowerCase() || "__all__";
}

function getCacheTtlMs(result: SearchJobsResponse) {
  return result.jobs.length > 0
    ? LIVE_JOBS_CACHE_TTL_MS
    : EMPTY_JOBS_CACHE_TTL_MS;
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

function deriveFreshnessFromPublishedDate(publishedDate?: string) {
  if (!publishedDate) {
    return { listingRecency: "", listingFreshnessScore: 0 };
  }

  const publishedAt = new Date(publishedDate);
  if (Number.isNaN(publishedAt.getTime())) {
    return { listingRecency: "", listingFreshnessScore: 0 };
  }

  const ageInDays = Math.max(
    0,
    Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24))
  );

  if (ageInDays === 0) {
    return { listingRecency: "Today", listingFreshnessScore: 5 };
  }

  if (ageInDays === 1) {
    return { listingRecency: "1 day ago", listingFreshnessScore: 5 };
  }

  if (ageInDays <= 7) {
    return {
      listingRecency: `${ageInDays} days ago`,
      listingFreshnessScore: 4
    };
  }

  if (ageInDays <= 14) {
    return {
      listingRecency: `${ageInDays} days ago`,
      listingFreshnessScore: 3
    };
  }

  if (ageInDays <= 30) {
    return {
      listingRecency: `${ageInDays} days ago`,
      listingFreshnessScore: 2
    };
  }

  return {
    listingRecency: `${ageInDays} days ago`,
    listingFreshnessScore: 1
  };
}

function deriveFreshnessFromText(text?: string) {
  if (!text) {
    return { listingRecency: "", listingFreshnessScore: 0 };
  }

  const normalized = text.toLowerCase();

  if (/\btoday\b|\bjust posted\b/.test(normalized)) {
    return { listingRecency: "Today", listingFreshnessScore: 5 };
  }

  const dayMatch = normalized.match(/\b(\d+)\s+day[s]?\s+ago\b/);
  if (dayMatch) {
    const days = Number(dayMatch[1]);
    if (days <= 1) {
      return { listingRecency: `${days || 1} day ago`, listingFreshnessScore: 5 };
    }
    if (days <= 7) {
      return { listingRecency: `${days} days ago`, listingFreshnessScore: 4 };
    }
    if (days <= 14) {
      return { listingRecency: `${days} days ago`, listingFreshnessScore: 3 };
    }
    if (days <= 30) {
      return { listingRecency: `${days} days ago`, listingFreshnessScore: 2 };
    }
  }

  const weekMatch = normalized.match(/\b(\d+)\s+week[s]?\s+ago\b/);
  if (weekMatch) {
    const weeks = Number(weekMatch[1]);
    return {
      listingRecency: `${weeks} week${weeks === 1 ? "" : "s"} ago`,
      listingFreshnessScore: weeks === 1 ? 3 : 2
    };
  }

  if (/\brecent\b|\blatest\b|\bnew\b/.test(normalized)) {
    return { listingRecency: "Recent", listingFreshnessScore: 2 };
  }

  return { listingRecency: "", listingFreshnessScore: 0 };
}

function createListingId(seedId: string, url: string) {
  return `${seedId}-${normalizeUrl(url).replace(/[^a-z0-9]+/gi, "-").slice(-48)}`;
}

function getResultId(result: ExaResult) {
  if (result.id && result.id.trim()) {
    return result.id.trim();
  }

  return result.url ? normalizeUrl(result.url) : "";
}

function matchesQuery(job: JobListing, normalizedQuery: string) {
  if (!normalizedQuery) {
    return true;
  }

  return [job.title, job.company, job.industry, job.visaType]
    .join(" ")
    .toLowerCase()
    .includes(normalizedQuery);
}

function selectSeedJobs(query?: string) {
  const normalizedQuery = query?.trim().toLowerCase() || "";
  const filtered = seedJobs.filter((job) => matchesQuery(job, normalizedQuery));
  return filtered.length > 0 ? filtered : seedJobs;
}

function chunkSeeds(input: JobListing[], size: number) {
  const chunks: JobListing[][] = [];

  for (let index = 0; index < input.length; index += size) {
    chunks.push(input.slice(index, index + size));
  }

  return chunks;
}

function normalizeRoleTerms(title: string) {
  return Array.from(new Set(extractTerms(title))).slice(0, 5).join(" ");
}

function buildSeedCompanyQuery(seed: JobListing, query?: string) {
  const roleTerms = normalizeRoleTerms(seed.title);
  const querySuffix = query ? ` ${query}` : "";

  return [
    `"${seed.company}"`,
    roleTerms,
    "Singapore",
    querySuffix,
    '"job" OR "jobs" OR "hiring" OR "opening" OR "vacancy"',
    '"apply" OR "view job" OR "job details"',
    '"today" OR "recent" OR "days ago"'
  ]
    .filter(Boolean)
    .join(" ");
}

function buildBroadRoleQuery(batch: JobListing[], query?: string) {
  const roles = Array.from(new Set(batch.map((job) => normalizeRoleTerms(job.title))))
    .filter(Boolean)
    .join(" OR ");
  const industries = Array.from(new Set(batch.map((job) => job.industry))).join(" OR ");
  const querySuffix = query ? ` ${query}` : "";

  return [
    "Singapore",
    querySuffix,
    `(${roles})`,
    `(${industries})`,
    '"job" OR "jobs" OR "hiring" OR "opening" OR "vacancy"',
    '"apply" OR "view job" OR "job details"',
    '"today" OR "recent" OR "days ago"'
  ]
    .filter(Boolean)
    .join(" ");
}

function prioritizeSeeds(selectedSeeds: JobListing[]) {
  return [...selectedSeeds].sort(sortByPriority);
}

function buildSearchQueries(selectedSeeds: JobListing[], query?: string) {
  const prioritizedSeeds = prioritizeSeeds(selectedSeeds);
  const companyQueries = prioritizedSeeds
    .slice(0, MAX_COMPANY_QUERIES)
    .map((seed) => buildSeedCompanyQuery(seed, query));
  const broadQueries = chunkSeeds(prioritizedSeeds, 4)
    .slice(0, MAX_BROAD_QUERY_BATCHES)
    .map((batch) => buildBroadRoleQuery(batch, query));

  return Array.from(new Set([...companyQueries, ...broadQueries]));
}

async function runExaQueries(searchQueries: string[]) {
  const results: ExaResult[] = [];

  for (let index = 0; index < searchQueries.length; index += EXA_QUERY_CONCURRENCY) {
    const batch = searchQueries.slice(index, index + EXA_QUERY_CONCURRENCY);
    const settled = await Promise.allSettled(
      batch.map((searchQuery) => runExaSearch(searchQuery))
    );

    for (const item of settled) {
      if (item.status === "fulfilled") {
        results.push(...(item.value ?? []));
      } else {
        console.error("[searchSGJobs] Exa query failed", item.reason);
      }
    }
  }

  return results;
}

function stripClosedLanguage(text: string) {
  return text
    .replace(/no longer accepting applications/gi, "")
    .replace(/applications closed/gi, "")
    .replace(/position filled/gi, "")
    .replace(/job expired/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeSnippet(text?: string) {
  if (!text) {
    return "";
  }

  const sanitized = stripClosedLanguage(text).replace(/\s+/g, " ").trim();
  if (sanitized.length <= 240) {
    return sanitized;
  }

  return `${sanitized.slice(0, 237).trimEnd()}...`;
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

function extractTerms(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/i)
    .filter((term) => term.length > 2);
}

function scoreResultAgainstSeed(seed: JobListing, result: ExaResult) {
  const haystack = [result.title, result.text, result.url].filter(Boolean).join(" ").toLowerCase();
  let score = 0;

  for (const term of extractTerms(seed.company)) {
    if (haystack.includes(term)) {
      score += 4;
    }
  }

  for (const term of extractTerms(seed.title)) {
    if (haystack.includes(term)) {
      score += 2;
    }
  }

  for (const term of extractTerms(seed.industry)) {
    if (haystack.includes(term)) {
      score += 1;
    }
  }

  if (haystack.includes("singapore")) {
    score += 1;
  }

  return score;
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

    if (hostname.includes("lever.co")) {
      return segments.length >= 2;
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
      hostname.includes("jobs.sg") ||
      hostname.includes("jobsdb.com") ||
      hostname.includes("mycareersfuture.gov.sg") ||
      hostname.includes("greenhouse.io") ||
      hostname.includes("ashbyhq.com") ||
      hostname.includes("workable.com")
    ) {
      return /\/jobs?\//.test(pathname);
    }

    const genericCareersPath =
      pathname === "/" ||
      /\/(careers?|jobs?|job-search|search-results|vacancies|positions?)$/.test(
        pathname
      );

    if (genericCareersPath) {
      return false;
    }

    return /\/(job|jobs|positions?|vacancies)\//.test(pathname);
  } catch {
    return false;
  }
}

function looksClosed(result: Pick<AnalyzedJob, "title" | "listingSnippet" | "freshnessScore">) {
  const combinedText = `${result.title} ${result.listingSnippet}`;
  return CLOSED_LANGUAGE.test(combinedText);
}

function isCurrentLivePosting(text: string, freshnessScore: number) {
  return !CLOSED_LANGUAGE.test(text) && freshnessScore >= MIN_LIVE_FRESHNESS_SCORE;
}

function deduplicateResults(results: ExaResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    if (!result.url) {
      return false;
    }

    const normalized = normalizeUrl(result.url);
    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function deduplicateListings(listings: JobListing[]) {
  const seen = new Set<string>();

  return listings.filter((job) => {
    const normalized = normalizeUrl(job.applyUrl);
    if (seen.has(normalized)) {
      return false;
    }

    seen.add(normalized);
    return true;
  });
}

function sortByPriority(left: JobListing, right: JobListing) {
  const quotaDelta =
    Number(right.activeForeignHiringQuota) - Number(left.activeForeignHiringQuota);
  if (quotaDelta !== 0) {
    return quotaDelta;
  }

  return right.salaryMax - left.salaryMax;
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
      num_results: 24,
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

function mapSearchResultsHeuristically(
  selectedSeeds: JobListing[],
  searchResults: ExaResult[]
) {
  const usedUrls = new Set<string>();
  const mappedJobs: JobListing[] = [];

  for (const result of searchResults) {
    if (!result.url || !isSpecificJobPostingUrl(result.url)) {
      continue;
    }

    const normalizedResultUrl = normalizeUrl(result.url);
    if (usedUrls.has(normalizedResultUrl)) {
      continue;
    }

    const publishedFreshness = deriveFreshnessFromPublishedDate(result.publishedDate);
    const textFreshness = deriveFreshnessFromText(
      [result.title, result.text].filter(Boolean).join(" ")
    );
    const listingFreshnessScore = Math.max(
      publishedFreshness.listingFreshnessScore,
      textFreshness.listingFreshnessScore
    );
    const listingRecency =
      publishedFreshness.listingRecency || textFreshness.listingRecency;
    const listingSnippet = sanitizeSnippet(result.text) || stripBoardSuffix(result.title);
    const liveSignalText = [result.title, result.text].filter(Boolean).join(" ");

    if (!isCurrentLivePosting(liveSignalText, listingFreshnessScore)) {
      continue;
    }

    const bestMatch = selectedSeeds
      .map((seed) => ({ seed, score: scoreResultAgainstSeed(seed, result) }))
      .sort((left, right) => right.score - left.score)[0];

    if (!bestMatch || bestMatch.score < 4) {
      continue;
    }

    const seed = bestMatch.seed;

    mappedJobs.push({
      ...seed,
      id: createListingId(seed.id, result.url),
      title: stripBoardSuffix(result.title) || seed.title,
      applyUrl: result.url,
      portalSearchQuery: `${seed.title} ${seed.company} Singapore apply jobs`,
      listingSource: labelSourceFromUrl(result.url),
      listingSnippet,
      listingRecency,
      listingFreshnessScore,
      isLivePosting: true
    });

    usedUrls.add(normalizedResultUrl);
  }

  return mappedJobs
    .filter((job) => !looksClosed({
      title: job.title,
      listingSnippet: job.listingSnippet ?? "",
      freshnessScore: job.listingFreshnessScore ?? 0
    }))
    .sort((left, right) => {
      const freshnessDelta =
        (right.listingFreshnessScore ?? 0) - (left.listingFreshnessScore ?? 0);
      if (freshnessDelta !== 0) {
        return freshnessDelta;
      }

      return sortByPriority(left, right);
    })
    .slice(0, MAX_LIVE_RESULTS);
}

function createRescueListingsFromSearchResults(
  selectedSeeds: JobListing[],
  searchResults: ExaResult[]
) {
  const fallbackSeed = selectedSeeds[0];

  if (!fallbackSeed) {
    return [];
  }

  const usedUrls = new Set<string>();

  return searchResults
    .filter((result): result is ExaResult & { url: string } => Boolean(result.url))
    .filter((result) => isSpecificJobPostingUrl(result.url))
    .filter((result) => {
      const normalizedUrl = normalizeUrl(result.url);
      if (usedUrls.has(normalizedUrl)) {
        return false;
      }

      usedUrls.add(normalizedUrl);
      return true;
    })
    .map((result, index): JobListing | null => {
      const publishedFreshness = deriveFreshnessFromPublishedDate(result.publishedDate);
      const textFreshness = deriveFreshnessFromText(
        [result.title, result.text].filter(Boolean).join(" ")
      );
      const listingFreshnessScore = Math.max(
        publishedFreshness.listingFreshnessScore,
        textFreshness.listingFreshnessScore,
        1
      );
      const listingRecency =
        publishedFreshness.listingRecency ||
        textFreshness.listingRecency ||
        "Recently posted";
      const listingSnippet =
        sanitizeSnippet(result.text) || "Live vacancy from a Singapore job board.";
      const liveSignalText = [result.title, result.text].filter(Boolean).join(" ");

      if (CLOSED_LANGUAGE.test(liveSignalText)) {
        return null;
      }

      const bestMatch =
        selectedSeeds
          .map((seed) => ({ seed, score: scoreResultAgainstSeed(seed, result) }))
          .sort((left, right) => right.score - left.score)[0]?.seed ??
        selectedSeeds[index % selectedSeeds.length] ??
        fallbackSeed;

      return {
        ...bestMatch,
        id: createListingId(bestMatch.id, result.url),
        title: stripBoardSuffix(result.title) || bestMatch.title,
        applyUrl: result.url,
        portalSearchQuery: `${bestMatch.title} ${bestMatch.company} Singapore apply jobs`,
        listingSource: labelSourceFromUrl(result.url),
        listingSnippet,
        listingRecency,
        listingFreshnessScore,
        isLivePosting: true
      };
    })
    .filter((job): job is JobListing => Boolean(job))
    .toSorted((left, right) => {
      const freshnessDelta =
        (right.listingFreshnessScore ?? 0) - (left.listingFreshnessScore ?? 0);
      if (freshnessDelta !== 0) {
        return freshnessDelta;
      }

      return sortByPriority(left, right);
    })
    .slice(0, MAX_LIVE_RESULTS);
}

function mapAnalyzedJobsToListings(
  analyzedJobs: AnalyzedJob[],
  selectedSeeds: JobListing[],
  searchResults: ExaResult[]
) {
  const seedMap = new Map(selectedSeeds.map((job) => [job.id, job]));
  const resultMap = new Map(
    searchResults
      .filter((result): result is ExaResult & { url: string } => Boolean(result.url))
      .map((result) => [getResultId(result), result])
  );

  const mappedJobs: JobListing[] = [];
  const usedUrls = new Set<string>();

  for (const job of analyzedJobs) {
    const seed = seedMap.get(job.seedId);
    if (!seed) {
      continue;
    }

    const matchedResult = resultMap.get(job.resultId);
    if (!matchedResult?.url || !isSpecificJobPostingUrl(matchedResult.url)) {
      continue;
    }

    const normalizedResultUrl = normalizeUrl(matchedResult.url);
    if (usedUrls.has(normalizedResultUrl)) {
      continue;
    }

    const derivedFreshness = deriveFreshnessFromPublishedDate(
      matchedResult.publishedDate
    );
    const listingRecency =
      derivedFreshness.listingRecency || stripClosedLanguage(job.postedDate);
    const listingFreshnessScore = Math.max(
      derivedFreshness.listingFreshnessScore,
      job.freshnessScore
    );
    const listingSnippet =
      sanitizeSnippet(job.listingSnippet) || sanitizeSnippet(matchedResult.text);
    const listingSource = labelSourceFromUrl(matchedResult.url) || job.source;
    const liveSignalText = [
      job.title,
      job.company,
      job.listingSnippet,
      matchedResult.title,
      matchedResult.text
    ]
      .filter(Boolean)
      .join(" ");

    if (!isCurrentLivePosting(liveSignalText, listingFreshnessScore)) {
      continue;
    }

    mappedJobs.push({
      ...seed,
      id: createListingId(seed.id, matchedResult.url),
      title: stripClosedLanguage(job.title || seed.title),
      company: job.company || seed.company,
      sponsorshipTier: job.sponsorshipTier,
      sponsorshipNote: job.sponsorshipNote || seed.sponsorshipNote,
      applyUrl: matchedResult.url,
      portalSearchQuery: `${job.title || seed.title} ${job.company || seed.company} Singapore apply jobs`,
      listingSource,
      listingSnippet,
      listingRecency,
      listingFreshnessScore,
      isLivePosting: true
    });

    usedUrls.add(normalizedResultUrl);
  }

  return mappedJobs
    .filter((job) =>
      !looksClosed({
        title: job.title,
        listingSnippet: job.listingSnippet ?? "",
        freshnessScore: job.listingFreshnessScore ?? 0
      })
    )
    .sort((left, right) => {
      const freshnessDelta =
        (right.listingFreshnessScore ?? 0) - (left.listingFreshnessScore ?? 0);
      if (freshnessDelta !== 0) {
        return freshnessDelta;
      }

      return sortByPriority(left, right);
    });
}

async function analyzeSearchResults(selectedSeeds: JobListing[], results: ExaResult[]) {
  if (!hasOpenAIKey()) {
    return [];
  }

  const client = getOpenAIClient();
  const seedContext = selectedSeeds.map((job) => ({
    seedId: job.id,
    company: job.company,
    title: job.title,
    industry: job.industry,
    sponsorshipTier: job.sponsorshipTier,
    visaType: job.visaType,
    companySize: job.companySize
  }));
  const searchResultContext = results.map((result) => ({
    resultId: getResultId(result),
    title: result.title ?? "",
    url: result.url ?? "",
    publishedDate: result.publishedDate ?? "",
    text: sanitizeSnippet(result.text)
  }));

  const response = await client.responses.create({
    model: process.env.OPENAI_JSON_MODEL || "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You map live Singapore job-board search results onto a known set of sponsor-friendly seed roles. Treat the seed roles as prototypes for role family, industry, and sponsorship calibration, not as exact company constraints. Return distinct live postings from startups, SMEs, and large companies across varied role types when relevant. Choose only from the provided search results and copy the exact resultId for each selected posting. Do not invent or rewrite URLs. Extract only real job posting URLs, never generic company homepages or general careers pages unless the result clearly points to a single specific vacancy. Match each result to the closest seedId by role family and industry even if the company differs from the seed. Exclude stale or closed postings. Never output the phrase 'No Longer Accepting Applications' for a live result; use postedDate and freshnessScore to express recency and confidence instead. Return as many strong distinct jobs as supported by the search results."
          }
        ]
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Seed roles:\n${JSON.stringify(seedContext)}\n\nSearch results:\n${JSON.stringify(searchResultContext)}`
          }
        ]
      }
    ],
    text: {
      format: {
        type: "json_schema",
        name: "sg_jobs_search_results",
        strict: true,
        schema: responseSchema
      }
    }
  });

  if (!response.output_text) {
    return [];
  }

  const parsed = JSON.parse(response.output_text) as { jobs: AnalyzedJob[] };
  return parsed.jobs;
}

async function searchSGJobsUncached(
  query?: string
): Promise<SearchJobsResponse> {
  const apiKey = process.env.EXA_API_KEY;
  const hasAiKey = hasOpenAIKey();
  const selectedSeeds = selectSeedJobs(query);
  const reasons: string[] = [];

  if (apiKey) {
    try {
      const flattenedResults = deduplicateResults(
        await runExaQueries(buildSearchQueries(selectedSeeds, query))
      );

      if (flattenedResults.length > 0) {
        const heuristicJobs = mapSearchResultsHeuristically(
          selectedSeeds,
          flattenedResults
        );
        const rescueJobs = createRescueListingsFromSearchResults(
          selectedSeeds,
          flattenedResults
        );

        if (hasAiKey) {
          const analyzedJobs = await analyzeSearchResults(selectedSeeds, flattenedResults);
          const aiMappedJobs = mapAnalyzedJobsToListings(
            analyzedJobs,
            selectedSeeds,
            flattenedResults
          );

          const combinedJobs = deduplicateListings([
            ...aiMappedJobs,
            ...heuristicJobs,
            ...rescueJobs
          ]).slice(0, MAX_LIVE_RESULTS);

          if (combinedJobs.length > 0) {
            return {
              jobs: combinedJobs,
              reason:
                aiMappedJobs.length === 0
                  ? "Showing the strongest direct vacancy links while the structured mapping broadens its coverage."
                  : undefined
            };
          }

          reasons.push(
            "Exa returned live results, but the model mapping did not produce enough direct vacancy links."
          );
        } else {
          reasons.push("OPENAI_API_KEY is not configured, so the Exa results were matched heuristically.");
        }

        if (heuristicJobs.length > 0) {
          return { jobs: heuristicJobs, reason: reasons[0] };
        }

        if (rescueJobs.length > 0) {
          return {
            jobs: rescueJobs,
            reason:
              "Showing the strongest direct vacancy links while the job feed broadens its matching."
          };
        }

        reasons.push(
          "Exa returned results, but none passed the direct-link and live-posting checks."
        );
      } else {
        reasons.push("Exa did not return current Singapore job postings for this search.");
      }
    } catch (error) {
      console.error("[searchSGJobs] Exa search failed", error);
      reasons.push("The Exa live job search failed.");
    }
  } else {
    reasons.push("EXA_API_KEY is not configured.");
  }

  return {
    jobs: [],
    reason:
      reasons[0] ??
      "No live Singapore job postings could be retrieved from Exa."
  };
}

export async function searchSGJobs(
  query?: string
): Promise<SearchJobsResponse> {
  const normalizedQuery = query?.trim() || undefined;
  const cacheKey = normalizeSearchCacheKey(normalizedQuery);
  const cache = getJobsCache();
  const inFlight = getJobsInFlight();
  const cachedEntry = cache.get(cacheKey);

  if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
    return cachedEntry.value;
  }

  const existingRequest = inFlight.get(cacheKey);
  if (existingRequest) {
    return existingRequest;
  }

  const request = searchSGJobsUncached(normalizedQuery)
    .then((result) => {
      cache.set(cacheKey, {
        value: result,
        expiresAt: Date.now() + getCacheTtlMs(result)
      });
      return result;
    })
    .finally(() => {
      inFlight.delete(cacheKey);
    });

  inFlight.set(cacheKey, request);
  return request;
}
