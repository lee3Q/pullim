import { detectCrisis, type CrisisResponse, type CrisisTier } from "../safety/crisis-detector.ts";

export type PerspectiveLensId = "grounding" | "structural" | "exploratory";

export interface AssumptionItem {
  statement: string;
  whyAssumption: string;
  checkQuestion: string;
}

export interface CognitiveTrap {
  id:
    | "binary_thinking"
    | "catastrophizing"
    | "mind_reading"
    | "should_pressure"
    | "sunk_cost"
    | "analysis_paralysis";
  name: string;
  evidence: string;
  reframeQuestion: string;
}

export interface PerspectiveLens {
  id: PerspectiveLensId;
  badge: string;
  title: string;
  summary: string;
  socraticQuestion: string;
  blindSpotNote: string;
}

export interface ReversibleOption {
  id: string;
  title: string;
  description: string;
  reversibility: "high" | "medium";
  costMinutes: number;
  recommended: boolean;
  recommendationReason?: string;
  dimensionSignal: {
    dimension: "approachStyle" | "riskTolerance" | "copingStyle" | "decisionSpeed";
    polarity: -1 | 1;
  };
}

export interface IfThenPlan {
  trigger: string;
  action: string;
  fallback: string;
  reviewAfterHours: number;
}

export interface BreakthroughCheck {
  isBreakthrough: boolean;
  score: number;
  coreSentence: string;
  reason: string;
}

export interface UnravelOptions {
  preferredLens?: PerspectiveLensId;
  entryDirection?: "up" | "down";
}

export interface UnravelResult {
  id: string;
  createdAt: string;
  rawConcern: string;
  haltedByCrisis: boolean;
  crisisTier: CrisisTier;
  crisisResponse: CrisisResponse | null;
  topicDomain: "career" | "relationship" | "project" | "overload" | "general";
  coreTension: string;
  reframedQuestion: string;
  facts: string[];
  assumptions: AssumptionItem[];
  cognitiveTraps: CognitiveTrap[];
  lenses: PerspectiveLens[];
  options: ReversibleOption[];
  ifThenPlan: IfThenPlan;
  recommendedLadderDirection: "up" | "down";
  ladderDirectionReason: string;
}

const ASSUMPTION_MARKERS = [
  /것\s*같/i,
  /일\s*것/i,
  /할\s*거야/i,
  /할까\s*봐/i,
  /될까\s*봐/i,
  /아닐까/i,
  /분명/i,
  /어차피/i,
  /절대/i,
  /무조건/i,
  /다\s*망/i,
  /미워할/i,
  /실망할/i,
  /늦었/i,
  /불가능/i,
  /\bprobably\b/i,
  /\bmight\b/i,
  /\bwill\s+fail\b/i,
  /\beveryone\s+thinks\b/i,
  /\bnever\b/i,
  /\balways\b/i,
  /\btoo\s+late\b/i,
];

export function detectTopicDomain(
  concern: string,
): "career" | "relationship" | "project" | "overload" | "general" {
  const text = concern.toLowerCase();
  if (/이직|퇴사|회사|취업|연봉|커리어|상사|면접|대학원|진로|job|career|quit|offer|resign/.test(text)) {
    return "career";
  }
  if (/연인|여자친구|남자친구|친구|가족|부모|갈등|서운|싸웠|관계|결혼|헤어|partner|friend|family|relationship/.test(text)) {
    return "relationship";
  }
  if (/프로젝트|사이드|창업|오픈소스|기능|개발|출시|기획|우선순위|일정|project|launch|build|startup|repo/.test(text)) {
    return "project";
  }
  if (/번아웃|지쳤|너무\s*많|과부하|피곤|체력|무기력|다\s*못|벅차|burnout|overwhelmed|exhausted|tired/.test(text)) {
    return "overload";
  }
  return "general";
}

export function separateFactsAndAssumptions(concern: string): {
  facts: string[];
  assumptions: AssumptionItem[];
} {
  const cleaned = concern.trim();
  if (!cleaned) {
    return {
      facts: ["아직 구체적인 상황이 입력되지 않았습니다."],
      assumptions: [
        {
          statement: "문제를 한 번에 완벽히 설명해야만 정리를 시작할 수 있다는 가정",
          whyAssumption: "단 한 문장이나 감각 단어만으로도 분해를 시작할 수 있습니다.",
          checkQuestion: "지금 가장 먼저 떠오르는 장면 하나만 꼽는다면 무엇인가요?",
        },
      ],
    };
  }

  const rawClauses = cleaned
    .split(/(?:[.!?。\n]+|(?:\s*(?:그런데|하지만|근데|그래서|그리고|반면|다만)\s*)|(?:,\s*))/g)
    .map((s) => s.trim())
    .filter((s) => s.length >= 4);

  const facts: string[] = [];
  const assumptions: AssumptionItem[] = [];

  for (const clause of rawClauses) {
    const isAssumption = ASSUMPTION_MARKERS.some((rx) => rx.test(clause));
    if (isAssumption) {
      assumptions.push({
        statement: clause,
        whyAssumption: "아직 일어나지 않은 미래 예측이거나 타인의 내면·결과를 단정한 가설입니다.",
        checkQuestion: `'${clause.slice(0, 28)}${clause.length > 28 ? "…" : ""}'라는 생각이 틀릴 가능성(반례)이 단 10%라도 있다면 어떤 경우일까요?`,
      });
    } else {
      facts.push(clause);
    }
  }

  if (facts.length === 0) {
    facts.push(`현재 이 문제로 에너지를 쓰고 있으며 결정·정리가 필요한 상태다: "${cleaned.slice(0, 50)}${cleaned.length > 50 ? "…" : ""}"`);
  }

  if (assumptions.length === 0) {
    assumptions.push({
      statement: "지금 당장 모든 불확실성을 제거하고 완벽한 답을 내려야 한다는 전제",
      whyAssumption: "대부분의 결정은 되돌릴 수 있는 작은 실험(중간 단계)으로 쪼갤 수 있습니다.",
      checkQuestion: "최종 결정 대신 오늘 15분만 써서 확인할 수 있는 가장 작은 사실은 무엇인가요?",
    });
  }

  return {
    facts: facts.slice(0, 5),
    assumptions: assumptions.slice(0, 4),
  };
}

export function detectCognitiveTraps(concern: string): CognitiveTrap[] {
  const traps: CognitiveTrap[] = [];
  const text = concern.trim();

  if (/아니면|모\s*아니면\s*도|전부\s*아니면|무조건|절대|둘\s*중\s*하나만|all\s+or\s+nothing|either\s+or/i.test(text)) {
    traps.push({
      id: "binary_thinking",
      name: "이분법적 프레임 (All-or-Nothing)",
      evidence: "선택지를 양극단(전부 바꾸기 vs 전부 포기하기)으로만 좁혀 보고 있을 수 있습니다.",
      reframeQuestion: "0%와 100% 사이에 '20%만 먼저 시험해보는 제3의 선택지'를 만든다면 어떤 모습일까요?",
    });
  }

  if (/망하|끝장|무너|이도\s*저도\s*아니게|다\s*잃|최악|큰일|ruin|disaster|everything\s+fails/i.test(text)) {
    traps.push({
      id: "catastrophizing",
      name: "파국화 예측 (Catastrophizing)",
      evidence: "불확실한 결과를 감당 불가능한 실패로 확대해 불안을 키우고 있을 수 있습니다.",
      reframeQuestion: "만약 실제로 예상보다 덜 풀리더라도, 내가 복구하거나 되돌릴 수 있는 안전망은 무엇이 남아 있나요?",
    });
  }

  if (/분명\s*나를|생각할\s*거|실망할|비웃|미워할|싫어할|나쁘게\s*볼|they\s+will\s+think|judging\s+me/i.test(text)) {
    traps.push({
      id: "mind_reading",
      name: "타인 마음 단정 (Mind Reading)",
      evidence: "상대방에게 직접 확인하지 않은 반응을 기정사실로 두고 에너지를 소모하고 있습니다.",
      reframeQuestion: "상대의 속마음을 추측하는 대신, 직접 물어보거나 확인해볼 수 있는 짧은 질문 한 줄은 무엇인가요?",
    });
  }

  if (/해야만|해야\s*하는데|못하면\s*안\s*돼|당연히\s*내가|버텨야|참아야|must|should\s+always/i.test(text)) {
    traps.push({
      id: "should_pressure",
      name: "과도한 당위 압박 (Should-Statement)",
      evidence: "'~해야만 한다'는 규칙이 현재 나의 실제 에너지와 감정을 짓누르고 있습니다.",
      reframeQuestion: "'~해야 한다'를 '~을 선택할 수도 있고, 잠시 멈출 수도 있다'로 바꾸면 어떤 여유가 생기나요?",
    });
  }

  if (/지금까지\s*해온|아까워서|버틴\s*시간|투자한|포기하기엔\s*이미|sunk\s+cost|wasted\s+so\s+much/i.test(text)) {
    traps.push({
      id: "sunk_cost",
      name: "매몰비용 붙잡기 (Sunk Cost Bias)",
      evidence: "과거에 이미 쓴 시간·노력이 아까워 미래의 시간까지 같은 곳에 묶어두고 있을 수 있습니다.",
      reframeQuestion: "만약 과거에 투자한 시간이 '0'이고 오늘 처음 이 선택지를 만났다면, 지금 다시 시작하겠습니까?",
    });
  }

  if (/머리로는\s*아는데|분석은\s*다|비교만|결정을\s*못|계속\s*고민만|미루고|overthinking|know\s+logically/i.test(text)) {
    traps.push({
      id: "analysis_paralysis",
      name: "과잉분석 마비 (Analysis Paralysis)",
      evidence: "논리적 분석은 이미 충분하지만 감정적 수용이나 작은 행동 단서가 연결되지 않은 상태입니다.",
      reframeQuestion: "더 분석하는 것을 멈추고, 지금 몸이 가장 덜 무겁게 느끼는 아주 작은 행동 하나만 고른다면 무엇인가요?",
    });
  }

  if (traps.length === 0) {
    traps.push({
      id: "analysis_paralysis",
      name: "모호성 과부하 (Ambiguity Overload)",
      evidence: "사실·감정·선택지가 한 덩어리로 엉켜 있어 어디서부터 손을 대야 할지 막막한 상태입니다.",
      reframeQuestion: "이 고민에서 '내가 통제할 수 있는 영역'과 '통제할 수 없는 영역'을 나누면 무엇이 남나요?",
    });
  }

  return traps;
}

export function buildPerspectiveLenses(
  concern: string,
  facts: string[],
  assumptions: AssumptionItem[],
): PerspectiveLens[] {
  const firstFact = facts[0] ?? concern;
  const firstAssumption = assumptions[0]?.statement ?? "불확실한 결과에 대한 걱정";

  return [
    {
      id: "grounding",
      badge: "🌿 공감·수용 시선",
      title: "감정과 에너지의 무게부터 덜어내기",
      summary: `지금 겪고 있는 망설임은 나약해서가 아니라 중요하게 여기는 가치가 있기 때문입니다. '${firstFact.slice(0, 36)}' 상황에서 지치거나 복잡한 감정이 드는 것은 자연스러운 신호입니다.`,
      socraticQuestion: "누구에게도 증명할 필요가 없다면, 지금 내 마음과 몸이 가장 원하는 휴식이나 보호는 무엇인가요?",
      blindSpotNote: "논리적으로 옳은 결정이라도 내 정서적 에너지를 고갈시킨다면 지속할 수 없습니다.",
    },
    {
      id: "structural",
      badge: "📐 구조·논리 시선",
      title: "되돌릴 수 있는 결정과 정보 가치 분리하기",
      summary: `현재 가장 큰 병목은 '${firstAssumption.slice(0, 36)}'을 검증 없이 사실처럼 취급하는 것입니다. 비가역적 결정(전부 바꾸기)과 가역적 실험(작게 확인하기)을 분리하면 리스크가 크게 줄어듭니다.`,
      socraticQuestion: "이 결정을 내리기 전에 단 1개의 데이터나 사실만 더 확보할 수 있다면 무엇을 확인하겠습니까?",
      blindSpotNote: "정보가 부족할 때는 '최종 결론'을 내리는 대신 '정보 획득 비용이 가장 낮은 행동'을 선택하는 것이 합리적입니다.",
    },
    {
      id: "exploratory",
      badge: "🧭 직관·전환 시선",
      title: "프레임 뒤집기와 최소 실험으로 길 열기",
      summary: "지금 눈앞의 선택지가 답답하다면 질문 자체가 너무 좁게 설정되었을 가능성이 큽니다. 10일 뒤, 10개월 뒤의 시선으로 넓히면 지금의 고민이 전혀 다른 기회로 보일 수 있습니다.",
      socraticQuestion: "만약 실패해도 아무도 모르고 48시간 뒤에 원래대로 되돌릴 수 있다면, 가장 해보고 싶은 시도는 무엇인가요?",
      blindSpotNote: "생각만으로 답이 안 나올 때는 작은 행동 하나가 새로운 감각 데이터를 만들어 줍니다.",
    },
  ];
}

export function generateReversibleOptions(
  concern: string,
  preferredLens: PerspectiveLensId = "structural",
): ReversibleOption[] {
  const domain = detectTopicDomain(concern);

  const domainSpecificAction: Record<typeof domain, { title: string; desc: string }> = {
    career: {
      title: "결정 보류선 설정 + 핵심 기준 3가지 적기",
      desc: "당장 수락/거절을 확정하지 않고, 내가 절대 포기 못 할 조건 2가지와 타협 가능한 조건 1가지를 메모장에 적습니다.",
    },
    relationship: {
      title: "판단 없는 '나-전달법(I-message)' 한 문장 초안 쓰기",
      desc: "상대를 단정하는 말 대신 '나는 최근 ~할 때 조금 지치고 서운했어'라고 내 감정만 담은 문장 하나를 적어봅니다.",
    },
    project: {
      title: "가장 무거운 껍데기 덜어내고 핵심 기능 1개만 남기기",
      desc: "완벽한 전체 구조 대신, 오늘 당장 누군가 써볼 수 있는 가장 작고 선명한 핵심 루프 1개만 정의해 실행합니다.",
    },
    overload: {
      title: "오늘 안 해도 세상이 무너지지 않는 일 2개 덜어내기",
      desc: "현재 목록에서 '오늘 반드시 해야 하는 일 1개'만 남기고 나머지는 과감히 '이번 주 보류함'으로 옮깁니다.",
    },
    general: {
      title: "사실 2줄·가정 2줄 분리 메모 후 15분 작은 실험하기",
      desc: "머릿속으로만 굴리던 걱정을 '확인된 사실'과 '내 추측' 두 칸으로 적어 눈으로 분리합니다.",
    },
  };

  const specific = domainSpecificAction[domain];

  const options: ReversibleOption[] = [
    {
      id: "opt_micro_experiment",
      title: specific.title,
      description: specific.desc,
      reversibility: "high",
      costMinutes: 10,
      recommended: preferredLens === "structural" || preferredLens === "exploratory",
      recommendationReason: "부담이 가장 적으면서도 머릿속 맴돌기를 즉시 멈추고 실제 판단 재료를 만들어 주는 행동입니다.",
      dimensionSignal: { dimension: "approachStyle", polarity: -1 },
    },
    {
      id: "opt_info_probe",
      title: "추측 멈추고 확인 질문·정보 1개만 먼저 구하기",
      description: "혼자 시뮬레이션하는 대신, 당사자에게 가볍게 물어보거나 객관적 사례 1가지를 15분만 찾아봅니다.",
      reversibility: "high",
      costMinutes: 15,
      recommended: false,
      dimensionSignal: { dimension: "riskTolerance", polarity: 1 },
    },
    {
      id: "opt_somatic_pause",
      title: "오늘 밤까지 결정 유예하고 감각·컨디션 먼저 회복하기",
      description: "피로한 상태에서의 결정은 왜곡되기 쉽습니다. '내일 오전 10시에 다시 본다'고 시간을 정해두고 오늘은 쉽니다.",
      reversibility: "high",
      costMinutes: 5,
      recommended: preferredLens === "grounding",
      recommendationReason: "정서적·신체적 피로가 높을 때는 결정을 보류하고 에너지를 회복하는 것이 가장 정확한 첫걸음입니다.",
      dimensionSignal: { dimension: "copingStyle", polarity: 1 },
    },
    {
      id: "opt_timeboxed_trial",
      title: "48시간 기한부 임시 결정으로 작게 부딪혀 보기",
      description: "영구적인 결정이 아니라 '딱 이틀만 이 방향으로 움직여보고 다시 평가한다'는 가벼운 실험으로 전환합니다.",
      reversibility: "medium",
      costMinutes: 20,
      recommended: false,
      dimensionSignal: { dimension: "decisionSpeed", polarity: 1 },
    },
  ];

  // Ensure exactly one option is marked recommended
  if (!options.some((o) => o.recommended)) {
    options[0].recommended = true;
  } else {
    let seen = false;
    for (const opt of options) {
      if (opt.recommended) {
        if (seen) opt.recommended = false;
        seen = true;
      }
    }
  }

  return options;
}

export function buildIfThenPlan(concern: string, chosenOptionTitle?: string): IfThenPlan {
  const domain = detectTopicDomain(concern);
  const defaultAction =
    chosenOptionTitle?.trim() ||
    generateReversibleOptions(concern).find((o) => o.recommended)?.title ||
    "사실과 가정을 2줄씩 적어 눈으로 분리하기";

  const triggers: Record<typeof domain, string> = {
    career: "오늘 저녁 책상에 앉아 노트북이나 메모장을 여는 순간",
    relationship: "상대방 생각이 다시 떠올라 마음이 답답해지는 순간",
    project: "다음 작업 세션을 시작하며 에디터나 노트를 여는 첫 10분",
    overload: "할 일 목록을 보며 숨이 막히거나 조급함이 올라오는 순간",
    general: "오늘 하루를 마무리하기 전 조용한 10분이 생기는 순간",
  };

  return {
    trigger: triggers[domain],
    action: `${defaultAction} (10분 타이머 켜고 시작)`,
    fallback: "만약 피곤해서 다 못 하더라도, 단 한 줄만 메모장에 적어두고 내일 이어서 한다.",
    reviewAfterHours: 24,
  };
}

export function detectBreakthroughInsight(text: string): BreakthroughCheck {
  const cleaned = text.trim();
  if (cleaned.length < 18) {
    return {
      isBreakthrough: false,
      score: 0.2,
      coreSentence: cleaned,
      reason: "조금 더 자신의 언어로 생각이나 감정을 풀어낼 때 핵심 통찰로 기록됩니다.",
    };
  }

  const insightPatterns = [
    /결국\s*내가/,
    /진짜\s*원하는/,
    /깨달/,
    /알게\s*됐/,
    /중요한\s*건/,
    /두려웠던\s*이유/,
    /내\s*기준/,
    /사실은\s*내가/,
    /놓치고\s*있던/,
    /완벽하지\s*않아도/,
    /괜찮다/,
    /해보자/,
    /realized/i,
    /what\s+really\s+matters/i,
    /actually\s+want/i,
    /my\s+own/i,
  ];

  let hits = 0;
  for (const rx of insightPatterns) {
    if (rx.test(cleaned)) hits++;
  }
  if (cleaned.length >= 45) hits++;

  const score = Math.min(1, Number((0.3 + hits * 0.25).toFixed(2)));
  const sentences = cleaned
    .split(/(?<=[.!?。])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const coreSentence = sentences.sort((a, b) => b.length - a.length)[0] ?? cleaned;

  return {
    isBreakthrough: score >= 0.55,
    score,
    coreSentence,
    reason:
      score >= 0.55
        ? "외부의 정답이 아니라 스스로의 기준과 감정을 관통하는 문장입니다. 명예의 전당(핵심 통찰)에 보관할 수 있습니다."
        : "현재 생각을 차분히 정리한 기록입니다.",
  };
}

export function unravelConcern(input: string, options: UnravelOptions = {}): UnravelResult {
  const rawConcern = input.trim();
  const id = `unravel_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const createdAt = new Date().toISOString();

  // 1. Deterministic Pre-LLM Crisis Safety Gate
  const crisis = detectCrisis(rawConcern);
  if (crisis.tier === "A" && crisis.response) {
    return {
      id,
      createdAt,
      rawConcern,
      haltedByCrisis: true,
      crisisTier: "A",
      crisisResponse: crisis.response,
      topicDomain: "general",
      coreTension: "지금은 분석이나 결정을 진행할 때가 아니라, 당신의 안전과 보호가 가장 먼저입니다.",
      reframedQuestion: "지금 바로 안전하게 도움을 요청할 수 있는 곳(109, 1577-0199)에 연락해 보시겠어요?",
      facts: ["현재 매우 큰 고통과 위기 신호가 감지되었습니다."],
      assumptions: [],
      cognitiveTraps: [],
      lenses: [],
      options: [],
      ifThenPlan: {
        trigger: "지금 이 화면을 보고 있는 바로 이 순간",
        action: "자살예방상담전화 109 또는 정신건강위기상담전화 1577-0199로 전화하기",
        fallback: "가까운 사람이나 119에 현재 상태를 알리기",
        reviewAfterHours: 1,
      },
      recommendedLadderDirection: "down",
      ladderDirectionReason: "즉시 전문가 및 긴급 지원 연결이 필요합니다.",
    };
  }

  const topicDomain = detectTopicDomain(rawConcern);
  const { facts, assumptions } = separateFactsAndAssumptions(rawConcern);
  const cognitiveTraps = detectCognitiveTraps(rawConcern);
  const lenses = buildPerspectiveLenses(rawConcern, facts, assumptions);
  const reversibleOptions = generateReversibleOptions(
    rawConcern,
    options.preferredLens ?? "structural",
  );
  const recommendedOption = reversibleOptions.find((o) => o.recommended) ?? reversibleOptions[0];
  const ifThenPlan = buildIfThenPlan(rawConcern, recommendedOption?.title);

  // Detect whether user needs to climb up (overwhelmed/vague) or step down (over-rationalized)
  const isOverRationalized =
    rawConcern.length >= 60 &&
    /머리로는|분석|이성적|장단점|구조|비교|다\s*아는데|정리는\s*됐/.test(rawConcern);

  const recommendedLadderDirection: "up" | "down" =
    options.entryDirection ?? (isOverRationalized ? "down" : "up");

  const ladderDirectionReason =
    recommendedLadderDirection === "down"
      ? "논리적 분석은 이미 많이 진행된 상태입니다. 머릿속 계산을 잠시 내려놓고 감각·직관 사다리(Level 5 → 1)로 내려가 진짜 마음을 점검하는 것이 효과적입니다."
      : "막연함과 여러 걱정이 엉켜 있는 상태입니다. 가벼운 감각 점검(Level 1)부터 단계별로 사다리를 올라가며(Level 1 → 5) 내 언어로 좁혀가는 것이 좋습니다.";

  const domainTensionMap: Record<typeof topicDomain, { tension: string; question: string }> = {
    career: {
      tension: "안정성·기존 경로를 지키는 안전함과 새로운 성장·자율성을 향한 갈망 사이의 충돌",
      question: "향후 6개월 동안 내가 가장 후회하지 않을 '되돌릴 수 있는 커리어 실험'은 무엇인가?",
    },
    relationship: {
      tension: "관계를 지키고 싶은 유대감과 내 감정·경계를 보호하고 싶은 욕구 사이의 균형",
      question: "상대를 바꾸려 하거나 내 감정을 억누르지 않고, 오늘 전달할 수 있는 나의 솔직한 경계 한 줄은 무엇인가?",
    },
    project: {
      tension: "완벽한 설계를 향한 욕심과 사람들이 실제로 쓸 수 있는 단순하고 살아있는 결과물 사이의 간극",
      question: "기존의 무거운 껍데기를 다 덜어냈을 때, 사람들이 당장 오늘 유용하게 쓸 단 하나의 핵심 가치는 무엇인가?",
    },
    overload: {
      tension: "모든 일을 잘 해내고 싶은 성취 욕구와 한계에 다다른 현재의 신체·정서 에너지 사이의 불균형",
      question: "오늘 내가 과감히 내려놓아도 내 핵심 가치를 해치지 않는 일 2가지는 무엇인가?",
    },
    general: {
      tension: "불확실한 미래를 통제하고 싶은 마음과 지금 당장 움직여야 하는 현실 사이의 긴장",
      question: "검증되지 않은 가정을 걷어내고 오늘 10분 안에 실행할 수 있는 가장 작은 확인 행동은 무엇인가?",
    },
  };

  return {
    id,
    createdAt,
    rawConcern,
    haltedByCrisis: false,
    crisisTier: crisis.tier,
    crisisResponse: crisis.response,
    topicDomain,
    coreTension: domainTensionMap[topicDomain].tension,
    reframedQuestion: domainTensionMap[topicDomain].question,
    facts,
    assumptions,
    cognitiveTraps,
    lenses,
    options: reversibleOptions,
    ifThenPlan,
    recommendedLadderDirection,
    ladderDirectionReason,
  };
}
