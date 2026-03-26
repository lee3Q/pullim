"use client";

import { useState, useEffect, useCallback } from "react";
import { getUserId } from "@/lib/user-id";
import type { ProbabilityProfile } from "@/lib/personalization/probability-profile";

interface StoredProfileData {
  profile: ProbabilityProfile;
  sessionCount: number;
  lastSessionAt: string;
  lastSatisfaction: number | null;
  completedSessions: number;
}

const PROFILE_STORAGE_KEY = "pullim_user_profile";
const ONBOARDING_STORAGE_KEY = "pullim_onboarding_done";

/**
 * 사용자 프로필 조회/저장 훅.
 * Supabase 우선, 없으면 localStorage 폴백.
 */
export function useUserProfile() {
  const [profile, setProfile] = useState<ProbabilityProfile | null>(null);
  const [sessionCount, setSessionCount] = useState(0);
  const [lastSatisfaction, setLastSatisfaction] = useState<number | null>(null);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);

  // 프로필 로드
  useEffect(() => {
    const load = async () => {
      const userId = getUserId();
      if (!userId) { setLoading(false); setIsNewUser(true); return; }

      // 온보딩 완료 여부 확인
      const obDone = localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
      setOnboardingDone(obDone);

      // Supabase API 시도
      try {
        const res = await fetch(`/api/profile?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.profile && Object.keys(data.profile).length > 0) {
            setProfile(data.profile);
            setSessionCount(data.sessionCount || 0);
            setLastSatisfaction(data.lastSatisfaction ?? null);
            setCompletedSessions(data.completedSessions || 0);
            setIsNewUser(false);
            setLoading(false);
            return;
          }
        }
      } catch {
        // API 실패 → localStorage 폴백
      }

      // localStorage 폴백
      try {
        const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
        if (stored) {
          const data: StoredProfileData = JSON.parse(stored);
          setProfile(data.profile);
          setSessionCount(data.sessionCount);
          setLastSatisfaction(data.lastSatisfaction);
          setCompletedSessions(data.completedSessions);
          setIsNewUser(false);
          setLoading(false);
          return;
        }
      } catch {
        // parse 실패
      }

      setIsNewUser(true);
      setLoading(false);
    };

    load();
  }, []);

  // 프로필 저장
  const saveProfile = useCallback(async (newProfile: ProbabilityProfile) => {
    const userId = getUserId();
    setProfile(newProfile);
    const newCount = sessionCount + 1;
    setSessionCount(newCount);
    setIsNewUser(false);
    setOnboardingDone(true);

    // 온보딩 완료 표시
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch { /* ignore */ }

    const data: StoredProfileData = {
      profile: newProfile,
      sessionCount: newCount,
      lastSessionAt: new Date().toISOString(),
      lastSatisfaction: lastSatisfaction,
      completedSessions,
    };

    // localStorage에 항상 저장 (폴백)
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
    } catch { /* ignore */ }

    // Supabase API 시도
    try {
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, profile: newProfile, sessionCount: newCount }),
      });
    } catch { /* ignore */ }
  }, [sessionCount, lastSatisfaction, completedSessions]);

  // 프로필 업데이트 (기존 프로필에 병합)
  const updateProfile = useCallback(async (updates: Partial<ProbabilityProfile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates };
    await saveProfile(updated);
  }, [profile, saveProfile]);

  // 만족도 저장
  const saveSatisfaction = useCallback(async (score: number | null) => {
    setLastSatisfaction(score);
    const newCompleted = completedSessions + 1;
    setCompletedSessions(newCompleted);
    const userId = getUserId();

    // localStorage 갱신
    try {
      const stored = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const data: StoredProfileData = JSON.parse(stored);
        data.lastSatisfaction = score;
        data.completedSessions = newCompleted;
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(data));
      }
    } catch { /* ignore */ }

    // Supabase에 세션 요약 저장
    try {
      await fetch("/api/session-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          theme: profile?.selectedTheme || "adventure",
          satisfactionScore: score,
          completed: true,
        }),
      });
    } catch { /* ignore */ }
  }, [completedSessions, profile]);

  return {
    profile,
    sessionCount,
    lastSatisfaction,
    completedSessions,
    loading,
    isNewUser,
    onboardingDone,
    saveProfile,
    updateProfile,
    saveSatisfaction,
  };
}
