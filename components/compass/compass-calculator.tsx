"use client";

import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";

import { getCompanyNames } from "@/lib/company-intelligence";
import {
  occupationBenchmarks,
  type CompassInput,
  type OccupationKey,
  type QualificationTier
} from "@/lib/compass";
import {
  readSavedCompassResults,
  saveCompassResult,
  type SavedCompassResult
} from "@/lib/local-storage";

type CompassResponse = {
  totalScore: number;
  threshold: number;
  eligible: boolean;
  benchmarkSalary: number;
  breakdown: Record<
    "salary" | "qualifications" | "diversity" | "localEmployment",
    {
      label: string;
      score: number;
      maxScore: number;
      summary: string;
    }
  >;
  recommendations: string[];
  advice: {
    headline: string;
    whatToImprove: string[];
    recruiterTalkingPoints: string[];
  };
};

const qualificationOptions: QualificationTier[] = [
  "Top-tier global university",
  "Recognized university",
  "Emerging university",
  "No degree / unclear"
];

const diversityOptions = [
  "Highly diverse",
  "Balanced",
  "Moderately concentrated",
  "Concentrated"
] as const;

const localEmploymentOptions = [
  "Strong local PMET support",
  "Balanced local PMET support",
  "Mixed local PMET support",
  "Weak local PMET support"
] as const;

const companies = getCompanyNames();

export function CompassCalculator() {
  const [form, setForm] = useState<CompassInput>({
    targetCompany: "",
    occupation: "Software engineering",
    monthlySalary: occupationBenchmarks["Software engineering"],
    qualificationTier: "Recognized university",
    diversityBand: "Balanced",
    localEmploymentBand: "Balanced local PMET support"
  });
  const [result, setResult] = useState<CompassResponse | null>(null);
  const [recentScores, setRecentScores] = useState<SavedCompassResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deferredCompany = useDeferredValue(form.targetCompany || "");

  useEffect(() => {
    setRecentScores(readSavedCompassResults());
  }, []);

  const benchmark = useMemo(
    () => occupationBenchmarks[form.occupation],
    [form.occupation]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/compass", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as CompassResponse | { error: string };

      if (!response.ok || "error" in payload) {
        throw new Error("error" in payload ? payload.error : "Unable to calculate score.");
      }

      setResult(payload);

      startTransition(() => {
        setRecentScores(
          saveCompassResult({
            id: `${form.targetCompany || "generic"}-${form.occupation}-${form.monthlySalary}`,
            occupation: form.occupation,
            targetCompany: form.targetCompany || "General employer",
            monthlySalary: form.monthlySalary,
            totalScore: payload.totalScore,
            eligible: payload.eligible,
            savedAt: new Date().toISOString()
          })
        );
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to calculate score.");
    } finally {
      setIsLoading(false);
    }
  }

  function updateField<Key extends keyof CompassInput>(field: Key, value: CompassInput[Key]) {
    setForm((current) => ({
      ...current,
      [field]: value
    }));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="space-y-5">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:p-5">
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Calculator brief
          </p>
          <p className="mt-3 text-2xl font-semibold text-ink dark:text-white">
            Max 60 points, threshold 40.
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            Salary and local PMET support carry the most weight, so weak offers are hard to rescue
            with brand name alone.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-slate-950 p-4 text-white dark:border-slate-800 sm:p-5">
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-400">
            Selected benchmark
          </p>
          <p className="mt-3 text-3xl font-semibold">SGD {benchmark.toLocaleString()}</p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Current occupation benchmark for <span className="text-white">{form.occupation}</span>
            {deferredCompany ? ` at ${deferredCompany}` : ""}.
          </p>
        </div>

        <div className="rounded-[1.75rem] border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/80 sm:p-5">
          <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
            Saved scores
          </p>
          <div className="mt-4 space-y-3">
            {recentScores.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Calculated COMPASS snapshots will stay here in localStorage.
              </p>
            ) : (
              recentScores.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="text-sm font-semibold text-ink dark:text-white">{item.targetCompany}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                    {item.occupation}
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    {item.totalScore}/60 · {item.eligible ? "Eligible" : "Below threshold"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <section className="rounded-[1.8rem] border border-slate-200 bg-white/85 p-4 shadow-card dark:border-slate-800 dark:bg-slate-950/80 sm:rounded-[2rem] sm:p-6">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Target company</span>
              <select
                value={form.targetCompany}
                onChange={(event) => updateField("targetCompany", event.target.value)}
                className="ui-select rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="">General estimate</option>
                {companies.map((company) => (
                  <option key={company} value={company}>
                    {company}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Occupation</span>
              <select
                value={form.occupation}
                onChange={(event) => updateField("occupation", event.target.value as OccupationKey)}
                className="ui-select rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {Object.keys(occupationBenchmarks).map((occupation) => (
                  <option key={occupation} value={occupation}>
                    {occupation}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Monthly salary (SGD)</span>
              <input
                type="number"
                min={2500}
                step={100}
                value={form.monthlySalary}
                onChange={(event) => updateField("monthlySalary", Number(event.target.value))}
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Qualification tier</span>
              <select
                value={form.qualificationTier}
                onChange={(event) =>
                  updateField("qualificationTier", event.target.value as QualificationTier)
                }
                className="ui-select rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {qualificationOptions.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Nationality diversity</span>
              <select
                value={form.diversityBand}
                onChange={(event) => updateField("diversityBand", event.target.value as CompassInput["diversityBand"])}
                className="ui-select rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {diversityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Local PMET support</span>
              <select
                value={form.localEmploymentBand}
                onChange={(event) =>
                  updateField(
                    "localEmploymentBand",
                    event.target.value as CompassInput["localEmploymentBand"]
                  )
                }
                className="rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                {localEmploymentOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {error ? <span className="text-rose-600 dark:text-rose-300">{error}</span> : "Server returns a structured JSON score breakdown and targeted improvement advice."}
            </p>
            <button
              type="submit"
              disabled={isLoading}
              className="button-primary"
            >
              {isLoading ? "Calculating..." : "Run COMPASS Check"}
            </button>
          </div>
        </form>

        {result ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900">
              <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
                Result
              </p>
              <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-semibold text-ink dark:text-white">
                    {result.totalScore}/60
                  </p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                    Threshold: {result.threshold} · {result.eligible ? "Eligible" : "Borderline / below threshold"}
                  </p>
                </div>
                <div className={`rounded-full px-4 py-2 text-sm font-semibold ${result.eligible ? "bg-emerald-100 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-200" : "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"}`}>
                  {result.advice.headline}
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {Object.values(result.breakdown).map((dimension) => (
                <div
                  key={dimension.label}
                  className="rounded-[1.5rem] border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
                >
                  <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                    {dimension.label}
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-ink dark:text-white">
                    {dimension.score}/{dimension.maxScore}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {dimension.summary}
                  </p>
                </div>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-slate-200 bg-blue-50/80 p-5 dark:border-slate-800 dark:bg-blue-500/10">
                <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">
                  What to improve
                </p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {result.advice.whatToImprove.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Recruiter talking points
                </p>
                <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-200">
                  {result.advice.recruiterTalkingPoints.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
