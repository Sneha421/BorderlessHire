import { InterviewCoach } from "@/components/interview/interview-coach";

type InterviewPageProps = {
  searchParams?: {
    company?: string;
  };
};

export default function InterviewPage({ searchParams }: InterviewPageProps) {
  const company = searchParams?.company ?? "";

  return (
    <main className="page-shell">
      <section className="page-panel shadow-card">
        <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
          Feature 2 / Interview practice
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight text-ink dark:text-white">
          Practice for {company || "your target company"} with a pre-filled interview setup.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 dark:text-slate-300">
          Rehearse first-round questions, stress-test visa and salary conversations,
          and switch into a voice interview where Sarah Lim speaks, listens, and
          pushes back like a real Singapore interviewer. If you arrived from the job
          board, the company context is already pre-filled.
        </p>
        <div className="mt-6 sm:mt-8">
          <InterviewCoach company={company} />
        </div>
      </section>
    </main>
  );
}
