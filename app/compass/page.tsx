import { CompassCalculator } from "@/components/compass/compass-calculator";

export default function CompassPage() {
  return (
    <main className="page-shell">
      <section className="page-panel shadow-card">
        <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Feature 2 / COMPASS calculator
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-ink dark:text-white">
          Estimate EP eligibility with a full 60-point COMPASS breakdown.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Model the salary, qualification, workforce diversity, and local-employment
          dimensions in one place, then save the result locally for later comparison.
        </p>
        <div className="mt-6 sm:mt-8">
          <CompassCalculator />
        </div>
      </section>
    </main>
  );
}
