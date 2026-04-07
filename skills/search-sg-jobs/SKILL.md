---
name: search-sg-jobs
description: Search live Singapore job postings for international-student-friendly roles and map them onto the BorderlessHire job-board contract. Use when updating or debugging the backend job feed, wiring direct job-posting apply links, or refreshing sponsor-aware listings through `app/actions/searchJobs.ts` and `app/api/jobs/route.ts`.
---

# Search Singapore Jobs

Use `app/actions/searchJobs.ts` as the source of truth for live job-board retrieval.\ This action fetches live search results from Exa, analyzes them with OpenAI to determine relevance and sponsorship likelihood, and maps them onto the `JobListing` shape expected by the homepage board. The backend route at `app/api/jobs/route.ts` serves this data to the frontend.


## Workflow

1. Keep the board UI contract stable by returning `JobListing[]`-compatible data for `app/api/jobs/route.ts`.
2. Pull live search results from Exa with `EXA_API_KEY`.
3. Restrict searches to Singapore job boards such as LinkedIn, JobStreet, JobsSG, Indeed, JobsDB, and MyCareersFuture.
4. Use OpenAI structured output to map live search results onto the known seed roles in `lib/jobs.ts`.
5. Preserve direct posting URLs in `applyUrl`. Prefer a specific vacancy link over a generic careers portal.
6. Fall back to seed jobs only when live search or model analysis fails.
7. The results should not say 'No Longer Accepting Applications' if the posting is still live. Use `listingRecency` and `listingFreshnessScore` to indicate posting age and confidence in its current status.

## Files

- `app/actions/searchJobs.ts`: live search, result analysis, and `JobListing` mapping
- `app/api/jobs/route.ts`: backend route consumed by the homepage board
- `lib/jobs.ts`: seed sponsorship metadata and fallback job shape

## Guardrails

- Do not change the UI when only the job feed is being updated.
- Do not let `applyUrl` point to a company homepage if a specific posting URL is available.
- Keep sponsorship tiers aligned with the app’s existing values:
  - `Foreigner-Friendly`
  - `Case-by-Case`
  - `Unlikely to Sponsor`
- Keep listing metadata additive. The homepage may use `listingSource`, `listingSnippet`, `listingRecency`, `listingFreshnessScore`, and `isLivePosting`.

## Validation

After backend changes, run `npm run build`.
