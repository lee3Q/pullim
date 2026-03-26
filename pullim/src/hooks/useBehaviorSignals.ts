"use client";

import { useRef, useCallback } from "react";
import type { BehaviorSignals } from "@/lib/personalization/behavior-reader";

const TREND_WINDOW = 3;

export function useBehaviorSignals() {
  const turnCountRef = useRef(0);
  const lastMessageTimeRef = useRef<number>(0);
  const choiceShownAtRef = useRef<number>(0);
  const choiceChangesRef = useRef(0);

  // 최근 N턴의 기록 (추세 계산용)
  const responseTimes = useRef<number[]>([]);
  const messageLengths = useRef<number[]>([]);

  /** 사용자가 메시지를 보냈을 때 호출 */
  const recordMessage = useCallback((messageText: string) => {
    const now = Date.now();
    turnCountRef.current++;

    const responseTime = lastMessageTimeRef.current > 0
      ? now - lastMessageTimeRef.current
      : 0;
    lastMessageTimeRef.current = now;

    responseTimes.current.push(responseTime);
    messageLengths.current.push(messageText.length);

    // 선택지 변경 카운트 리셋
    const hesitation = choiceShownAtRef.current > 0
      ? now - choiceShownAtRef.current
      : 0;
    const changes = choiceChangesRef.current;
    choiceChangesRef.current = 0;
    choiceShownAtRef.current = 0;

    return {
      responseTimeMs: responseTime,
      choiceHesitationMs: hesitation,
      choiceChanges: changes,
    };
  }, []);

  /** 선택지가 화면에 표시됐을 때 호출 */
  const recordChoiceShown = useCallback(() => {
    choiceShownAtRef.current = Date.now();
    choiceChangesRef.current = 0;
  }, []);

  /** 선택지를 바꿀 때마다 호출 (hover 등) */
  const recordChoiceChange = useCallback(() => {
    choiceChangesRef.current++;
  }, []);

  /** AI 응답이 완료됐을 때 호출 — 다음 응답 시간 측정 시작점 */
  const recordAssistantDone = useCallback(() => {
    lastMessageTimeRef.current = Date.now();
  }, []);

  /** 현재 BehaviorSignals 스냅샷 생성 */
  const getSignals = useCallback((): BehaviorSignals => {
    const times = responseTimes.current;
    const lengths = messageLengths.current;
    const tc = turnCountRef.current;

    const lastTime = times.length > 0 ? times[times.length - 1] : 0;
    const lastLength = lengths.length > 0 ? lengths[lengths.length - 1] : 0;

    return {
      responseTimeMs: lastTime,
      messageLength: lastLength,
      lengthTrend: computeTrend(lengths.slice(-TREND_WINDOW)),
      timeTrend: computeTimeTrend(times.slice(-TREND_WINDOW)),
      choiceHesitationMs: choiceShownAtRef.current > 0
        ? Date.now() - choiceShownAtRef.current
        : 0,
      choiceChanges: choiceChangesRef.current,
      turnCount: tc,
    };
  }, []);

  return {
    recordMessage,
    recordChoiceShown,
    recordChoiceChange,
    recordAssistantDone,
    getSignals,
  };
}

function computeTrend(values: number[]): "shorter" | "stable" | "longer" {
  if (values.length < 2) return "stable";
  const diffs = [];
  for (let i = 1; i < values.length; i++) {
    diffs.push(values[i] - values[i - 1]);
  }
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  if (avgDiff < -10) return "shorter";
  if (avgDiff > 10) return "longer";
  return "stable";
}

function computeTimeTrend(values: number[]): "faster" | "stable" | "slower" {
  if (values.length < 2) return "stable";
  const diffs = [];
  for (let i = 1; i < values.length; i++) {
    diffs.push(values[i] - values[i - 1]);
  }
  const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
  if (avgDiff < -2000) return "faster";
  if (avgDiff > 2000) return "slower";
  return "stable";
}
