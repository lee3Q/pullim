"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "pullim_settings";

type ThemeMode = "dark" | "light";

interface PullimSettings {
  showRecommendations: boolean;
  spicyMode: boolean;
  showBehindThoughts: boolean;
  themeMode: ThemeMode;
}

const DEFAULTS: PullimSettings = {
  showRecommendations: true,
  spicyMode: false,
  showBehindThoughts: false,
  themeMode: "dark",
};

function applyTheme(mode: ThemeMode) {
  if (typeof document !== "undefined") {
    if (mode === "light") {
      document.documentElement.setAttribute("data-theme", "light");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<PullimSettings>(DEFAULTS);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = { ...DEFAULTS, ...JSON.parse(stored) };
          setSettings(parsed);
          applyTheme(parsed.themeMode);
        }
      } catch {
        // localStorage 실패 무시
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const update = useCallback(
    (patch: Partial<PullimSettings>) => {
      setSettings((prev) => {
        const next = { ...prev, ...patch };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // localStorage 실패 무시
        }
        if (patch.themeMode !== undefined) {
          applyTheme(patch.themeMode);
        }
        return next;
      });
    },
    []
  );

  return { settings, update };
}
