// 사다리 세션 데모 모드 — API 키 없이 전체 UX 흐름 테스트
// 레벨별 mock 응답을 response-parser가 파싱할 수 있는 포맷으로 반환

import type { LadderLevel } from "./ladder-types";

interface DemoTurn {
  raw: string; // response-parser가 파싱하는 원본 포맷
}

// 턴 번호 → 레벨별 응답. 같은 레벨이 반복되면 순환.
const LEVEL_RESPONSES: Record<LadderLevel, DemoTurn[]> = {
  1: [
    {
      raw: `지금 마음에 가까운 느낌을 골라봐.

[SENSORY]
🌊|파도처럼 출렁이는
🪨|돌처럼 무거운
🌬️|바람처럼 흩어지는
🔥|안에서 타오르는
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `이번엔 이런 느낌은 어때?

[SENSORY]
🌙|조용히 가라앉고 싶은
☀️|뭐라도 하고 싶은
🌫️|뭔지 모르겠는
💧|눈물이 나올 것 같은
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `하나만 더. 지금 끌리는 쪽은?

[SENSORY]
🏠|집에 있고 싶은
🚶|어디든 걷고 싶은
🎧|혼자 음악 듣고 싶은
🗣️|누군가한테 말하고 싶은
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
    },
  ],
  2: [
    {
      raw: `두 가지 중에 더 끌리는 쪽이 있어?

[COMPARISON]
A_emoji: 🏔️
A_title: 꼭대기까지 올라가기
A_desc: 힘들어도 끝까지 해내고 싶다
B_emoji: 🛤️
B_title: 길을 바꿔보기
B_desc: 지금 길이 맞는지 모르겠다
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `이건 어때?

[COMPARISON]
A_emoji: ⏰
A_title: 시간이 부족해서
A_desc: 하고 싶은 건 많은데 시간이 없다
B_emoji: 🧭
B_title: 방향을 모르겠어서
B_desc: 시간은 있는데 뭘 해야 할지 모르겠다
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
  ],
  3: [
    {
      raw: `[ANALYSIS]
technique: 타인시점
content: 네가 고른 걸 보면, 지금 방향을 잃은 느낌보다 "하고 싶은 건 있는데 막막한" 상태에 더 가까운 것 같아. 에너지가 없는 게 아니라 어디에 쓸지를 모르는 거 아닐까?
[/ANALYSIS]
[OPTIONS]
👍 맞아
🤔 아닌데
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `[ANALYSIS]
technique: 극단화
content: 만약 지금 하고 있는 것들을 전부 내려놓는다면 — 아무것도 안 해도 되는 상태라면 — 그래도 불안할까? 아니면 홀가분할까? 그 답이 지금 네가 진짜 원하는 게 뭔지 보여줄 수 있어.
[/ANALYSIS]
[OPTIONS]
👍 맞아
🤔 아닌데
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
  ],
  4: [
    {
      raw: `지금 가장 필요한 게 뭘까?

[OPTIONS]
🎯 내가 뭘 원하는지 정리하고 싶어 [추천]
💬 그냥 누군가한테 말하고 싶어
🛌 잠깐 쉬고 싶어
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `그렇구나. 그러면 이런 건 어때?

[OPTIONS]
📝 한번 적어보면서 정리해볼까
🔍 비슷한 상황에서 다른 사람은 어떻게 했는지 볼까
🤝 지금 이 상태 그대로 좀 더 이야기해볼까 [추천]
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
  ],
  5: [
    {
      raw: "편하게 말해봐. 뭐가 제일 마음에 걸려?",
    },
    {
      raw: "그렇구나. 그 마음이 언제부터 시작된 건지 기억나?",
    },
    {
      raw: "네가 말한 것 중에서 '막막하다'는 말이 계속 나오는데 — 그 막막함의 정체가 뭘까? 뭐가 막혀있는 느낌이야?",
    },
  ],
};

// 세션 요약 데모
const DEMO_SUMMARY =
  "오늘 네 마음을 들여다봤어. 방향을 잃은 게 아니라 하고 싶은 게 너무 많아서 막막한 거였어. 에너지는 있으니까, 하나만 골라서 시작해보는 것도 방법이야.";

/**
 * 사다리 세션 데모 응답 생성
 */
export function getDemoLadderResponse(
  level: LadderLevel,
  turnCount: number,
  isSummaryMode: boolean
): string {
  if (isSummaryMode) {
    return DEMO_SUMMARY;
  }

  const responses = LEVEL_RESPONSES[level];
  const index = turnCount % responses.length;
  return responses[index].raw;
}
