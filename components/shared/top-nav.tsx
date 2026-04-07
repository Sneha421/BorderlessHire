"use client";

import Link from "next/link";
import type { Route } from "next";
import { usePathname } from "next/navigation";

import { ThemeToggle } from "@/components/shared/theme-toggle";

const links = [
  { href: "/", label: "Job Board" },
  { href: "/interview", label: "Interview Coach" }
] as const satisfies ReadonlyArray<{ href: Route; label: string }>;

function LogoMark() {
  return (
    <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-sky-500 via-blue-600 to-cyan-400 text-white shadow-lg shadow-blue-500/25">
      <div className="absolute inset-[7px] rounded-full border border-white/60" />
      <div className="absolute left-[7px] top-[12px] h-1.5 w-5 rounded-full bg-white/90" />
      <div className="absolute left-[20px] top-[8px] h-0 w-0 border-b-[5px] border-l-[8px] border-b-transparent border-l-white/95 border-t-[5px] border-t-transparent" />
      <div className="absolute right-[3px] top-[3px] h-7 w-7 rounded-full border border-dashed border-white/55" />
    </div>
  );
}

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75">
      <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-10">
        <Link href="/" className="flex min-w-0 items-center gap-3">
          <LogoMark />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-950 dark:text-slate-50">
              BorderlessHire
            </p>
            <p className="truncate font-[family:var(--font-mono)] text-[10px] uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              Singapore career navigation
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <div className="hidden items-center rounded-full border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/90 sm:flex">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    isActive
                      ? "bg-white text-sky-700 shadow-sm dark:bg-slate-800 dark:text-sky-300"
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

      <div className="mx-auto flex w-full max-w-7xl gap-2 px-4 pb-3 sm:hidden sm:px-6 lg:px-10">
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
    </header>
  );
}
