// 사다리 세션 전용 행동 신호 수집 훅.
// LadderSession에 분산돼 있던 ref/state를 하나로 집약.

import { useRef, useCallback } from "react";
import type { BehaviorSignals } from "@/lib/personalization/behavior-reader";

export interface LadderBehaviorSignalsApi {
  /** 현재 시점 BehaviorSignals 스냅샷 생성 */
  getSignals: (turnCount: number, messageLength: number) => BehaviorSignals;
  /** 선택지가 화면에 뜬 시각 기록 (망설임 측정용) */
  markChoiceStart: () => void;
  /** 사용자가 선택을 바꿨을 때 누적 */
  incChoiceChanges: () => void;
  /** AI 응답이 완료된 시각 기록 (다음 턴 응답시간 측정용) */
  markResponseEnd: () => void;
  /** 사용자 메시지 길이 누적 (트렌드 계산용, 최근 10개 유지) */
  pushMessageLength: (n: number) => void;
  /** 새 턴 시작 시 선택 변경 카운터 리셋 */
  resetTurnState: () => void;
}

function getLengthTrend(lengths: number[]): "shorter" | "stable" | "longer" {
  if (lengths.length < 3) return "stable";
  const recent = lengths.slice(-3);
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prev = lengths.slice(-6, -3);
  if (prev.length === 0) return "stable";
  const prevAvg = prev.reduce((a, b) => a + b, 0) / prev.length;
  if (avg < prevAvg * 0.6) return "shorter";
  if (avg > prevAvg * 1.5) return "longer";
  return "stable";
}

export function useBehaviorSignalsLadder(): LadderBehaviorSignalsApi {
  const lastResponseTime = useRef(0);
  const messageLengths = useRef<number[]>([]);
  const choiceStartTime = useRef(0);
  const choiceChanges = useRef(0);

  const markChoiceStart = useCallback(() => {
    choiceStartTime.current = Date.now();
  }, []);

  const incChoiceChanges = useCallback(() => {
    choiceChanges.current += 1;
  }, []);

  const markResponseEnd = useCallback(() => {
    lastResponseTime.current = Date.now();
  }, []);

  const pushMessageLength = useCallback((n: number) => {
    messageLengths.current.push(n);
    if (messageLengths.current.length > 10) messageLengths.current.shift();
  }, []);

  const resetTurnState = useCallback(() => {
    choiceChanges.current = 0;
  }, []);

  const getSignals = useCallback(
    (turnCount: number, messageLength: number): BehaviorSignals => ({
      responseTimeMs: lastResponseTime.current
        ? Date.now() - lastResponseTime.current
        : 0,
      messageLength,
      lengthTrend: getLengthTrend(messageLengths.current),
      timeTrend: "stable",
      choiceHesitationMs: choiceStartTime.current
        ? Date.now() - choiceStartTime.current
        : 0,
      choiceChanges: choiceChanges.current,
      turnCount,
    }),
    [],
  );

  return {
    getSignals,
    markChoiceStart,
    incChoiceChanges,
    markResponseEnd,
    pushMessageLength,
    resetTurnState,
  };
}
