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
      raw: `지금 마음이 어떤 느낌인지, 가장 가까운 걸 골라봐.

[SENSORY]
🌊|파도처럼 출렁이는
🪨|돌처럼 무거운
🌬️|바람처럼 흩어지는
🔥|안에서 타오르는
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `이번엔 어때? 더 가까운 느낌 있어?

[SENSORY]
🌙|조용히 가라앉고 싶은
☀️|뭐라도 하고 싶은
🌫️|뭔지 모르겠는
💧|눈물이 나올 것 같은
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `마지막으로 하나만. 지금 어느 쪽이 더 당겨?

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
      raw: `지금 네 상황이 더 어떤 느낌이야?

[COMPARISON]
A_emoji: 🏔️
A_title: 꼭대기까지 올라가기
A_desc: 힘들어도 끝까지 해내고 싶어
B_emoji: 🛤️
B_title: 다른 길로 돌아가기
B_desc: 지금 이 길이 맞는 길인지 모르겠어
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `이 두 가지 중에 더 공감되는 게 있어?

[COMPARISON]
A_emoji: ⏰
A_title: 시간이 부족한 느낌
A_desc: 하고 싶은 건 많은데 시간이 없어
B_emoji: 🧭
B_title: 방향을 잃은 느낌
B_desc: 시간은 있는데 뭘 해야 할지 모르겠어
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `지금 이 고민, 어떤 느낌에 더 가까워?

[COMPARISON]
A_emoji: 🌊
A_title: 파도에 휩쓸리는 느낌
A_desc: 감당이 안 돼서 그냥 흘러가고 있어
B_emoji: ⚓
B_title: 닻을 찾고 있는 느낌
B_desc: 중심을 잡고 싶은데 뭔지를 모르겠어
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
content: 네가 고른 것들을 보면, 방향을 잃었다기보다 "하고 싶은 건 있는데 어디서부터 시작해야 할지 모르는" 상태에 더 가까운 것 같아. 에너지가 없는 게 아니야 — 그 에너지를 어디에 쏟아야 할지 몰라서 막힌 거 아닐까?
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
content: 만약 지금 하고 있는 걸 전부 내려놓을 수 있다면 — 아무것도 안 해도 되는 상태라면 — 그래도 불안할 것 같아? 홀가분할 것 같아? 그 답이, 지금 네가 진짜 원하는 게 뭔지 말해줄 거야.
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
technique: 시간여행
content: 1년 뒤의 네가 지금 이 순간을 돌아본다고 상상해봐. "그때 왜 그렇게 힘들었지?"라고 할 것 같아? 아니면 "그때 그 선택이 맞았어"라고 할 것 같아? 미래의 네가 지금 네게 가장 해주고 싶을 말이 느껴져?
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
      raw: `지금 이 순간 가장 필요한 게 뭐야?

[OPTIONS]
🎯 내가 뭘 원하는지 정리하고 싶어 [추천]
💬 그냥 누군가한테 털어놓고 싶어
🛌 잠깐 쉬어도 될 것 같아
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `그렇구나. 그러면 이런 건 어때?

[OPTIONS]
📝 한번 적으면서 정리해볼까 [추천]
🔍 비슷한 상황에서 다른 사람들이 어떻게 했는지 볼까
🤝 지금 이 상태로 좀 더 이야기해볼까
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `오늘 이 대화가 끝났을 때 어떻게 되면 좋겠어?

[OPTIONS]
💡 뭔가 하나라도 명확해지면 좋겠어 [추천]
🤝 혼자가 아닌 느낌이면 충분해
🌱 작더라도 다음 발걸음이 보이면 좋겠어
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
  ],
  5: [
    {
      raw: "다 털어놔봐. 지금 제일 무거운 게 뭔데?",
    },
    {
      raw: "그렇구나... 그게 언제부터 이렇게 된 거야?",
    },
    {
      raw: "네가 '막막하다'는 말을 자꾸 하는 게 느껴지는데 — 그 막막함이 어디서 오는 것 같아? 뭔가 막혀있는 느낌인지, 아니면 어디로 가야 할지를 모르는 느낌인지.",
    },
  ],
};

// 세션 요약 데모
const DEMO_SUMMARY =
  "오늘 네 마음을 함께 들여다봤어. 방향을 잃은 게 아니라, 하고 싶은 게 너무 많아서 어디서부터 시작할지 모르는 거였어. 에너지는 충분히 있어. 지금 당장 전부를 해결하려 하지 말고, 딱 하나만 골라서 첫 발을 내딛어봐.";

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
