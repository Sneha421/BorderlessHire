import { JobCardSkeleton } from "@/components/home/job-card-skeleton";

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-88px)] w-full max-w-7xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
      <section className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-card backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/70 sm:p-6">
        <div className="h-8 w-72 animate-pulse rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <JobCardSkeleton key={index} />
          ))}
        </div>
      </section>
    </main>
  );
}
