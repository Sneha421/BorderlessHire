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
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-[linear-gradient(90deg,rgba(241,245,249,0.92),rgba(219,234,254,0.88),rgba(241,245,249,0.92))] shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-800/80 dark:bg-[linear-gradient(90deg,rgba(8,15,32,0.94),rgba(14,30,58,0.92),rgba(8,15,32,0.94))] dark:shadow-[0_10px_30px_rgba(2,6,23,0.45)]">
      <nav className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-5 lg:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
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
            className="hidden items-center gap-2 lg:flex"
          >
            <input
              value={jobSearch}
              onChange={(event) => setJobSearch(event.target.value)}
              placeholder="Search jobs"
              className="w-44 rounded-full border border-slate-300/80 bg-white/85 px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900/85 dark:text-white"
            />
            <button
              type="submit"
              className="button-primary"
            >
              Search Jobs
            </button>
          </form>

          <div className="hidden items-center rounded-full border border-slate-200/80 bg-white/70 p-1 backdrop-blur md:flex dark:border-slate-700/80 dark:bg-slate-900/70">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
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

      <div className="mx-auto max-w-[1600px] space-y-3 px-4 pb-3 md:hidden sm:px-5">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <input
            value={jobSearch}
            onChange={(event) => setJobSearch(event.target.value)}
            placeholder="Search jobs"
            className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-sky-400 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
          <button
            type="submit"
            className="button-primary"
          >
            Search
          </button>
        </form>

        <div className="grid w-full grid-cols-2 gap-2">
          {links.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/" && pathname.startsWith(link.href));

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-center text-sm font-semibold transition ${
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
