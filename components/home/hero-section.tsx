import Link from "next/link";

type HeroSectionProps = {
  featuredCount: number;
  totalJobs: number;
};

export function HeroSection({ featuredCount, totalJobs }: HeroSectionProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.45rem] border border-slate-200/70 bg-[#061428] text-white shadow-card dark:border-slate-800 sm:rounded-[1.8rem]">
      <div className="absolute inset-0">
        <video
          src="/hero-world.mp4"
          className="h-full w-full object-cover object-center opacity-50"
          autoPlay
          loop
          playsInline
          controls
          preload="auto"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_left,rgba(8,47,73,0.28),transparent_34%),linear-gradient(90deg,rgba(2,6,23,0.92)_0%,rgba(2,6,23,0.76)_44%,rgba(2,6,23,0.32)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(14,165,233,0.06),transparent_28%,rgba(245,158,11,0.04)_100%)]" />
      </div>

      <div className="relative grid min-h-[30rem] gap-8 px-4 py-8 sm:px-5 sm:py-10 lg:grid-cols-[1.05fr_0.95fr] lg:px-6 lg:py-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center rounded-full border border-sky-400/30 bg-sky-400/10 px-4 py-2 font-[family:var(--font-mono)] text-[11px] uppercase tracking-[0.28em] text-sky-100">
            Verified sponsorship intelligence
          </div>
          <h1 className="mt-5 text-3xl font-bold leading-tight tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Find companies that <span className="text-sky-300">actually sponsor</span>{" "}
            work passes in Singapore.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
            BorderlessHire helps international students focus on realistic pathways.
            Use sponsor-aware filters, compare directional COMPASS upside, and move
            straight into company-specific interview practice.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="#job-filters"
              className="button-primary"
            >
              Explore Jobs
            </a>
            <Link
              href="/interview"
              className="button-primary"
            >
              Open Interview Coach
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-5">
            <div>
              <div className="text-2xl font-bold text-sky-300">{totalJobs}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                Curated roles
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">{featuredCount}</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                High sponsors
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-white">20</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                Max COMPASS pts
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-300">2-in-1</div>
              <div className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-400">
                Search + coach
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-end lg:justify-end">
          <div className="w-full max-w-md rounded-[1.6rem] border border-white/10 bg-slate-950/45 p-5 backdrop-blur-md sm:rounded-[1.75rem]">
            <p className="font-[family:var(--font-mono)] text-xs uppercase tracking-[0.24em] text-slate-300">
              Why this view works
            </p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Sponsorship likelihood is surfaced first, not buried behind a click.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Salary and COMPASS estimates are visible before you spend time applying.
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Every job hands off directly into interview prep for that employer.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
