import { InterviewCoach } from "@/components/interview/interview-coach";

type InterviewPageProps = {
  searchParams?: {
    company?: string;
  };
};

export default function InterviewPage({ searchParams }: InterviewPageProps) {
  const company = searchParams?.company ?? "";

  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl items-start px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <section className="w-full rounded-[2rem] border border-white/70 bg-white/80 p-5 shadow-card backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 sm:p-8">
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
        <div className="mt-8">
          <InterviewCoach company={company} />
        </div>
      </section>
    </main>
  );
}
