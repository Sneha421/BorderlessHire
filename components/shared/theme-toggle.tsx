"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const nextIsDark = document.documentElement.classList.contains("dark");
    setIsDark(nextIsDark);
    setMounted(true);
  }, []);

  function toggleTheme() {
    const nextIsDark = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", nextIsDark);
    window.localStorage.setItem(
      "borderlesshire-theme",
      nextIsDark ? "dark" : "light"
    );
    setIsDark(nextIsDark);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center rounded-full border border-slate-300/80 bg-white/80 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-100"
      aria-label="Toggle dark mode"
    >
      {mounted && isDark ? "Light mode" : "Dark mode"}
    </button>
  );
}
