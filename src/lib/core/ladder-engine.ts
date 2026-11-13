import type { LadderLevel, BehindEvent } from "../session/ladder-types.ts";
import { inferStateSync, describeBehindInference, type BehindInference } from "../session/behind-the-scenes.ts";
import {
  createEmptyProfile,
  updateProfileFromSelection,
  updateRecommendationRate,
  type ProbabilityProfile,
  type DimensionKey,
} from "../personalization/probability-profile.ts";
import {
  unravelConcern,
  detectBreakthroughInsight,
  type PerspectiveLensId,
  type UnravelResult,
  type BreakthroughCheck,
} from "./unravel-engine.ts";

export interface LadderOptionItem {
  id: string;
  label: string;
  subtext: string;
  recommended: boolean;
  dimension: DimensionKey;
  signal: -1 | 1;
}

export interface LadderStepCard {
  level: LadderLevel;
  levelName: string;
  direction: "up" | "down";
  lens: PerspectiveLensId;
  flipCount: number;
  question: string;
  helperNote: string;
  options: LadderOptionItem[];
  allowFreeText: boolean;
  freeTextPlaceholder: string;
}

export interface FacetShiftNotice {
  detected: boolean;
  dimension: DimensionKey;
  message: string;
}

export interface LadderSessionState {
  sessionId: string;
  concern: string;
  direction: "up" | "down";
  currentLevel: LadderLevel;
  visitedLevels: LadderLevel[];
  lens: PerspectiveLensId;
  flipCount: number;
  turnCount: number;
  history: {
    level: LadderLevel;
    question: string;
    selectedOptionId: string | null;
    userText: string;
    acceptedRecommendation: boolean;
    timestamp: number;
  }[];
  events: BehindEvent[];
  behindInference: BehindInference;
  behindLabel: string | null;
  profile: ProbabilityProfile;
  latestFacetShift: FacetShiftNotice | null;
  latestBreakthrough: BreakthroughCheck | null;
  completed: boolean;
  unravelSummary: UnravelResult;
}

export const LADDER_LEVEL_META: Record<
  LadderLevel,
  { title: string; subtitle: string; badge: string }
> = {
  1: {
    title: "Level 1 · 감각·신체 신호",
    subtitle: "말로 설명하기 힘들 때 몸과 마음의 즉각적인 반응부터 포착합니다",
    badge: "L1 감각",
  },
  2: {
    title: "Level 2 · 양자 대비 저울",
    subtitle: "두 가지 극단이나 방향을 나란히 놓고 어느 쪽이 덜 무거운지 비교합니다",
    badge: "L2 대비",
  },
  3: {
    title: "Level 3 · 사실과 가정 분리",
    subtitle: "실제 일어난 사실과 아직 일어나지 않은 추측·두려움을 구분합니다",
    badge: "L3 구조",
  },
  4: {
    title: "Level 4 · 되돌릴 수 있는 실험",
    subtitle: "완벽한 결론 대신 오늘 10~15분 안에 해볼 작은 실험을 고릅니다",
    badge: "L4 실험",
  },
  5: {
    title: "Level 5 · 내 언어의 통찰 & 약속",
    subtitle: "스스로의 문장으로 핵심을 정의하고 If-Then(만약~이면) 약속을 남깁니다",
    badge: "L5 통찰",
  },
};

export function detectOverRationalization(concern: string): boolean {
  const cleaned = concern.trim();
  if (cleaned.length < 40) return false;
  return /머리로는|이성적으로|논리적으로|장단점|분석은|다\s*아는데|알겠는데\s*마음이|계산은\s*끝|정리는\s*다\s*했/i.test(
    cleaned,
  );
}

export function buildLadderStepCard(
  level: LadderLevel,
  concern: string,
  direction: "up" | "down" = "up",
  lens: PerspectiveLensId = "structural",
  flipCount: number = 0,
): LadderStepCard {
  const summary = unravelConcern(concern, { preferredLens: lens, entryDirection: direction });
  const meta = LADDER_LEVEL_META[level];
  const flipped = flipCount % 2 === 1;

  if (level === 1) {
    const question =
      direction === "down"
        ? flipped
          ? "머릿속 논리를 잠시 끄고, 지금 이 문제를 떠올릴 때 몸 어디에 가장 먼저 긴장이 들어가나요?"
          : "분석은 충분히 했어요. 이제 논리를 내려놓고 이 주제를 떠올리면 어떤 감각이 가장 먼저 올라오나요?"
        : flipped
          ? "긴 설명 없이 단어 하나로만 고른다면, 지금 내 상태를 가장 많이 잡아먹는 느낌은 어느 쪽인가요?"
          : "말로 길게 설명하지 않아도 괜찮아요. 지금 이 고민을 떠올리면 마음에 어떤 느낌이 가장 먼저 드나요?";

    return {
      level: 1,
      levelName: meta.title,
      direction,
      lens,
      flipCount,
      question,
      helperNote: "오답이 없는 감각 점검입니다. 가장 가까운 느낌 하나만 가볍게 탭해 보세요.",
      options: [
        {
          id: "l1_heavy",
          label: "🪨 가슴이나 어깨가 묵직하고 답답하다",
          subtext: "해야 한다는 압박감이나 책임감이 짓누르는 느낌",
          recommended: lens === "grounding",
          dimension: "copingStyle",
          signal: 1,
        },
        {
          id: "l1_foggy",
          label: "🌫️ 안개 낀 것처럼 어디서부터 손댈지 막막하다",
          subtext: "생각과 걱정이 한 덩어리로 엉켜 우선순위가 안 보이는 상태",
          recommended: lens !== "grounding",
          dimension: "approachStyle",
          signal: -1,
        },
        {
          id: "l1_rushed",
          label: "⚡ 시간이 쫓기는 듯 조급하고 불안하다",
          subtext: "빨리 결정하거나 증명해야 할 것 같은 초조함",
          recommended: false,
          dimension: "decisionSpeed",
          signal: 1,
        },
        {
          id: "l1_drained",
          label: "🔋 에너지가 방전되어 아무것도 고르기 싫다",
          subtext: "결정 자체보다 휴식과 경계 설정이 먼저 필요한 상태",
          recommended: false,
          dimension: "riskTolerance",
          signal: -1,
        },
      ],
      allowFreeText: true,
      freeTextPlaceholder: "또는 지금 느껴지는 감각을 짧은 단어로 적어주세요...",
    };
  }

  if (level === 2) {
    const question = flipped
      ? "1년 뒤의 내가 오늘을 돌아본다면, 아래 두 모습 중 어느 쪽이 덜 후회스러울까요?"
      : "두 가지 방향을 저울 위에 올려볼게요. 완벽한 정답이 아니라 '조금이라도 숨이 덜 막히는 쪽'은 어디인가요?";

    return {
      level: 2,
      levelName: meta.title,
      direction,
      lens,
      flipCount,
      question,
      helperNote: "둘 다 마음에 안 들면 '다른 각도로 찔러줘'를 눌러 질문을 뒤집을 수 있습니다.",
      options: [
        {
          id: "l2_simplify",
          label: "⚖️ A. 판을 줄이고 핵심 1가지만 남겨 가볍게 검증하기",
          subtext: "기존의 무거운 기준이나 범위를 과감히 덜어내고 작게 시작",
          recommended: true,
          dimension: "approachStyle",
          signal: -1,
        },
        {
          id: "l2_bold_shift",
          label: "🚀 B. 기존 방식을 내려놓고 완전히 새로운 프레임으로 전환하기",
          subtext: "익숙한 관성을 끊고 내가 진짜 원하는 방향으로 재설계",
          recommended: false,
          dimension: "riskTolerance",
          signal: 1,
        },
        {
          id: "l2_protect_energy",
          label: "🛡️ C. 당장 결론 내리지 않고 내 컨디션과 경계부터 지키기",
          subtext: "외부의 속도 대신 내 회복 속도에 맞춰 결정 시점 유예",
          recommended: false,
          dimension: "copingStyle",
          signal: 1,
        },
        {
          id: "l2_ask_direct",
          label: "🔍 D. 혼자 추측하는 것을 멈추고 외부 데이터·피드백 1개 확인하기",
          subtext: "머릿속 시뮬레이션 대신 실제 사실 확인으로 불확실성 줄이기",
          recommended: false,
          dimension: "decisionSpeed",
          signal: 1,
        },
      ],
      allowFreeText: true,
      freeTextPlaceholder: "두 선택지 외에 끌리는 중간 지점이 있다면 적어주세요...",
    };
  }

  if (level === 3) {
    const firstAssumption =
      summary.assumptions[0]?.statement ?? "지금 당장 완벽한 결론을 내려야 한다는 전제";
    const question = flipped
      ? `'${firstAssumption.slice(0, 38)}'라는 생각이 만약 100% 사실이 아니라면, 지금 가장 달라지는 점은 무엇인가요?`
      : `사실과 가정을 분리해 볼게요. 현재 '${firstAssumption.slice(0, 38)}'라는 전제가 판단을 묶어두고 있지 않나요?`;

    return {
      level: 3,
      levelName: meta.title,
      direction,
      lens,
      flipCount,
      question,
      helperNote: "확인된 사실(Fact)과 내 머릿속 가설(Assumption)을 분리하면 선택지가 넓어집니다.",
      options: [
        {
          id: "l3_separate_assumption",
          label: "📌 맞다 — 아직 확인되지 않은 추측을 사실처럼 걱정하고 있었다",
          subtext: "가설은 가설로 두고 확인 가능한 사실부터 다루기",
          recommended: true,
          dimension: "approachStyle",
          signal: -1,
        },
        {
          id: "l3_emotional_weight",
          label: "💬 사실 여부와 별개로 그 가능성 자체가 감정적으로 부담된다",
          subtext: "논리적 반박보다 안전망과 마음의 여유가 먼저 필요함",
          recommended: false,
          dimension: "copingStyle",
          signal: 1,
        },
        {
          id: "l3_need_test",
          label: "🧪 반반이다 — 작은 실험으로 직접 확인해봐야 알 수 있다",
          subtext: "생각을 멈추고 15분짜리 행동으로 검증하기",
          recommended: false,
          dimension: "riskTolerance",
          signal: 1,
        },
        {
          id: "l3_reframe_goal",
          label: "🔄 질문 자체를 바꿔야 한다 — 내가 진짜 원하는 기준은 따로 있다",
          subtext: "남의 기준이 아닌 내 핵심 욕구로 문제 재정의",
          recommended: false,
          dimension: "decisionSpeed",
          signal: -1,
        },
      ],
      allowFreeText: true,
      freeTextPlaceholder: "내가 붙잡고 있던 가정이나 진짜 사실을 한 줄로 적어보세요...",
    };
  }

  if (level === 4) {
    const options: LadderOptionItem[] = summary.options.map((opt) => ({
      id: opt.id,
      label: opt.title,
      subtext: `${opt.description} (예상 ${opt.costMinutes}분 · 가역성 ${opt.reversibility === "high" ? "높음" : "보통"})`,
      recommended: opt.recommended,
      dimension: opt.dimensionSignal.dimension,
      signal: opt.dimensionSignal.polarity,
    }));

    return {
      level: 4,
      levelName: meta.title,
      direction,
      lens,
      flipCount,
      question: flipped
        ? "실패해도 언제든 되돌릴 수 있다면, 오늘 딱 10분만 투자해 해볼 가장 가벼운 실험은 무엇인가요?"
        : "이제 부담 없는 작은 실험 하나를 골라볼까요? 언제든 수정하거나 철회할 수 있는 선택지들입니다.",
      helperNote: "고르기 막막하다면 '✦ 추천' 표시가 붙은 기본 실험으로 가볍게 시작해 보세요.",
      options,
      allowFreeText: true,
      freeTextPlaceholder: "직접 설계하고 싶은 10분 실험이 있다면 적어주세요...",
    };
  }

  // Level 5
  return {
    level: 5,
    levelName: meta.title,
    direction,
    lens,
    flipCount,
    question: flipped
      ? "오늘 대화를 통해 발견한 '나만의 기준' 한 문장과, 오늘 해볼 작은 약속(If-Then)을 확정해 볼까요?"
      : "마지막 단계예요. 지금 정리된 핵심 질문에 대해 내 언어로 한 줄 통찰을 남기거나 작은 실행 약속을 선택해 주세요.",
    helperNote:
      "자신의 삶과 기준을 관통하는 문장을 적으면 '✦ 명예의 전당(핵심 통찰)'에 자동 보관됩니다.",
    options: [
      {
        id: "l5_commit_recommended",
        label: `✅ 약속 확정: "만약 ${summary.ifThenPlan.trigger}이면 → ${summary.ifThenPlan.action}"`,
        subtext: `실패 시 대안: ${summary.ifThenPlan.fallback}`,
        recommended: true,
        dimension: "decisionSpeed",
        signal: 1,
      },
      {
        id: "l5_step_down_sensory",
        label: "🔽 아직 마음속 감각이 덜 풀렸다 — 사다리 내려가기(Level 2/1)로 감각 점검하기",
        subtext: "머리로는 정리됐지만 마음이 무겁다면 감각 사다리로 내려가 다시 살핍니다",
        recommended: false,
        dimension: "copingStyle",
        signal: 1,
      },
      {
        id: "l5_defer_consciously",
        label: "⏸️ 의도적 보류: 오늘은 정리만 남기고 내일 맑은 정신으로 결정하기",
        subtext: "회피가 아니라 에너지를 지키는 의식적인 유예 선택",
        recommended: false,
        dimension: "decisionSpeed",
        signal: -1,
      },
    ],
    allowFreeText: true,
    freeTextPlaceholder:
      "예: 결국 내가 두려웠던 건 실패 자체가 아니라 완벽해야 한다는 강박이었다. 오늘은 핵심 1개만 먼저 만든다.",
  };
}

export function detectFacetShift(
  profile: ProbabilityProfile,
  dimension: DimensionKey,
  newSignal: -1 | 1,
  acceptedRecommendation: boolean,
): FacetShiftNotice {
  const existing = profile[dimension];
  const dimensionNames: Record<DimensionKey, { neg: string; pos: string; title: string }> = {
    approachStyle: { neg: "구조·분석적", pos: "직관·감각적", title: "접근 방식" },
    riskTolerance: { neg: "신중·안정 지향", pos: "탐색·도전 지향", title: "불확실성 태도" },
    copingStyle: { neg: "문제해결 중심", pos: "감정·공감 중심", title: "대처 스타일" },
    decisionSpeed: { neg: "숙고·유예형", pos: "즉각 실행형", title: "결정 템포" },
  };
  const label = dimensionNames[dimension];

  // If user rejected recommendation or acted opposite to their established tendency
  const oppositeToHistory =
    existing.observations >= 1 &&
    ((existing.value > 0.2 && newSignal < 0) || (existing.value < -0.2 && newSignal > 0));

  if (!acceptedRecommendation || oppositeToHistory) {
    const newSide = newSignal > 0 ? label.pos : label.neg;
    return {
      detected: true,
      dimension,
      message: `✦ 입체적 면모 포착 (${label.title}): 평소 패턴이나 기본 추천 대신 '${newSide}' 방향을 선택했습니다. 사람은 고정된 유형이 아니라 상황에 따라 다른 면을 발휘합니다.`,
    };
  }

  return {
    detected: false,
    dimension,
    message: "",
  };
}

export function createLadderSession(
  concern: string,
  options: {
    direction?: "up" | "down";
    initialLevel?: LadderLevel;
    lens?: PerspectiveLensId;
    profile?: ProbabilityProfile;
  } = {},
): LadderSessionState {
  const overRationalized = detectOverRationalization(concern);
  const direction: "up" | "down" = options.direction ?? (overRationalized ? "down" : "up");
  const initialLevel: LadderLevel =
    options.initialLevel ?? (direction === "down" ? 5 : 1);
  const lens: PerspectiveLensId = options.lens ?? "structural";
  const profile = options.profile ?? createEmptyProfile();
  const unravelSummary = unravelConcern(concern, {
    preferredLens: lens,
    entryDirection: direction,
  });

  const behindInference = inferStateSync(
    {
      responseTimeMs: 0,
      messageLength: concern.length,
      choiceHesitationMs: 0,
      choiceChanges: 0,
      turnCount: 0,
      lengthTrend: "stable",
      timeTrend: "stable",
    },
    [],
    initialLevel,
  );

  return {
    sessionId: `ladder_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    concern,
    direction,
    currentLevel: initialLevel,
    visitedLevels: [initialLevel],
    lens,
    flipCount: 0,
    turnCount: 0,
    history: [],
    events: [],
    behindInference,
    behindLabel: describeBehindInference(behindInference),
    profile,
    latestFacetShift: null,
    latestBreakthrough: null,
    completed: false,
    unravelSummary,
  };
}

export type LadderTurnAction =
  | {
      type: "select_option";
      optionId: string;
      userText?: string;
      hesitationMs?: number;
    }
  | {
      type: "flip_angle";
    }
  | {
      type: "jump_level";
      targetLevel: LadderLevel;
      direction?: "up" | "down";
    }
  | {
      type: "switch_lens";
      lens: PerspectiveLensId;
    };

export function advanceLadderSession(
  state: LadderSessionState,
  action: LadderTurnAction,
): LadderSessionState {
  const now = Date.now();

  if (action.type === "flip_angle") {
    const newEvents: BehindEvent[] = [
      ...state.events,
      { type: "cheat", timestamp: now, level: state.currentLevel },
    ];
    const nextFlip = state.flipCount + 1;
    const inference = inferStateSync(
      {
        responseTimeMs: 2500,
        messageLength: 0,
        choiceHesitationMs: 15000,
        choiceChanges: nextFlip,
        turnCount: state.turnCount + 1,
        lengthTrend: "stable",
        timeTrend: "stable",
      },
      newEvents,
      state.currentLevel,
    );

    // If user flips twice at high level, step down 1 level to make it easier
    const adjustedLevel: LadderLevel =
      inference.suggestLevelDown && state.currentLevel > 1 && nextFlip >= 2
        ? ((state.currentLevel - 1) as LadderLevel)
        : state.currentLevel;

    return {
      ...state,
      currentLevel: adjustedLevel,
      visitedLevels: state.visitedLevels.includes(adjustedLevel)
        ? state.visitedLevels
        : [...state.visitedLevels, adjustedLevel],
      flipCount: nextFlip,
      events: newEvents,
      behindInference: inference,
      behindLabel: describeBehindInference(inference),
    };
  }

  if (action.type === "switch_lens") {
    return {
      ...state,
      lens: action.lens,
      unravelSummary: unravelConcern(state.concern, {
        preferredLens: action.lens,
        entryDirection: state.direction,
      }),
    };
  }

  if (action.type === "jump_level") {
    const nextDirection =
      action.direction ??
      (action.targetLevel < state.currentLevel ? "down" : state.direction);
    return {
      ...state,
      direction: nextDirection,
      currentLevel: action.targetLevel,
      visitedLevels: state.visitedLevels.includes(action.targetLevel)
        ? state.visitedLevels
        : [...state.visitedLevels, action.targetLevel],
      flipCount: 0,
    };
  }

  // action.type === "select_option"
  const card = buildLadderStepCard(
    state.currentLevel,
    state.concern,
    state.direction,
    state.lens,
    state.flipCount,
  );
  const chosen = card.options.find((o) => o.id === action.optionId) ?? card.options[0];
  const acceptedRecommendation = Boolean(chosen?.recommended);
  const weight = acceptedRecommendation ? 1 : 1.5;

  let nextProfile = updateProfileFromSelection(
    state.profile,
    chosen.dimension,
    chosen.signal,
    weight,
  );
  nextProfile = updateRecommendationRate(nextProfile, acceptedRecommendation);

  const facetShift = detectFacetShift(
    state.profile,
    chosen.dimension,
    chosen.signal,
    acceptedRecommendation,
  );

  const newEvents: BehindEvent[] = [
    ...state.events,
    ...(acceptedRecommendation
      ? []
      : [
          {
            type: "recommendation_reject" as const,
            timestamp: now,
            level: state.currentLevel,
          },
        ]),
  ];

  const userText = (action.userText ?? "").trim();
  const breakthrough = userText
    ? detectBreakthroughInsight(userText)
    : state.latestBreakthrough;

  const nextTurnCount = state.turnCount + 1;
  const inference = inferStateSync(
    {
      responseTimeMs: action.hesitationMs ?? 3500,
      messageLength: userText.length || chosen.label.length,
      choiceHesitationMs: action.hesitationMs ?? 3500,
      choiceChanges: 0,
      turnCount: nextTurnCount,
      lengthTrend: userText.length > 35 ? "longer" : "stable",
      timeTrend: "stable",
    },
    newEvents,
    state.currentLevel,
  );

  // Determine next level based on direction & special options
  let nextLevel: LadderLevel = state.currentLevel;
  let nextDirection = state.direction;
  let completed = state.completed;

  if (action.optionId === "l5_step_down_sensory") {
    nextDirection = "down";
    nextLevel = 2;
  } else if (state.direction === "up") {
    if (state.currentLevel < 5) {
      nextLevel = (state.currentLevel + 1) as LadderLevel;
    } else {
      completed = true;
    }
  } else {
    // Downward ladder: 5 -> 3 -> 2 -> 1 -> then synthesize at 4/5
    if (state.currentLevel === 5) nextLevel = 3;
    else if (state.currentLevel === 3) nextLevel = 2;
    else if (state.currentLevel === 2) nextLevel = 1;
    else if (state.currentLevel === 1) {
      nextDirection = "up";
      nextLevel = 4;
    } else if (state.currentLevel === 4) {
      nextLevel = 5;
      completed = true;
    }
  }

  return {
    ...state,
    direction: nextDirection,
    currentLevel: nextLevel,
    visitedLevels: state.visitedLevels.includes(nextLevel)
      ? state.visitedLevels
      : [...state.visitedLevels, nextLevel],
    flipCount: 0,
    turnCount: nextTurnCount,
    history: [
      ...state.history,
      {
        level: state.currentLevel,
        question: card.question,
        selectedOptionId: chosen.id,
        userText: userText || chosen.label,
        acceptedRecommendation,
        timestamp: now,
      },
    ],
    events: newEvents,
    behindInference: inference,
    behindLabel: describeBehindInference(inference),
    profile: nextProfile,
    latestFacetShift: facetShift.detected ? facetShift : state.latestFacetShift,
    latestBreakthrough: breakthrough,
    completed,
  };
}
