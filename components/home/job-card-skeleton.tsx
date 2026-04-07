export function JobCardSkeleton() {
  return (
    <article className="animate-pulse rounded-[1.75rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="flex-1 space-y-3">
          <div className="flex gap-2">
            <div className="h-6 w-24 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-7 w-3/4 rounded-full bg-slate-200 dark:bg-slate-800" />
          <div className="h-5 w-1/2 rounded-full bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/70" />
        <div className="h-24 rounded-2xl bg-slate-100 dark:bg-slate-800/70" />
      </div>
      <div className="mt-5 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800/70" />
      <div className="mt-6 flex gap-3">
        <div className="h-11 w-40 rounded-full bg-slate-200 dark:bg-slate-800" />
        <div className="h-11 w-32 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
    </article>
  );
}
