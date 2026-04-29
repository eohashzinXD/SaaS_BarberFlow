"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const THEME_STORAGE_KEY = "barber-theme";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof document === "undefined") {
    return "light";
  }

  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
  root.style.colorScheme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setTheme(getInitialTheme());
      setMounted(true);
    });

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== THEME_STORAGE_KEY) {
        return;
      }

      const nextTheme = event.newValue === "dark" ? "dark" : "light";
      setTheme(nextTheme);
      applyTheme(nextTheme);
    };

    window.addEventListener("storage", handleStorage);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = mounted
    ? nextTheme === "dark"
      ? "Ativar modo escuro"
      : "Ativar modo claro"
    : "Alternar tema";

  return (
    <div className="fixed right-4 top-4 z-50">
      <Button
        aria-label={label}
        className="rounded-full border-border/80 bg-card/85 shadow-lg shadow-black/5 backdrop-blur"
        disabled={!mounted}
        onClick={() => {
          applyTheme(nextTheme);
          setTheme(nextTheme);
        }}
        size="icon"
        title={label}
        type="button"
        variant="outline"
      >
        <Sun className="h-4 w-4 scale-100 rotate-0 text-amber-500 transition-all dark:scale-0 dark:-rotate-90" />
        <Moon className="absolute h-4 w-4 scale-0 rotate-90 text-sky-300 transition-all dark:scale-100 dark:rotate-0" />
      </Button>
    </div>
  );
}
