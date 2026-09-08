"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "pullim_ad_state";

interface AdState {
  sessionsCompleted: number;
  lastAdShown: string;
  adFreeUntil: string | null;
}

const DEFAULT_STATE: AdState = {
  sessionsCompleted: 0,
  lastAdShown: "",
  adFreeUntil: null,
};

function loadAdState(): AdState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_STATE, ...JSON.parse(stored) };
    }
  } catch {
    // localStorage 실패 무시
  }
  return { ...DEFAULT_STATE };
}

function saveAdState(state: AdState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage 실패 무시
  }
}

export function useAdGate() {
  const [adState, setAdState] = useState<AdState>(DEFAULT_STATE);

  useEffect(() => {
    setAdState(loadAdState());
  }, []);

  const adsEnabled = process.env.NEXT_PUBLIC_ENABLE_ADS === "true";

  const shouldShowAd = (() => {
    if (!adsEnabled) return false;
    // 첫 세션은 광고 제외
    if (adState.sessionsCompleted === 0) return false;
    // adFreeUntil이 미래면 스킵 (유료 구독)
    if (adState.adFreeUntil && new Date(adState.adFreeUntil) > new Date()) {
      return false;
    }
    return true;
  })();

  const sessionsUntilAd = adState.sessionsCompleted === 0 ? 1 : 0;

  const markAdShown = useCallback(() => {
    setAdState((prev) => {
      const next: AdState = {
        ...prev,
        sessionsCompleted: prev.sessionsCompleted + 1,
        lastAdShown: new Date().toISOString(),
      };
      saveAdState(next);
      return next;
    });
  }, []);

  return { shouldShowAd, markAdShown, sessionsUntilAd };
}
