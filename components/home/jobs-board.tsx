"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";

import { JobCardSkeleton } from "@/components/home/job-card-skeleton";
import { industries, jobs, type JobListing, type SponsorshipLikelihood } from "@/lib/jobs";

const sponsorshipStyles: Record<SponsorshipLikelihood, string> = {
  High: "bg-blue-100 text-blue-900 ring-blue-200 dark:bg-blue-500/15 dark:text-blue-200 dark:ring-blue-400/30",
  Medium: "bg-sky-100 text-sky-900 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-400/30",
  Low: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700/40 dark:text-slate-200 dark:ring-slate-600"
};

const minSalaryOptions = [0, 4000, 5000, 6000, 7000, 8000];

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

function matchesFilters(
  job: JobListing,
  industry: string,
  sponsorship: string,
  minSalary: number
) {
  const industryMatch = industry === "All" || job.industry === industry;
  const sponsorshipMatch =
    sponsorship === "All" || job.sponsorshipLikelihood === sponsorship;
  const salaryMatch = job.salaryMin >= minSalary;

  return industryMatch && sponsorshipMatch && salaryMatch;
}

export function JobsBoard() {
  const [industry, setIndustry] = useState("All");
  const [sponsorship, setSponsorship] = useState("All");
  const [minSalary, setMinSalary] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setIsLoading(false), 550);

    return () => window.clearTimeout(timeout);
  }, []);

  const featuredCount = useMemo(
    () =>
      new Set(
        jobs
          .filter((job) => job.sponsorshipLikelihood === "High")
          .map((job) => job.company)
      ).size,
    []
  );

  const filteredJobs = useMemo(
    () =>
      jobs.filter((job) =>
        matchesFilters(job, industry, sponsorship, minSalary)
      ),
    [industry, sponsorship, minSalary]
  );

  function updateIndustry(value: string) {
    startTransition(() => setIndustry(value));
  }

  function updateSponsorship(value: string) {
    startTransition(() => setSponsorship(value));
  }

  function updateMinSalary(value: number) {
    startTransition(() => setMinSalary(value));
  }

  return (
    <main className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-grid-fade bg-[size:32px_32px] opacity-30" />
      <section className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <div className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-card backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70 sm:p-6">
          <div className="flex flex-col gap-5 border-b border-slate-200/80 pb-6 dark:border-slate-800">
            <div className="inline-flex w-fit items-center rounded-full bg-emerald-100 px-4 py-2 font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-emerald-900">
              🟢 {featuredCount} companies actively sponsoring EPs right now
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr] lg:items-end">
              <div className="space-y-4">
                <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                  borderlessHire / Singapore
                </p>
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight text-ink dark:text-white sm:text-5xl">
                  Sponsor-friendly roles for international students planning their
                  first Singapore career move.
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
                  Filter curated openings by industry, salary floor, and visa
                  friendliness. Each role includes a rough COMPASS contribution and
                  a direct bridge into company-specific interview practice.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-slate-200 bg-blue-50/80 p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                  What this board optimizes for
                </p>
                <div className="mt-4 grid gap-3 text-sm text-slate-700 dark:text-slate-300">
                  <div className="rounded-2xl bg-white/80 p-3 dark:bg-slate-800">
                    Large employers with known Singapore sponsorship patterns
                  </div>
                  <div className="rounded-2xl bg-white/80 p-3 dark:bg-slate-800">
                    Salary ranges that better support EP eligibility
                  </div>
                  <div className="rounded-2xl bg-white/80 p-3 dark:bg-slate-800">
                    Fast handoff into interview prep for each target company
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-950 px-5 py-5 text-white dark:border-slate-800">
            <div className="grid gap-4 md:grid-cols-3">
              <label className="grid gap-2">
                <span className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-400">
                  Industry
                </span>
                <select
                  value={industry}
                  onChange={(event) => updateIndustry(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300"
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
                  Sponsorship
                </span>
                <select
                  value={sponsorship}
                  onChange={(event) => updateSponsorship(event.target.value)}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300"
                >
                  <option value="All">All likelihoods</option>
                  <option value="High" className="text-slate-900">
                    High
                  </option>
                  <option value="Medium" className="text-slate-900">
                    Medium
                  </option>
                  <option value="Low" className="text-slate-900">
                    Low
                  </option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-400">
                  Min salary
                </span>
                <select
                  value={minSalary}
                  onChange={(event) => updateMinSalary(Number(event.target.value))}
                  className="rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-300"
                >
                  {minSalaryOptions.map((salary) => (
                    <option key={salary} value={salary} className="text-slate-900">
                      {salary === 0 ? "Any salary" : `${formatSalary(salary)}+ / month`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className="mt-8 flex items-center justify-between gap-4">
            <div>
              <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Live results
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-ink dark:text-white">
                {filteredJobs.length} roles match your filters
              </h2>
            </div>
            <p className="max-w-lg text-right text-sm leading-6 text-slate-500 dark:text-slate-400">
              COMPASS points are directional estimates based on salary, qualifications,
              and expected demand for the role in Singapore.
            </p>
          </div>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {isLoading
              ? Array.from({ length: 6 }, (_, index) => (
                  <JobCardSkeleton key={`skeleton-${index}`} />
                ))
              : filteredJobs.map((job) => (
              <article
                key={job.id}
                className="group rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-card dark:border-slate-800 dark:bg-slate-900 [content-visibility:auto] [contain-intrinsic-size:0_420px]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-lg font-semibold text-blue-900 dark:bg-blue-500/20 dark:text-blue-100">
                    {getInitials(job.company)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${sponsorshipStyles[job.sponsorshipLikelihood]}`}
                      >
                        {job.sponsorshipLikelihood} sponsorship
                      </span>
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {job.industry}
                      </span>
                      <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                        {job.jobType}
                      </span>
                    </div>
                    <h3 className="mt-3 text-2xl font-semibold leading-tight text-ink dark:text-white">
                      {job.title}
                    </h3>
                    <p className="mt-1 text-base text-slate-600 dark:text-slate-300">{job.company}</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/80">
                    <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                      Salary range
                    </p>
                    <p className="mt-2 text-lg font-semibold text-ink dark:text-white">
                      {formatSalary(job.salaryMin)} - {formatSalary(job.salaryMax)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">SGD / month</p>
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
                          Estimated contribution to your COMPASS score if hired at
                          stated salary
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
                  {job.sponsorshipNote}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <Link
                    href={{
                      pathname: "/interview",
                      query: { company: job.company }
                    }}
                    className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
                  >
                    Practice Interview
                  </Link>
                  <a
                    href={job.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-full border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    View on LinkedIn
                  </a>
                </div>
              </article>
            ))}
          </div>

          {!isLoading && filteredJobs.length === 0 ? (
            <div className="mt-8 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              <p className="text-lg font-semibold text-ink dark:text-white">No roles match those filters.</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Reduce the minimum salary or widen sponsorship criteria to see more
                sponsor-friendly openings.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}
