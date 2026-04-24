// 세션 진입 시 프롬프트 합성 — LadderSessionPage에서 분리.
//
// 역할: 여러 context source를 일관된 순서로 합치고, LLM 오염 방지용 sanitize.

import type { ProbabilityProfile } from "@/lib/personalization/probability-profile";
import { buildSensoryLadderContext } from "@/lib/personalization/sensory-ladder";
import { getUnfinishedTrail, trailToPromptContext, consumeTrailOnResume } from "./session-trail";

export interface EntryPromptParams {
  profile: ProbabilityProfile | null;
  isResume: boolean;
  seedWord: string;
  isLightMode: boolean;
}

export function buildEntryProfileContext(params: EntryPromptParams): string | undefined {
  const { profile, isResume, seedWord, isLightMode } = params;
  const parts: string[] = [];

  const base = profile ? buildSensoryLadderContext(profile) : "";
  if (base) parts.push(base);

  if (isResume) {
    const trail = getUnfinishedTrail();
    if (trail) {
      parts.push(trailToPromptContext(trail));
      consumeTrailOnResume();
    }
  }

  if (seedWord) {
    const sanitized = seedWord.slice(0, 24).replace(/[\r\n<>]/g, "").trim();
    if (sanitized) {
      parts.push(
        [
          "[INITIAL_STATE_WORD]",
          `사용자가 홈에서 지금 상태를 한 단어로 표현했다: "${sanitized}"`,
          "이 단어를 진지하게 받아들여라. 첫 AI 응답에서 이 감각을 자연스럽게 반영하라.",
          `단, "아, ${sanitized}구나" 같은 복창은 하지 마라. 이미 표현된 걸 정리만 해주면 안 된다.`,
          "대신 이 감각이 어디서 왔는지, 어떤 느낌에 더 가까운지 감각 선택지로 물어라.",
          "[/INITIAL_STATE_WORD]",
        ].join("\n"),
      );
    }
  }

  if (isLightMode) {
    parts.push(
      [
        "[LIGHT_MODE]",
        "사용자는 오늘 가볍게만 시작했다.",
        "- 깊이 파고들지 마라. 표면의 감각 한두 개만 건드린다.",
        "- 3~5턴 내로 자연스럽게 마무리 신호([WRAP_SUGGEST])를 보여라.",
        "- 분석 레벨(3)로 올라가지 마라. 감각(1~2)에서 맴돌다 마무리.",
        "- 마무리도 거창하게 하지 말고 '오늘은 여기까지도 충분해' 톤으로.",
        "[/LIGHT_MODE]",
      ].join("\n"),
    );
  }

  return parts.length > 0 ? parts.join("\n\n") : undefined;
}
