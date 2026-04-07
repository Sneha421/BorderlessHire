"use client";

import { FormEvent, useState } from "react";

type PortalResult = {
  title: string;
  url: string;
  source: string;
  snippet: string;
};

type AnalysisResult = {
  title: string;
  company: string;
  industry: string;
  visaType: string;
  salaryMin: number;
  salaryMax: number;
  companySize: string;
  employeeCount: number;
  activeForeignHiringQuota: boolean;
  sponsorshipTier: string;
  sponsorshipNote: string;
  summary: string;
  searchQuery: string;
  fairConsiderationFramework: boolean;
};

function formatSalary(value: number) {
  if (!value) {
    return "Not stated";
  }

  return new Intl.NumberFormat("en-SG", {
    style: "currency",
    currency: "SGD",
    maximumFractionDigits: 0
  }).format(value);
}

export function JobPostingAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [postingText, setPostingText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [portals, setPortals] = useState<PortalResult[]>([]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file && !postingText.trim()) {
      setError("Upload a screenshot or paste the job-posting text.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    if (file) {
      formData.append("file", file);
    }
    if (postingText.trim()) {
      formData.append("postingText", postingText.trim());
    }

    try {
      const response = await fetch("/api/job-posting-analyze", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as {
        error?: string;
        analysis?: AnalysisResult;
        portals?: PortalResult[];
      };

      if (!response.ok || !payload.analysis) {
        throw new Error(payload.error || "Unable to analyze job posting.");
      }

      setAnalysis(payload.analysis);
      setPortals(payload.portals || []);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Unable to analyze job posting."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="mt-5 rounded-[1.6rem] border border-sky-200 bg-sky-50/80 p-4 shadow-sm dark:border-sky-500/30 dark:bg-sky-500/10 sm:rounded-[1.8rem] sm:p-5">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-sky-900 dark:text-sky-200">
            Multimodal posting scan
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-950 dark:text-white">
            Upload a screenshot and let the agent assess sponsorship odds.
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
            Drop in a screenshot or paste the text from any listing. The analyzer
            extracts the likely job details, infers sponsorship friendliness for an
            international student in Singapore, and returns direct apply portals.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Upload screenshot
              </span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-800 dark:border-sky-500/30 dark:bg-slate-950 dark:text-slate-100"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Or paste the posting text
              </span>
              <textarea
                value={postingText}
                onChange={(event) => setPostingText(event.target.value)}
                rows={5}
                placeholder="Paste a job description, salary note, or visa requirement text."
                className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-sky-500/30 dark:bg-slate-950 dark:text-white"
              />
            </label>

            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {error ? (
                  <span className="text-rose-700 dark:text-rose-300">{error}</span>
                ) : (
                  "Best for screenshots of company career pages, MyCareersFuture, JobStreet, or Indeed."
                )}
              </p>
              <button
                type="submit"
                disabled={isLoading}
                className="button-primary dark:border-blue-300/20"
              >
                {isLoading ? "Analyzing..." : "Analyze Now"}
              </button>
            </div>
          </form>
        </div>

        <div className="rounded-[1.75rem] border border-sky-200 bg-white/80 p-5 dark:border-sky-500/20 dark:bg-slate-950/60">
          {analysis ? (
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-900 dark:bg-blue-500/15 dark:text-blue-200">
                  {analysis.sponsorshipTier}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {analysis.visaType}
                </span>
                {analysis.activeForeignHiringQuota ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200">
                    Active foreign hiring signal
                  </span>
                ) : null}
              </div>

              <h3 className="mt-4 text-2xl font-semibold text-slate-950 dark:text-white">
                {analysis.title}
              </h3>
              <p className="mt-1 text-base text-slate-600 dark:text-slate-300">
                {analysis.company}
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Salary
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                    {analysis.salaryMin || analysis.salaryMax
                      ? `${formatSalary(analysis.salaryMin)} - ${formatSalary(analysis.salaryMax)}`
                      : "Not stated"}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
                  <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    Employer signal
                  </p>
                  <p className="mt-2 text-lg font-semibold text-slate-950 dark:text-white">
                    {analysis.companySize}
                  </p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {analysis.fairConsiderationFramework
                      ? "FCF likely applies"
                      : "FCF less likely to be triggered"}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {analysis.summary}
              </p>
              <p className="mt-3 text-sm leading-6 text-slate-700 dark:text-slate-300">
                {analysis.sponsorshipNote}
              </p>

              <div className="mt-5">
                <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Apply now
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {portals.map((portal) => (
                    <a
                      key={`${portal.source}-${portal.url}`}
                      href={portal.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    >
                      Apply on {portal.source}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[18rem] items-center justify-center rounded-[1.5rem] border border-dashed border-sky-300 bg-sky-50/70 p-6 text-center dark:border-sky-500/30 dark:bg-sky-500/5">
              <div className="max-w-md">
                <p className="text-lg font-semibold text-slate-950 dark:text-white">
                  Analysis will appear here
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-400">
                  The agent will infer the job title, company, likely visa path,
                  sponsorship tier, and direct application portals.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
