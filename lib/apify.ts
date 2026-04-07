import "server-only";

export type PortalResult = {
  title: string;
  url: string;
  source: string;
  snippet: string;
};

const KNOWN_PORTAL_PATTERNS = [
  { pattern: /greenhouse\.io/i, label: "Greenhouse" },
  { pattern: /lever\.co/i, label: "Lever" },
  { pattern: /mycareersfuture\.gov\.sg/i, label: "MyCareersFuture" },
  { pattern: /jobstreet/i, label: "JobStreet" },
  { pattern: /indeed/i, label: "Indeed" },
  { pattern: /eFinancialCareers/i, label: "eFinancialCareers" },
  { pattern: /workdayjobs/i, label: "Workday" },
  { pattern: /smartrecruiters/i, label: "SmartRecruiters" },
  { pattern: /successfactors/i, label: "SAP SuccessFactors" },
  { pattern: /jobs\./i, label: "Company Jobs" },
  { pattern: /careers\./i, label: "Company Careers" }
] as const;

type SearchJobPortalsInput = {
  applyUrl: string;
  company: string;
  title: string;
  query: string;
};

function normalizeActorId(actorId: string) {
  return actorId.replace("/", "~");
}

function portalLabelFromUrl(url: string) {
  for (const portal of KNOWN_PORTAL_PATTERNS) {
    if (portal.pattern.test(url)) {
      return portal.label;
    }
  }

  return "Direct job portal";
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

function extractPortalCandidates(rawItems: unknown[]) {
  const candidates: PortalResult[] = [];

  for (const item of rawItems) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const record = item as Record<string, unknown>;
    const nestedResults = [
      record.organicResults,
      record.nonPromotedSearchResults,
      record.searchResults
    ];

    for (const nested of nestedResults) {
      if (!Array.isArray(nested)) {
        continue;
      }

      for (const entry of nested) {
        if (!entry || typeof entry !== "object") {
          continue;
        }

        const result = entry as Record<string, unknown>;
        const url =
          typeof result.url === "string"
            ? result.url
            : typeof result.link === "string"
              ? result.link
              : null;

        if (!url) {
          continue;
        }

        candidates.push({
          title:
            typeof result.title === "string" && result.title.trim()
              ? result.title
              : "Job portal result",
          url,
          source: portalLabelFromUrl(url),
          snippet:
            typeof result.description === "string"
              ? result.description
              : typeof result.snippet === "string"
                ? result.snippet
                : ""
        });
      }
    }
  }

  return candidates;
}

function deduplicatePortalCandidates(
  input: SearchJobPortalsInput,
  candidates: PortalResult[]
) {
  const seen = new Set<string>();

  return candidates
    .filter((candidate) => {
      const normalized = candidate.url.toLowerCase().split("?")[0];
      if (seen.has(normalized)) {
        return false;
      }

      seen.add(normalized);
      return true;
    })
    .sort((left, right) => {
      const leftCompanyMatch = Number(
        left.url.toLowerCase().includes(input.company.toLowerCase())
      );
      const rightCompanyMatch = Number(
        right.url.toLowerCase().includes(input.company.toLowerCase())
      );

      if (leftCompanyMatch !== rightCompanyMatch) {
        return rightCompanyMatch - leftCompanyMatch;
      }

      const leftPriority = Number(left.source === "Company Careers");
      const rightPriority = Number(right.source === "Company Careers");

      return rightPriority - leftPriority;
    })
    .slice(0, 6);
}

export async function searchJobPortals(input: SearchJobPortalsInput) {
  const token = process.env.APIFY_API_TOKEN;

  if (!token) {
    return createFallbackPortal(input);
  }

  const actorId =
    process.env.APIFY_JOB_SEARCH_ACTOR_ID || "apify/google-search-scraper";
  const endpoint = `https://api.apify.com/v2/acts/${normalizeActorId(actorId)}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}`;

  const searchQuery = `"${input.title}" "${input.company}" Singapore jobs apply OR careers OR jobstreet OR indeed OR mycareersfuture`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        queries: searchQuery,
        maxPagesPerQuery: 1,
        resultsPerPage: Number(process.env.APIFY_RESULTS_PER_PAGE ?? 8),
        countryCode: "SG",
        languageCode: "en"
      }),
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`Apify request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as unknown[];
    const portals = deduplicatePortalCandidates(
      input,
      extractPortalCandidates(payload)
    );

    return portals.length > 0 ? portals : createFallbackPortal(input);
  } catch {
    return createFallbackPortal(input);
  }
}
