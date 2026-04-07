"use client";

import { startTransition, useEffect, useState } from "react";

import { readSavedJobs, type SavedJob } from "@/lib/local-storage";
import type { PostingAnalysisResult, ShouldApplyResult } from "@/lib/job-analysis";

type PostingPayload = {
  extracted: {
    company: string;
    role: string;
    salaryMin: number | null;
    salaryMax: number | null;
    requirements: string[];
    summary: string;
  };
  analysis: PostingAnalysisResult;
};

type ApplyPayload = {
  sourcePreview: string;
  result: ShouldApplyResult;
};

function formatVerdictTone(verdict: ShouldApplyResult["verdict"]) {
  switch (verdict) {
    case "PASS":
      return "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200";
    case "SKIP":
      return "bg-rose-100 text-rose-900 dark:bg-rose-500/15 dark:text-rose-200";
    default:
      return "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200";
  }
}

export function AnalysisLab() {
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [postingResult, setPostingResult] = useState<PostingPayload | null>(null);
  const [postingError, setPostingError] = useState<string | null>(null);
  const [isPostingLoading, setIsPostingLoading] = useState(false);

  const [mode, setMode] = useState<"url" | "text">("text");
  const [source, setSource] = useState("");
  const [applyResult, setApplyResult] = useState<ApplyPayload | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isApplyLoading, setIsApplyLoading] = useState(false);

  useEffect(() => {
    setSavedJobs(readSavedJobs());
  }, []);

  async function handlePostingSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setPostingError("Choose a screenshot or PDF first.");
      return;
    }

    setPostingError(null);
    setIsPostingLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/analyze-posting", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as PostingPayload | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Unable to analyze posting.");
      }

      setPostingResult(payload);
    } catch (submitError) {
      setPostingError(
        submitError instanceof Error ? submitError.message : "Unable to analyze posting."
      );
    } finally {
      setIsPostingLoading(false);
    }
  }

  async function handleApplySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!source.trim()) {
      setApplyError("Paste a URL or posting text first.");
      return;
    }

    setApplyError(null);
    setIsApplyLoading(true);

    try {
      const response = await fetch("/api/should-apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mode,
          source
        })
      });

      const payload = (await response.json()) as ApplyPayload | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Unable to run apply check.");
      }

      setApplyResult(payload);
    } catch (submitError) {
      setApplyError(submitError instanceof Error ? submitError.message : "Unable to run apply check.");
    } finally {
      setIsApplyLoading(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
      <aside className="space-y-5">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-5 dark:border-slate-800 dark:bg-slate-950/80">
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Saved jobs
          </p>
          <div className="mt-4 space-y-3">
            {savedJobs.length === 0 ? (
              <p className="text-sm leading-6 text-slate-500 dark:text-slate-400">
                Save jobs from the board and they will show up here for longer-term tracking.
              </p>
            ) : (
              savedJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="text-sm font-semibold text-ink dark:text-white">{job.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{job.company}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {job.sponsorshipTier}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white dark:border-slate-800">
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-400">
            Lab notes
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>Feature 4 uses `gpt-4o` multimodal analysis for screenshot and PDF extraction.</li>
            <li>Feature 5 runs independent workers in parallel before the final verdict.</li>
            <li>Use the verdict as triage, then confirm salary and sponsorship with the recruiter.</li>
          </ul>
        </div>
      </aside>

      <section className="space-y-6">
        <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-card dark:border-slate-800 dark:bg-slate-950/80 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Feature 4
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-white">
                Job Posting Analyzer
              </h2>
            </div>
            <p className="max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              Upload a screenshot or PDF and the vision pipeline will extract the role, company,
              salary clues, and sponsorship warnings.
            </p>
          </div>

          <form onSubmit={handlePostingSubmit} className="mt-6 space-y-4">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Screenshot or PDF</span>
              <input
                type="file"
                accept="image/*,.pdf,application/pdf"
                onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
              />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {postingError ? (
                  <span className="text-rose-600 dark:text-rose-300">{postingError}</span>
                ) : file ? (
                  `Selected: ${file.name}`
                ) : (
                  "PNG, JPG, WEBP, and PDF work best."
                )}
              </p>
              <button
                type="submit"
                disabled={isPostingLoading}
                className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {isPostingLoading ? "Analyzing..." : "Analyze Posting"}
              </button>
            </div>
          </form>

          {postingResult ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Extracted posting
                </p>
                <p className="mt-3 text-xl font-semibold text-ink dark:text-white">
                  {postingResult.analysis.role}
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  {postingResult.analysis.company}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  {postingResult.extracted.summary}
                </p>
                <p className="mt-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
                  {postingResult.analysis.salaryRange}
                </p>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-blue-50/70 p-4 dark:border-slate-800 dark:bg-blue-500/10">
                <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                  Sponsorship likelihood
                </p>
                <p className="mt-3 text-3xl font-semibold text-blue-900 dark:text-blue-100">
                  {postingResult.analysis.sponsorshipLikelihoodScore}/100
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  History: {postingResult.analysis.sponsorshipHistory}
                </p>
                <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {postingResult.analysis.rationale.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Red flags
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {postingResult.analysis.redFlags.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Questions to ask recruiter
                </p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {postingResult.analysis.recruiterQuestions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[2rem] border border-slate-200 bg-white/85 p-5 shadow-card dark:border-slate-800 dark:bg-slate-950/80 sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Feature 5
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-ink dark:text-white">
                Should I Apply?
              </h2>
            </div>
            <div className="flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
              {(["text", "url"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => startTransition(() => setMode(option))}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    mode === option
                      ? "bg-white text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300"
                      : "text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {option === "text" ? "Paste text" : "Paste URL"}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleApplySubmit} className="mt-6 space-y-4">
            {mode === "url" ? (
              <input
                value={source}
                onChange={(event) => setSource(event.target.value)}
                placeholder="https://company.com/job-posting"
                className="w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            ) : (
              <textarea
                value={source}
                onChange={(event) => setSource(event.target.value)}
                rows={8}
                placeholder="Paste the full job description here."
                className="w-full rounded-[1.5rem] border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {applyError ? (
                  <span className="text-rose-600 dark:text-rose-300">{applyError}</span>
                ) : (
                  "Workers extract facts, estimate COMPASS, check sponsorship history, and scan for foreigner-friendly signals."
                )}
              </p>
              <button
                type="submit"
                disabled={isApplyLoading}
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
              >
                {isApplyLoading ? "Running workers..." : "Run Apply Check"}
              </button>
            </div>
          </form>

          {applyResult ? (
            <div className="mt-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
                <div>
                  <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Verdict
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-ink dark:text-white">
                    {applyResult.result.extracted.role}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                    {applyResult.result.extracted.company}
                  </p>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-semibold ${formatVerdictTone(applyResult.result.verdict)}`}>
                  {applyResult.result.verdict} · {applyResult.result.confidence}% confidence
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Worker outputs
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    <li>
                      COMPASS: {applyResult.result.workerOutputs.compass.totalScore}/60
                    </li>
                    <li>
                      Sponsorship score: {applyResult.result.workerOutputs.sponsorship.score}/100
                    </li>
                    <li>{applyResult.result.workerOutputs.foreignerSignals.summary}</li>
                  </ul>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-blue-50/70 p-4 dark:border-slate-800 dark:bg-blue-500/10">
                  <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                    Reasoning
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {applyResult.result.reasoning.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Follow-up questions
                  </p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {applyResult.result.followUpQuestions.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                  <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    Source preview
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {applyResult.sourcePreview}
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
