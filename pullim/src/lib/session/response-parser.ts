// LLM 스트리밍 응답에서 레벨별 구조화 데이터 추출

import type {
  LadderOption,
  AnalysisCard,
  ComparisonCard,
  SensoryCard,
} from "./ladder-types";

export interface ParsedResponse {
  text: string; // 태그 제거된 순수 텍스트
  options: LadderOption[];
  analysisCard: AnalysisCard | null;
  comparisonCards: [ComparisonCard, ComparisonCard] | null;
  sensoryCards: SensoryCard[];
  hasCheat: boolean;
  cheatText: string;
  wrapSuggest: boolean;
  listenComplete: boolean;
  summary: string | null;
}

let idCounter = 0;
function nextId(): string {
  return `opt_${++idCounter}`;
}

export function parseResponse(raw: string): ParsedResponse {
  const result: ParsedResponse = {
    text: raw,
    options: [],
    analysisCard: null,
    comparisonCards: null,
    sensoryCards: [],
    hasCheat: false,
    cheatText: "",
    wrapSuggest: false,
    listenComplete: false,
    summary: null,
  };

  // [OPTIONS] 파싱
  const optMatch = raw.match(/\[OPTIONS\]([\s\S]*?)\[\/OPTIONS\]/);
  if (optMatch) {
    const lines = optMatch[1].trim().split("\n").filter((l) => l.trim());
    result.options = lines.map((line) => {
      const trimmed = line.trim();
      const isRecommended = trimmed.includes("[추천]");
      const isFallback = /모르겠|잘 모르|글쎄/.test(trimmed);
      const cleaned = trimmed.replace("[추천]", "").trim();
      // 이모지 분리
      const emojiMatch = cleaned.match(/^(\p{Emoji_Presentation}|\p{Emoji}\uFE0F?)\s*/u);
      const emoji = emojiMatch ? emojiMatch[1] : "💭";
      const text = emojiMatch ? cleaned.slice(emojiMatch[0].length) : cleaned;

      return {
        id: nextId(),
        emoji,
        text,
        isRecommended,
        isFallback,
      };
    });
  }

  // [CHEAT] 파싱
  const cheatMatch = raw.match(/\[CHEAT\]([\s\S]*?)\[\/CHEAT\]/);
  if (cheatMatch) {
    result.hasCheat = true;
    result.cheatText = cheatMatch[1].trim();
  }

  // [ANALYSIS] 파싱
  const analysisMatch = raw.match(/\[ANALYSIS\]([\s\S]*?)\[\/ANALYSIS\]/);
  if (analysisMatch) {
    const block = analysisMatch[1];
    const technique = block.match(/technique:\s*(.+)/)?.[1]?.trim() || "";
    const content = block.match(/content:\s*([\s\S]*?)(?=\n\w|$)/)?.[1]?.trim() || "";
    result.analysisCard = { technique, analysis: content };
  }

  // [COMPARISON] 파싱
  const compMatch = raw.match(/\[COMPARISON\]([\s\S]*?)\[\/COMPARISON\]/);
  if (compMatch) {
    const block = compMatch[1];
    const aEmoji = block.match(/A_emoji:\s*(.+)/)?.[1]?.trim() || "🅰️";
    const aTitle = block.match(/A_title:\s*(.+)/)?.[1]?.trim() || "";
    const aDesc = block.match(/A_desc:\s*(.+)/)?.[1]?.trim() || "";
    const bEmoji = block.match(/B_emoji:\s*(.+)/)?.[1]?.trim() || "🅱️";
    const bTitle = block.match(/B_title:\s*(.+)/)?.[1]?.trim() || "";
    const bDesc = block.match(/B_desc:\s*(.+)/)?.[1]?.trim() || "";

    result.comparisonCards = [
      { emoji: aEmoji, title: aTitle, description: aDesc },
      { emoji: bEmoji, title: bTitle, description: bDesc },
    ];
  }

  // [SENSORY] 파싱
  const sensoryMatch = raw.match(/\[SENSORY\]([\s\S]*?)\[\/SENSORY\]/);
  if (sensoryMatch) {
    const lines = sensoryMatch[1].trim().split("\n").filter((l) => l.trim());
    result.sensoryCards = lines.map((line) => {
      const parts = line.trim().split("|");
      return {
        id: nextId(),
        emoji: parts[0]?.trim() || "✨",
        label: parts[1]?.trim() || "",
      };
    });
  }

  // [WRAP_SUGGEST] 파싱
  result.wrapSuggest = raw.includes("[WRAP_SUGGEST]");

  // [LISTEN_COMPLETE] 파싱
  result.listenComplete = raw.includes("[LISTEN_COMPLETE]");

  // [SUMMARY] 파싱
  const summaryMatch = raw.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  }

  // 텍스트에서 태그 제거 — 완전/불완전 둘 다
  result.text = raw
    // 1. 닫힌 태그 블록 제거 (알려진 것 + 와일드카드)
    .replace(/\[OPTIONS\][\s\S]*?\[\/OPTIONS\]/g, "")
    .replace(/\[CHEAT\][\s\S]*?\[\/CHEAT\]/g, "")
    .replace(/\[ANALYSIS\][\s\S]*?\[\/ANALYSIS\]/g, "")
    .replace(/\[COMPARISON\][\s\S]*?\[\/COMPARISON\]/g, "")
    .replace(/\[SENSORY\][\s\S]*?\[\/SENSORY\]/g, "")
    .replace(/\[WRAP_SUGGEST\][\s\S]*?(\[\/WRAP_SUGGEST\]|$)/g, "")
    .replace(/\[LISTEN_COMPLETE\]/g, "")
    .replace(/\[SUMMARY\][\s\S]*?\[\/SUMMARY\]/g, "")
    // 2. behind/feedback/prior session/initial state 같은 내부 전용 블록이 출력될 경우 방어
    .replace(/\[BEHIND_THE_SCENES\][\s\S]*?\[\/BEHIND_THE_SCENES\]/g, "")
    .replace(/\[USER_FEEDBACK_HISTORY\][\s\S]*?\[\/USER_FEEDBACK_HISTORY\]/g, "")
    .replace(/\[PRIOR_SESSION_CONTEXT\][\s\S]*?\[\/PRIOR_SESSION_CONTEXT\]/g, "")
    .replace(/\[INITIAL_STATE_WORD\][\s\S]*?\[\/INITIAL_STATE_WORD\]/g, "")
    .replace(/\[SENSORY_LADDER\][\s\S]*?\[\/SENSORY_LADDER\]/g, "")
    .replace(/\[LADDER_LEVEL\][\s\S]*?\[\/LADDER_LEVEL\]/g, "")
    .replace(/\[SESSION_END_DETECTION\][\s\S]*?\[\/SESSION_END_DETECTION\]/g, "")
    .replace(/\[POOL_MEANING_CONTEXT\][\s\S]*?\[\/POOL_MEANING_CONTEXT\]/g, "")
    .replace(/\[LIGHT_MODE\][\s\S]*?\[\/LIGHT_MODE\]/g, "")
    .replace(/\[PROMISE_CONTEXT\][\s\S]*?\[\/PROMISE_CONTEXT\]/g, "")
    // 3. 미지의 대문자 태그 블록 포괄 제거 (닫힌 것만)
    .replace(/\[[A-Z][A-Z_]*\][\s\S]*?\[\/[A-Z][A-Z_]*\]/g, "")
    // 4. 닫히지 않은 대문자 태그 시작 이후 전부 제거 (스트리밍 잔재)
    .replace(/\[\/?[A-Z][A-Z_]*\]?[\s\S]*$/, "")
    // 5. HTML 태그 제거 (<option>, </option> 등 LLM이 간혹 출력)
    .replace(/<[^>]+>/g, "")
    // 6. 구조화 키-값 제거 (A_emoji:, B_title:, technique: 등)
    .replace(/^[A-Z]_\w+:.*$/gm, "")
    .replace(/^(technique|content):\s*.*$/gim, "")
    // 7. 괄호만 남은 잔재 정리 ([추천], [CRYSTALS] 등 단독)
    .replace(/\[[A-Za-z_]+\]/g, "")
    // 8. 연속 빈 줄 정리
    .replace(/\n{3,}/g, "\n\n")
    // 9. 양 끝 공백/줄바꿈 정리
    .trim();

  return result;
}
