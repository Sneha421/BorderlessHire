"use client";

import { startTransition, useEffect, useState } from "react";

import { JobPostingAnalyzer } from "@/components/home/job-posting-analyzer";
import { readSavedJobs, type SavedJob } from "@/lib/local-storage";
import type { ShouldApplyResult } from "@/lib/job-analysis";

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

  const [mode, setMode] = useState<"url" | "text">("text");
  const [source, setSource] = useState("");
  const [applyResult, setApplyResult] = useState<ApplyPayload | null>(null);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [isApplyLoading, setIsApplyLoading] = useState(false);

  useEffect(() => {
    setSavedJobs(readSavedJobs());
  }, []);

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
    <div className="space-y-6">
      <section className="space-y-6">
        <div className="rounded-[1.45rem] border border-slate-200 bg-white/85 p-3.5 dark:border-slate-800 dark:bg-slate-950/80 sm:p-4">
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

        <JobPostingAnalyzer />

        <div className="rounded-[1.6rem] border border-slate-200 bg-white/85 p-4 shadow-card dark:border-slate-800 dark:bg-slate-950/80 sm:rounded-[1.8rem] sm:p-5">
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
                className="button-primary dark:border-blue-300/20"
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
