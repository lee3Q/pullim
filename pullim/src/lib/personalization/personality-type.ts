import type { ProbabilityProfile } from "./probability-profile";

export interface ConversationTurn {
  role: "pullim" | "user";
  text: string;
}

export interface PersonalityType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  pullimTone: string;
  pullimConversation: ConversationTurn[];
  strengths: string[];
  blindSpots: string[];
}

// 3차원 조합 (approach × risk × coping) → 8가지 유형
// 인덱스: approach>0(bit2) + risk>0(bit1) + coping>0(bit0)
// 000=조용한전략가, 001=신중한공감자, 010=분석적탐험가, 011=대담한설계자
// 100=자유로운치유자, 101=따뜻한수호자, 110=직관적돌파자, 111=감각적모험가
const PERSONALITY_TYPES: PersonalityType[] = [
  {
    id: "quiet-strategist",
    name: "조용한 전략가",
    emoji: "🧭",
    description:
      "당신은 감정보다 구조를 믿는 사람이에요. 복잡한 상황을 차분히 분해하고, 혼자서 깊이 생각한 뒤 움직이는 스타일이죠. 대화보다 메모나 다이어그램이 더 편할 때가 많아요.",
    pullimTone:
      "\"일단 지금 상황을 같이 정리해볼까요? 뭐가 제일 불확실하게 느껴져요?\"",
    pullimConversation: [
      { role: "pullim", text: "지금 이 상황, 어디서부터 막히는 느낌이에요?" },
      { role: "user", text: "뭘 먼저 해야 할지 모르겠어요." },
      { role: "pullim", text: "그럼 한 가지만 골라볼게요. 지금 가장 신경 쓰이는 게 뭐예요?" },
    ],
    strengths: ["복잡한 문제를 구조화하는 능력", "신중하고 실수 없는 판단", "혼자서도 깊이 파고드는 집중력"],
    blindSpots: ["감정을 나중으로 미루다 쌓이기 쉬움", "완벽한 계획을 기다리다 시작이 늦어질 수 있음"],
  },
  {
    id: "empathic-deliberator",
    name: "신중한 공감자",
    emoji: "🌿",
    description:
      "당신은 천천히, 하지만 깊이 연결되는 사람이에요. 결정을 내리기 전에 상대방의 감정까지 고려하고, 관계를 소중히 여겨요. 서두르지 않는 것이 바로 강점이에요.",
    pullimTone:
      "\"지금 제일 마음에 걸리는 게 뭐예요? 그게 어디서 오는지 같이 들여다볼게요.\"",
    pullimConversation: [
      { role: "pullim", text: "지금 어떤 마음인지 먼저 이야기해줘도 괜찮아요." },
      { role: "user", text: "결정해야 하는데 자꾸 망설여져요." },
      { role: "pullim", text: "망설임 자체가 잘못된 게 아니에요. 뭐가 제일 마음에 걸려요?" },
    ],
    strengths: ["깊은 공감력과 섬세한 배려", "신중한 결정으로 후회가 적음", "신뢰를 주는 안정적인 태도"],
    blindSpots: ["자기 감정보다 남의 감정을 먼저 챙기다 지칠 수 있음", "결정이 늦어져 기회를 놓치기도 함"],
  },
  {
    id: "analytical-explorer",
    name: "분석적 탐험가",
    emoji: "🔭",
    description:
      "당신은 논리로 무장하고 모험에 뛰어드는 사람이에요. 새로운 것을 두려워하지 않지만, 아무렇게나 달려가진 않아요. 데이터와 직관을 동시에 쓰는 희귀한 유형이에요.",
    pullimTone:
      "\"이 상황에서 어떤 정보가 더 있으면 결정이 쉬워질 것 같아요? 같이 찾아볼까요?\"",
    pullimConversation: [
      { role: "pullim", text: "어떤 정보가 더 있으면 이 결정이 더 쉬워질 것 같아요?" },
      { role: "user", text: "확실하지 않은 부분이 너무 많아요." },
      { role: "pullim", text: "알 수 있는 것과 없는 것을 나눠볼까요? 거기서 시작해요." },
    ],
    strengths: ["논리적 근거 위에서 새 길을 여는 능력", "리스크를 계산하면서 도전하는 대담함", "다양한 관점을 연결하는 힘"],
    blindSpots: ["분석이 깊어질수록 결정을 못 내릴 수 있음", "감정의 신호를 과소평가하기 쉬움"],
  },
  {
    id: "bold-designer",
    name: "대담한 설계자",
    emoji: "⚡",
    description:
      "당신은 도전하면서 남도 끌어안는 사람이에요. 새로운 상황에 강하고, 공감력까지 높아서 팀에서 든든한 존재가 되는 경우가 많아요. 단, 너무 많은 것을 동시에 하려는 경향이 있어요.",
    pullimTone:
      "\"지금 가고 싶은 방향이 어디인지 말해줘요. 거기까지 가는 길을 같이 설계해볼게요.\"",
    pullimConversation: [
      { role: "pullim", text: "지금 가고 싶은 방향이 있어요? 대략적으로라도." },
      { role: "user", text: "가고 싶은 방향은 있는데 엄두가 안 나요." },
      { role: "pullim", text: "엄두가 안 나는 이유를 같이 쪼개볼게요. 제일 큰 장벽이 뭐예요?" },
    ],
    strengths: ["도전적이면서도 주변을 살피는 균형", "큰 그림을 그리면서 사람의 마음을 움직이는 힘", "변화에 빠르게 적응하는 유연함"],
    blindSpots: ["너무 많은 것을 동시에 추진하다 번아웃이 올 수 있음", "감정 소진 속도가 빠를 수 있음"],
  },
  {
    id: "free-healer",
    name: "자유로운 치유자",
    emoji: "🌊",
    description:
      "당신은 직감으로 느끼고 혼자 해결해나가는 사람이에요. 규칙보다 흐름을 믿고, 자기만의 방식으로 상황을 풀어가요. 자유롭게 두면 엄청난 것을 만들어내는 유형이에요.",
    pullimTone:
      "\"지금 어떤 기분이 드는지 먼저 말해줘요. 논리보다 느낌이 더 중요한 순간이에요.\"",
    pullimConversation: [
      { role: "pullim", text: "지금 이 순간, 어떤 기분이 드는지 말해줘요." },
      { role: "user", text: "설명하기 어렵지만 뭔가 답답해요." },
      { role: "pullim", text: "그 답답함, 어디서 오는 것 같아요? 논리 말고, 느낌으로." },
    ],
    strengths: ["직감적으로 핵심을 꿰뚫는 능력", "문제를 자신만의 방식으로 해결하는 창의성", "제약보다 가능성을 먼저 보는 시각"],
    blindSpots: ["체계 없이 움직이다 방향을 잃을 수 있음", "혼자 해결하다 도움 요청 시기를 놓치기 쉬움"],
  },
  {
    id: "warm-guardian",
    name: "따뜻한 수호자",
    emoji: "🌙",
    description:
      "당신은 직관으로 상황을 파악하고 주변 사람을 돌보는 사람이에요. 감정을 언어화하는 데 탁월하고, 누군가 힘들 때 가장 먼저 알아채는 타입이에요.",
    pullimTone:
      "\"오늘 제일 힘들었던 순간이 언제였어요? 그때 뭘 가장 원했는지 이야기해줘요.\"",
    pullimConversation: [
      { role: "pullim", text: "오늘 하루 중에 제일 무거웠던 순간이 있었어요?" },
      { role: "user", text: "네, 어떤 말을 들었는데 자꾸 생각나요." },
      { role: "pullim", text: "그 말이 왜 마음에 걸리는지, 천천히 이야기해줘요." },
    ],
    strengths: ["타인의 감정을 빠르게 읽는 공감 능력", "직관으로 상황의 흐름을 파악하는 힘", "관계 안에서 안정감을 만들어내는 능력"],
    blindSpots: ["자기 필요보다 남의 필요를 먼저 채우다 고갈될 수 있음", "직관에만 의존해 중요한 정보를 놓치기도 함"],
  },
  {
    id: "intuitive-breaker",
    name: "직관적 돌파자",
    emoji: "🔥",
    description:
      "당신은 느끼는 대로 뛰어드는 사람이에요. 분석보다 행동이 앞서고, 위기 상황에서 오히려 빛을 발해요. 규칙을 따르기보다 새로운 길을 만드는 유형이에요.",
    pullimTone:
      "\"지금 뭔가 막혀있는 느낌이 들어요? 그게 어디서 오는지 같이 부숴볼게요.\"",
    pullimConversation: [
      { role: "pullim", text: "지금 막혀있는 거예요, 아니면 겁나는 거예요?" },
      { role: "user", text: "솔직히 겁나는 것 같아요." },
      { role: "pullim", text: "뭐가 겁나요? 결과요, 아니면 시작하는 것 자체요?" },
    ],
    strengths: ["결정적인 순간의 결단력", "위기에서 돌파구를 만드는 에너지", "빠른 실행력과 회복력"],
    blindSpots: ["충동적 결정으로 나중에 수습이 필요할 수 있음", "계획 없이 달리다 지속가능성이 떨어질 수 있음"],
  },
  {
    id: "sensory-adventurer",
    name: "감각적 모험가",
    emoji: "✨",
    description:
      "당신은 감각과 감정으로 세상을 탐험하는 사람이에요. 새로운 경험을 좋아하고, 사람과의 연결에서 에너지를 얻어요. 있는 그대로의 순간을 즐기는 능력이 뛰어나요.",
    pullimTone:
      "\"요즘 어떤 순간이 제일 살아있는 느낌이었어요? 거기서부터 시작해볼까요?\"",
    pullimConversation: [
      { role: "pullim", text: "요즘 뭔가 가슴이 뛰었던 순간이 있었어요?" },
      { role: "user", text: "오래전에는 있었는데 요즘은 잘 모르겠어요." },
      { role: "pullim", text: "그때랑 지금, 뭐가 달라진 것 같아요?" },
    ],
    strengths: ["생동감 있는 감정 표현과 연결 능력", "새로운 경험에서 빠르게 배우는 적응력", "현재 순간에 집중하는 몰입 능력"],
    blindSpots: ["장기적인 계획이 약할 수 있음", "감정이 앞서서 논리적 판단이 흐려질 때가 있음"],
  },
];

export function getPersonalityType(profile: ProbabilityProfile): PersonalityType {
  const approach = profile.approachStyle.value; // analytical(-) ↔ intuitive(+)
  const risk = profile.riskTolerance.value;     // cautious(-) ↔ adventurous(+)
  const coping = profile.copingStyle.value;     // problem_solving(-) ↔ empathy(+)

  const idx =
    (approach > 0 ? 4 : 0) +
    (risk > 0 ? 2 : 0) +
    (coping > 0 ? 1 : 0);

  return PERSONALITY_TYPES[idx];
}
