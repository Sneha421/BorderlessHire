"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { ThemeToggle } from "@/components/shared/theme-toggle";

const links = [
  { href: "/", label: "Job Board" },
  { href: "/compass", label: "COMPASS" },
  { href: "/interview", label: "Interview Coach" },
  { href: "/analyzer", label: "Analyzer" }
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

function LogoMark() {
  return (
    <div className="relative flex h-9 w-9 items-center justify-center text-sky-600 dark:text-sky-400">
      <svg
        viewBox="0 0 32 32"
        fill="none"
        className="h-9 w-9"
        aria-hidden="true"
      >
        <circle
          cx="16"
          cy="16"
          r="12"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <ellipse
          cx="16"
          cy="16"
          rx="5"
          ry="12"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
        <line
          x1="4"
          y1="16"
          x2="28"
          y2="16"
          stroke="currentColor"
          strokeWidth="1.5"
        />
        <line
          x1="6"
          y1="10"
          x2="26"
          y2="10"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.6"
        />
        <line
          x1="6"
          y1="22"
          x2="26"
          y2="22"
          stroke="currentColor"
          strokeWidth="1"
          opacity="0.6"
        />
        <path d="M22 8 L26 6 L27 7 L24 10 L22 8Z" fill="currentColor" />
        <path d="M24 10 L26 12 L25 12.5 L23 11 L24 10Z" fill="currentColor" />
      </svg>
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobSearch, setJobSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    setJobSearch(searchParams.get("q") ?? "");
  }, [searchParams]);

  function handleSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = jobSearch.trim();

    router.push(query ? `/?q=${encodeURIComponent(query)}#job-filters` : "/#job-filters");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/88 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/82">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <LogoMark />
          <div className="min-w-0">
            <p className="truncate text-lg font-semibold tracking-tight text-slate-950 dark:text-slate-50">
              Borderless<span className="text-sky-600 dark:text-sky-400">Hire</span>
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <form
            onSubmit={handleSearchSubmit}
            className="hidden items-center gap-2 md:flex"
          >
            <input
              value={jobSearch}
              onChange={(event) => setJobSearch(event.target.value)}
              placeholder="Search jobs"
              className="w-48 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
            <button
              type="submit"
              className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
            >
              Search Jobs
            </button>
          </form>

          <div className="hidden items-center rounded-lg bg-slate-100 p-1 dark:bg-slate-900 sm:flex">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white text-slate-950 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          <ThemeToggle />
        </div>
      </nav>

      <div className="mx-auto space-y-3 px-4 pb-3 sm:hidden sm:px-6 lg:px-10">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            value={jobSearch}
            onChange={(event) => setJobSearch(event.target.value)}
            placeholder="Search jobs"
            className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            Search
          </button>
        </form>

        <div className="flex w-full gap-2">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex-1 rounded-full px-4 py-2 text-center text-sm font-semibold transition ${
                  isActive
                    ? "bg-sky-600 text-white"
                    : "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-200"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
