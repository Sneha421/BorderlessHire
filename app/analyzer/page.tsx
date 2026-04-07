import { AnalysisLab } from "@/components/analyzer/analysis-lab";

export default function AnalyzerPage() {
  return (
    <main className="page-shell">
      <section className="page-panel shadow-card">
        <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Features 4 and 5 / Analyzer lab
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-ink dark:text-white">
          Analyze postings, then decide whether the role is worth pursuing.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
          The lab combines multimodal extraction, sponsorship heuristics, COMPASS scoring,
          and a final apply recommendation in one workflow.
        </p>
        <div className="mt-6 sm:mt-8">
          <AnalysisLab />
        </div>
      </section>
    </main>
  );
}
