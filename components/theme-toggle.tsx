"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const storageKey = "mercado-ar-theme";

function getPreferredTheme() {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(storageKey);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: "dark" | "light") {
  document.documentElement.classList.toggle("dark", theme === "dark");
  window.localStorage.setItem(storageKey, theme);
  window.dispatchEvent(new CustomEvent("themechange", { detail: theme }));
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const isDark = theme === "dark";

  useEffect(() => {
    const preferredTheme = getPreferredTheme() as "dark" | "light";
    setTheme(preferredTheme);
    applyTheme(preferredTheme);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const nextTheme = isDark ? "light" : "dark";
        setTheme(nextTheme);
        applyTheme(nextTheme);
      }}
      className="inline-flex h-9 items-center gap-2 rounded border border-line bg-panel px-2 text-xs font-semibold uppercase text-ink transition hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
      aria-label={isDark ? "Activar modo claro" : "Activar modo nocturno"}
      aria-pressed={isDark}
      title={isDark ? "Modo claro" : "Modo nocturno"}
    >
      {isDark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
      <span>{isDark ? "Claro" : "Nocturno"}</span>
    </button>
  );
}
