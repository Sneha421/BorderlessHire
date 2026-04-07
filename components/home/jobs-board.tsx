"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import { HeroSection } from "@/components/home/hero-section";
import { JobCardSkeleton } from "@/components/home/job-card-skeleton";
import {
  readCachedLiveJobs,
  readSavedJobs,
  toggleSavedJob,
  writeCachedLiveJobs
} from "@/lib/local-storage";
import {
  companySizes,
  industries,
  matchesSalaryBand,
  salaryBands,
  type JobListing,
  type SponsorshipTier,
  visaTypes
} from "@/lib/jobs";

type PortalResult = {
  title: string;
  url: string;
  source: string;
  snippet: string;
};

const sponsorshipStyles: Record<SponsorshipTier, string> = {
  "Foreigner-Friendly":
    "bg-blue-100 text-blue-900 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30",
  "Case-by-Case":
    "bg-amber-100 text-amber-900 ring-amber-200 dark:bg-amber-500/15 dark:text-amber-100 dark:ring-amber-400/30",
  "Unlikely to Sponsor":
    "bg-rose-100 text-rose-900 ring-rose-200 dark:bg-rose-500/15 dark:text-rose-100 dark:ring-rose-400/30"
};

const sponsorshipIcons: Record<SponsorshipTier, string> = {
  "Foreigner-Friendly": "🟢",
  "Case-by-Case": "🟡",
  "Unlikely to Sponsor": "🔴"
};

function formatSalary(value: number) {
  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0
  }).format(value);
}

function getInitials(company: string) {
  return company
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function matchesSearchText(job: JobListing, normalizedSearch: string) {
  if (!normalizedSearch) {
    return true;
  }

  return [job.title, job.company, job.industry, job.listingSource, job.listingSnippet]
    .join(" ")
    .toLowerCase()
    .includes(normalizedSearch);
}

function sortJobs(left: JobListing, right: JobListing) {
  const quotaDelta =
    Number(right.activeForeignHiringQuota) - Number(left.activeForeignHiringQuota);
  if (quotaDelta !== 0) {
    return quotaDelta;
  }

  const sponsorshipRank: Record<SponsorshipTier, number> = {
    "Foreigner-Friendly": 0,
    "Case-by-Case": 1,
    "Unlikely to Sponsor": 2
  };

  const sponsorshipDelta =
    sponsorshipRank[left.sponsorshipTier] - sponsorshipRank[right.sponsorshipTier];
  if (sponsorshipDelta !== 0) {
    return sponsorshipDelta;
  }

  const freshnessDelta =
    (right.listingFreshnessScore ?? 0) - (left.listingFreshnessScore ?? 0);
  if (freshnessDelta !== 0) {
    return freshnessDelta;
  }

  return right.salaryMax - left.salaryMax;
}

function filterJobs(
  boardJobs: JobListing[],
  options: {
    industry: string;
    salaryBand: string;
    visaType: string;
    companySize: string;
    normalizedSearch: string;
    ignoreIndustry?: boolean;
    ignoreSalary?: boolean;
    ignoreVisa?: boolean;
    ignoreCompanySize?: boolean;
    ignoreSearch?: boolean;
  }
) {
  return boardJobs
    .filter((job) => {
      const industryMatch =
        options.ignoreIndustry || options.industry === "All" || job.industry === options.industry;
      const visaMatch =
        options.ignoreVisa || options.visaType === "All" || job.visaType === options.visaType;
      const companySizeMatch =
        options.ignoreCompanySize ||
        options.companySize === "All" ||
        job.companySize === options.companySize;
      const salaryMatch =
        options.ignoreSalary || matchesSalaryBand(job, options.salaryBand);
      const searchMatch =
        options.ignoreSearch || matchesSearchText(job, options.normalizedSearch);

      return (
        industryMatch &&
        visaMatch &&
        companySizeMatch &&
        salaryMatch &&
        searchMatch
      );
    })
    .toSorted(sortJobs);
}

export function JobsBoard() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q")?.trim() || "";

  const [industry, setIndustry] = useState("All");
  const [salaryBand, setSalaryBand] = useState("any");
  const [visaType, setVisaType] = useState("All");
  const [companySize, setCompanySize] = useState("All");
  const [boardJobs, setBoardJobs] = useState<JobListing[]>([]);
  const [boardReason, setBoardReason] = useState<string>("");
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    setSavedJobIds(new Set(readSavedJobs().map((job) => job.id)));
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setIsLoading(true);

      try {
        const query = searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : "";
        const response = await fetch(`/api/jobs${query}`, {
          signal: controller.signal,
          cache: "no-store"
        });
        const payload = (await response.json()) as {
          error?: string;
          jobs?: JobListing[];
          reason?: string;
        };

        if (!response.ok || !payload.jobs) {
          throw new Error(payload.error || "Unable to fetch jobs.");
        }

        if (payload.jobs.length > 0) {
          setBoardJobs(payload.jobs);
          writeCachedLiveJobs(payload.jobs);
          setBoardReason(payload.reason || "");
          return;
        }

        const cachedJobs = readCachedLiveJobs();
        if (cachedJobs.length > 0) {
          setBoardJobs(cachedJobs);
          setBoardReason(
            "Showing recently verified live roles while the latest refresh catches up."
          );
          return;
        }

        setBoardJobs(payload.jobs);
        setBoardReason(
          payload.reason || "Unable to load verified live postings right now."
        );
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        const cachedJobs = readCachedLiveJobs();
        if (cachedJobs.length > 0) {
          setBoardJobs(cachedJobs);
          setBoardReason(
            "Showing recently verified live roles while the live refresh recovers."
          );
          return;
        }

        setBoardJobs([]);
        setBoardReason("Unable to load verified live postings right now.");
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadJobs();

    return () => controller.abort();
  }, [searchQuery]);

  const featuredCount = useMemo(
    () =>
      new Set(
        boardJobs
          .filter((job) => job.sponsorshipTier === "Foreigner-Friendly")
          .map((job) => job.company)
      ).size,
    [boardJobs]
  );

  const { displayJobs, filtersRelaxedMessage, showingLiveResults } = useMemo(() => {
    if (boardJobs.length === 0) {
      return {
        displayJobs: [],
        filtersRelaxedMessage: "",
        showingLiveResults: false
      };
    }

    const normalizedSearch = searchQuery.toLowerCase();

    const baseOptions = {
      industry,
      salaryBand,
      visaType,
      companySize,
      normalizedSearch
    };
    const strictMatches = filterJobs(boardJobs, baseOptions);

    if (strictMatches.length > 0) {
      return {
        displayJobs: strictMatches,
        filtersRelaxedMessage: "",
        showingLiveResults: true
      };
    }

    const relaxationSteps = [
      {
        matches: filterJobs(boardJobs, { ...baseOptions, ignoreSalary: true }),
        message: "Showing the closest live roles after relaxing the salary filter."
      },
      {
        matches: filterJobs(boardJobs, {
          ...baseOptions,
          ignoreSalary: true,
          ignoreCompanySize: true
        }),
        message: "Showing the closest live roles after relaxing salary and company-size filters."
      },
      {
        matches: filterJobs(boardJobs, {
          ...baseOptions,
          ignoreSalary: true,
          ignoreCompanySize: true,
          ignoreVisa: true
        }),
        message: "Showing the closest live roles after relaxing salary, company-size, and visa filters."
      },
      {
        matches: filterJobs(boardJobs, {
          ...baseOptions,
          ignoreSalary: true,
          ignoreCompanySize: true,
          ignoreVisa: true,
          ignoreIndustry: true
        }),
        message: "Showing the closest live roles after broadening your filter set."
      },
      {
        matches: filterJobs(boardJobs, {
          ...baseOptions,
          ignoreSalary: true,
          ignoreCompanySize: true,
          ignoreVisa: true,
          ignoreIndustry: true,
          ignoreSearch: true
        }),
        message: "Showing the closest live roles available right now while broadening your filters and search."
      }
    ];

    const fallback = relaxationSteps.find((step) => step.matches.length > 0);

    return fallback
      ? {
          displayJobs: fallback.matches,
          filtersRelaxedMessage: fallback.message,
          showingLiveResults: true
        }
      : {
          displayJobs: [],
          filtersRelaxedMessage: "",
          showingLiveResults: false
        };
  }, [boardJobs, companySize, industry, salaryBand, searchQuery, visaType]);

  function updateIndustry(value: string) {
    startTransition(() => setIndustry(value));
  }

  function updateSalaryBand(value: string) {
    startTransition(() => setSalaryBand(value));
  }

  function updateVisaType(value: string) {
    startTransition(() => setVisaType(value));
  }

  function updateCompanySize(value: string) {
    startTransition(() => setCompanySize(value));
  }

  function handleToggleSavedJob(job: JobListing) {
    const next = toggleSavedJob(job);
    setSavedJobIds(new Set(next.map((savedJob) => savedJob.id)));
  }

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid-fade bg-[size:32px_32px] opacity-30" />
      <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <HeroSection featuredCount={featuredCount} totalJobs={boardJobs.length} />

        <div className="mt-6 rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-card backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70 sm:p-6">
          <div
            id="job-filters"
            className="rounded-[1.75rem] border border-slate-200 bg-slate-950 px-5 py-5 text-white dark:border-slate-800"
          >
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  "Foreigner-Friendly",
                  "Case-by-Case",
                  "Unlikely to Sponsor"
                ] as SponsorshipTier[]
              ).map((tier) => (
                <span
                  key={tier}
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${sponsorshipStyles[tier]}`}
                >
                  {sponsorshipIcons[tier]} {tier}
                </span>
              ))}
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="grid gap-2">
                <span className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-400">
                  Industry
                </span>
                <select
                  value={industry}
                  onChange={(event) => updateIndustry(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300"
                >
                  <option value="All">All industries</option>
                  {industries.map((item) => (
                    <option key={item} value={item} className="text-slate-900">
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-400">
                  Salary band
                </span>
                <select
                  value={salaryBand}
                  onChange={(event) => updateSalaryBand(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300"
                >
                  {salaryBands.map((band) => (
                    <option key={band.id} value={band.id} className="text-slate-900">
                      {band.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-400">
                  Visa type
                </span>
                <select
                  value={visaType}
                  onChange={(event) => updateVisaType(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300"
                >
                  <option value="All">All visa types</option>
                  {visaTypes.map((item) => (
                    <option key={item} value={item} className="text-slate-900">
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-400">
                  Company size
                </span>
                <select
                  value={companySize}
                  onChange={(event) => updateCompanySize(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-sky-300"
                >
                  <option value="All">All company sizes</option>
                  {companySizes.map((item) => (
                    <option key={item} value={item} className="text-slate-900">
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div>
              <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                {showingLiveResults ? "Verified live results" : "Borderless-ready roles"}
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-ink dark:text-white">
                {displayJobs.length} {showingLiveResults ? "live roles ready to explore" : "roles worth tracking"}
              </h2>
            </div>
            <p className="max-w-lg text-right text-sm leading-6 text-slate-500 dark:text-slate-400">
              Latest live postings are sourced through Exa from Singapore job boards
              such as JobStreet, JobsSG, Indeed, LinkedIn, and MyCareersFuture.
            </p>
          </div>

          {!isLoading && filtersRelaxedMessage ? (
            <div className="mt-4 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-100">
              {filtersRelaxedMessage}
            </div>
          ) : null}

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {isLoading
              ? Array.from({ length: 6 }, (_, index) => (
                  <JobCardSkeleton key={`skeleton-${index}`} />
                ))
              : displayJobs.map((job) => (
                  <article
                    key={job.id}
                    className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-card dark:border-slate-800 dark:bg-slate-900 [content-visibility:auto] [contain-intrinsic-size:0_520px]"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-lg font-semibold text-blue-900 dark:bg-blue-500/20 dark:text-blue-100">
                        {getInitials(job.company)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${sponsorshipStyles[job.sponsorshipTier]}`}
                          >
                            {sponsorshipIcons[job.sponsorshipTier]} {job.sponsorshipTier}
                          </span>
                          {job.activeForeignHiringQuota ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200">
                              Active foreign hiring
                            </span>
                          ) : null}
                          {job.listingSource ? (
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                              {job.listingSource}
                            </span>
                          ) : null}
                          {job.listingRecency ? (
                            <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200">
                              {job.listingRecency}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 text-2xl font-semibold leading-tight text-ink dark:text-white">
                          {job.title}
                        </h3>
                        <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                          {job.company}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {job.industry}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {job.jobType}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {job.visaType}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {job.companySize}
                      </span>
                      {job.fairConsiderationFramework ? (
                        <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-900 dark:bg-sky-500/15 dark:text-sky-200">
                          FCF likely applies
                        </span>
                      ) : null}
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                        <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                          Salary range
                        </p>
                        <p className="mt-2 text-lg font-semibold text-ink dark:text-white">
                          {formatSalary(job.salaryMin)} - {formatSalary(job.salaryMax)}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          SGD / month
                        </p>
                      </div>
                      <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-500/10">
                        <div className="flex items-center gap-2">
                          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                            COMPASS estimate
                          </p>
                          <div className="group/tooltip relative">
                            <button
                              type="button"
                              aria-label="What is this COMPASS estimate?"
                              className="flex h-5 w-5 items-center justify-center rounded-full border border-blue-300 text-[10px] font-bold text-blue-700 dark:border-blue-400/40 dark:text-blue-200"
                            >
                              i
                            </button>
                            <div className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 w-56 -translate-x-1/2 rounded-2xl bg-slate-950 px-3 py-2 text-xs leading-5 text-white opacity-0 shadow-lg transition group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100">
                              Estimated contribution to your COMPASS score if hired
                              at stated salary
                            </div>
                          </div>
                        </div>
                        <p className="mt-2 text-lg font-semibold text-blue-900 dark:text-blue-100">
                          +{job.compassPoints} points
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">
                          Degree required: {job.requiresDegree ? "Yes" : "No"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {job.listingSnippet ? `${job.listingSnippet} ` : ""}
                      {job.sponsorshipNote}
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      {job.isLivePosting ? (
                        <a
                          href={job.applyUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                        >
                          Apply Now
                        </a>
                      ) : null}
                      <Link
                        href={{
                          pathname: "/interview",
                          query: { company: job.company }
                        }}
                        className="inline-flex items-center justify-center rounded-full border border-sky-300 bg-sky-50 px-5 py-3 text-sm font-semibold text-sky-800 transition hover:bg-sky-100 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200"
                      >
                        Practice Interview
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleToggleSavedJob(job)}
                        className={`inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                          savedJobIds.has(job.id)
                            ? "border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                            : "border border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                        }`}
                      >
                        {savedJobIds.has(job.id) ? "Saved" : "Save Job"}
                      </button>
                    </div>

                  </article>
                ))}
          </div>

          {!isLoading && displayJobs.length === 0 ? (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-lg font-semibold text-ink dark:text-white">
                Live postings are being refreshed.
              </p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                {boardReason ||
                  "Only current postings with direct vacancy links are shown. Refresh in a moment while the Singapore job boards finish syncing."}
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
