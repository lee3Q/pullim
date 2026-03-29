"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "pullim_settings";

interface PullimSettings {
  showRecommendations: boolean;
  spicyMode: boolean;
  showBehindThoughts: boolean;
}

const DEFAULTS: PullimSettings = {
  showRecommendations: true,
  spicyMode: false,
  showBehindThoughts: false,
};

export function useSettings() {
  const [settings, setSettings] = useState<PullimSettings>(DEFAULTS);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...DEFAULTS, ...JSON.parse(stored) });
      }
    } catch {
      // localStorage 실패 무시
    }
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
        return next;
      });
    },
    []
  );

  return { settings, update };
}
