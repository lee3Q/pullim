// 시간 리듬 컨텍스트 — 하루의 때에 따라 풀림의 톤이 달라진다.
//
// 철학 근거:
// - 극한의 적응형: "피곤해? 내일 하자"는 시간을 아는 존재의 배려.
// - 밤 12시의 대화와 아침 9시의 대화는 같은 톤일 수 없다.
// - 단순 시계 표시가 아니라, AI 톤/턴 길이/질문 스타일에 영향.

export type DayBand =
  | "deep_night"    // 00:00 - 04:59 — 잠 못 드는 시간
  | "dawn"          // 05:00 - 07:59 — 새벽
  | "morning"       // 08:00 - 11:59 — 아침
  | "midday"        // 12:00 - 14:59 — 한낮
  | "afternoon"     // 15:00 - 17:59 — 오후
  | "evening"       // 18:00 - 21:59 — 저녁
  | "late_night";   // 22:00 - 23:59 — 늦은 밤

export function getDayBand(date: Date = new Date()): DayBand {
  const h = date.getHours();
  if (h < 5) return "deep_night";
  if (h < 8) return "dawn";
  if (h < 12) return "morning";
  if (h < 15) return "midday";
  if (h < 18) return "afternoon";
  if (h < 22) return "evening";
  return "late_night";
}

const BAND_GUIDES: Record<DayBand, { label: string; tone: string[] }> = {
  deep_night: {
    label: "깊은 밤 (00~05시)",
    tone: [
      "사용자가 잠 못 드는 시간에 왔다. 이유가 있다.",
      "- 목소리 낮추고 아주 짧게. 질문 1개 이상 하지 마라.",
      "- '자라'고 하지 마라. 판단 금지.",
      "- 감각 레벨(1~2) 위주. 분석 들이밀지 마라.",
      "- 필요하면 세션을 일찍 마무리 신호로.",
    ],
  },
  dawn: {
    label: "새벽 (05~08시)",
    tone: [
      "새벽. 어젯밤부터 못 잤을 수도, 일찍 일어났을 수도.",
      "- 부드럽게, 판단 유보. 그 시간에 온 이유는 곧 드러난다.",
      "- 짧은 감각 중심. 너무 활기차지 마라.",
    ],
  },
  morning: {
    label: "아침 (08~12시)",
    tone: [
      "아침. 대체로 시작·결정 모드.",
      "- 조금 더 명료하게, 또렷한 질문.",
      "- 단, 지쳐있는 신호(turnCount 대비 messageLength 짧음)면 즉시 톤 낮춰라.",
    ],
  },
  midday: {
    label: "한낮 (12~15시)",
    tone: [
      "한낮. 식후·업무 중 잠깐 방문 가능.",
      "- 압축된 대화. 3~5턴 내에 실용적 물음 하나라도.",
      "- 가볍게만 모드에 자연스럽게 맞춘다.",
    ],
  },
  afternoon: {
    label: "오후 (15~18시)",
    tone: [
      "오후. 집중력이 흔들리는 구간.",
      "- 작은 실행 단위로 유도 ('오늘 한 가지만 해본다면').",
    ],
  },
  evening: {
    label: "저녁 (18~22시)",
    tone: [
      "저녁. 풀림이 가장 자주 열리는 시간대.",
      "- 하루 돌아보기·다음 약속에 적합.",
      "- 평상시 톤. 깊이 들어가도 됨.",
    ],
  },
  late_night: {
    label: "늦은 밤 (22~24시)",
    tone: [
      "늦은 밤. 하루가 마무리되는 시간.",
      "- 자극적 분석 금지. 정리·위로 중심.",
      "- '오늘은 여기까지도 충분해' 느낌을 자연스럽게.",
    ],
  },
};

export function buildTimeRhythmContext(date: Date = new Date()): string {
  const band = getDayBand(date);
  const guide = BAND_GUIDES[band];
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  return [
    "[TIME_RHYTHM]",
    `현재 시간: ${hh}:${mm} — ${guide.label}`,
    ...guide.tone,
    "단, 시간 자체를 사용자에게 직접 언급하지 마라. 톤으로만 반영.",
    "[/TIME_RHYTHM]",
  ].join("\n");
}
