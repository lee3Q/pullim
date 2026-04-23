// 사다리 세션 데모 모드 — API 키 없이 전체 UX 흐름 테스트
// 레벨별 mock 응답을 response-parser가 파싱할 수 있는 포맷으로 반환

import type { LadderLevel } from "./ladder-types";

export type ThemeKey = "모험가" | "달빛정원" | "전략실" | "천문대" | "종말";

interface DemoTurn {
  raw: string; // response-parser가 파싱하는 원본 포맷
}

// ── 기본 응답 (모험가 + 테마 무관 폴백) ──────────────────────────────────────
// 레벨 1-4: 각 8개 / 레벨 5: 9개 (이미 충분)
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
    {
      raw: `지금 몸 어디서 느껴져?

[SENSORY]
🫀|가슴이 답답한
🧠|머리가 복잡한
🫁|숨이 막히는 것 같은
🦴|어깨가 무거운
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `이런 느낌 중에 더 가까운 게 있어?

[SENSORY]
🌀|안개 속을 걷는 것 같은
⚡|뭔가 터질 것 같은
🍃|그냥 흘러가버리고 싶은
🌑|존재가 희미해지는 것 같은
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `지금 가장 하고 싶은 게 뭐야?

[SENSORY]
🛌|그냥 자고 싶은
🏃|어딘가 도망가고 싶은
🤐|아무것도 안 하고 싶은
🙈|다 무시하고 싶은
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `지금 이 감각, 어디서 왔을 것 같아?

[SENSORY]
🕰️|오래전부터 쌓인 느낌
🌩️|갑자기 터진 느낌
🔄|반복되는 느낌
❓|어디서 왔는지 모르겠는
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `마음의 온도가 있다면?

[SENSORY]
🧊|차갑게 얼어있는
🌡️|미열처럼 미묘하게 불편한
🔥|열이 펄펄 끓는
🫙|온기가 사라진 것 같은
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
    {
      raw: `어느 쪽이 지금 네 상황에 더 가까워?

[COMPARISON]
A_emoji: 🤝
A_title: 혼자 해결하고 싶어
A_desc: 내 문제는 내가 해결해야 한다는 느낌
B_emoji: 🆘
B_title: 누군가 도움이 필요해
B_desc: 혼자서는 한계인 것 같아
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `지금 이 두 가지, 어느 쪽이야?

[COMPARISON]
A_emoji: ⚡
A_title: 지금 당장 결정해야 해
A_desc: 더 미루면 안 될 것 같은 압박
B_emoji: 🤔
B_title: 좀 더 생각해봐야 해
B_desc: 아직 확신이 없어서 결정 못 하겠어
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `솔직하게 — 지금 더 끌리는 쪽은?

[COMPARISON]
A_emoji: 🔄
A_title: 포기하고 새로 시작하고 싶어
A_desc: 지금 이걸 계속하는 게 맞는지 모르겠어
B_emoji: 🏁
B_title: 지금 이걸 끝까지 해야 해
B_desc: 중간에 그만두면 후회할 것 같아
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `지금 어떤 게 더 필요해?

[COMPARISON]
A_emoji: 💬
A_title: 감정을 먼저 정리하고 싶어
A_desc: 마음이 정리되면 행동이 보일 것 같아
B_emoji: ⚡
B_title: 행동을 먼저 해야 해
B_desc: 일단 움직이면 감정도 따라올 것 같아
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `지금 네 마음이 더 어느 쪽이야?

[COMPARISON]
A_emoji: 🌱
A_title: 내가 틀렸을 수도 있어
A_desc: 다시 생각해봐야 할 것 같아
B_emoji: 🧭
B_title: 내가 맞는 것 같아
B_desc: 확신은 있는데 주변이 따라오질 않아
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
    {
      raw: `[ANALYSIS]
technique: 역할 바꾸기
content: 친한 친구가 지금 네 상황이라면 뭐라고 조언해줄 것 같아? 그 말, 지금 네 귀에 어떻게 들려? 스스로에겐 가장 엄한 게 사람이거든 — 친구한테 하듯 네 자신한테 해줄 수 있어?
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
technique: 핵심 가치
content: 지금 이 결정에서 포기할 수 없는 게 뭐야? 그게 네 핵심 가치야. 그걸 지키면서 나아갈 수 있는 방향이 있는지 — 거기서 다시 시작해봐.
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
technique: 패턴 분석
content: 이런 감각, 처음이 아니지? 전에도 비슷한 순간이 있었을 것 같은데 — 그때 어떻게 넘어왔어? 그 경험 안에 지금 쓸 수 있는 것이 있어.
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
technique: 작은 첫 발
content: 지금 이 상황을 한 번에 해결하려고 하니까 막막한 거야. 딱 한 가지만 — 오늘 할 수 있는 가장 작은 것. 그게 뭔지 보이는 게 있어?
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
technique: 감정 명명
content: 지금 이 감각에 이름을 붙인다면 뭐가 될 것 같아? "불안"인지 "슬픔"인지 "분노"인지 — 정확히 이름 붙이는 것만으로도 그 감정이 조금 다르게 느껴지거든.
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
    {
      raw: `지금 이 감각에 이름을 붙인다면?

[OPTIONS]
😮‍💨 지금 이 감정이 뭔지 이름 붙이고 싶어 [추천]
🔍 왜 이렇게 됐는지 찾고 싶어
💛 그냥 들어줬으면 해
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `지금 당장 뭐가 필요해?

[OPTIONS]
🎯 지금 당장 결정해야 할 게 있어 [추천]
🪞 일단 내 마음만 알고 싶어
💛 "괜찮아"라는 말이 듣고 싶어
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `지금 이 상황을 이해하고 싶어?

[OPTIONS]
🔎 왜 이렇게 됐는지 이해하고 싶어 [추천]
🗺️ 앞으로 어떻게 할지 계획이 필요해
😄 잠깐이라도 웃고 싶어
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `남은 에너지로 뭘 해야 할지 알고 싶어?

[OPTIONS]
⚡ 남은 에너지로 뭘 해야 할지 알고 싶어 [추천]
💭 이 감정을 어떻게 해야 할지 모르겠어
🤝 그냥 같이 있어줬으면 해
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
    },
    {
      raw: `솔직히 지금 어때?

[OPTIONS]
🪞 내가 과민반응하는 건지 알고 싶어 [추천]
🚪 이 상황에서 벗어나고 싶어
🌿 지금 이대로도 괜찮다는 걸 듣고 싶어
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
    {
      raw: "잠깐, 지금 네가 한 말 중에 중요한 게 있어. 그 부분 좀 더 이야기해줄래?",
    },
    {
      raw: "그러니까... 네가 진짜 원하는 건 뭐야? 머리로 생각하는 거 말고, 마음이 끌리는 쪽으로.",
    },
    {
      raw: "혹시 이 고민을 누군가한테 말해본 적 있어? 아니면 오늘이 처음이야?",
    },
    {
      raw: "지금 이야기 들으면서 느낀 건데, 네가 생각보다 많이 알고 있는 것 같거든. 다만 확신이 없는 거지.",
    },
    {
      raw: "만약 실패해도 아무도 뭐라 안 한다면, 뭘 해보고 싶어?",
    },
    {
      raw: "오늘 여기까지 이야기한 것만으로도 꽤 많이 왔어. 마지막으로 하나만 — 지금 이 순간 네 마음이 어때?",
    },
  ],
};

// ── 테마별 오버라이드 응답 ─────────────────────────────────────────────────────
// 기본값(모험가)보다 먼저 사용. 부족한 경우 기본값으로 폴백.
const THEME_RESPONSES: Partial<Record<ThemeKey, Partial<Record<LadderLevel, DemoTurn[]>>>> = {
  달빛정원: {
    1: [
      {
        raw: `지금 네 마음이 어떤 계절에 있는 것 같아?

[SENSORY]
🌸|봄처럼 새로 피어나는 중
🍂|가을처럼 무언가 끝나가는
❄️|겨울처럼 차갑게 얼어있는
🌧️|여름비처럼 쏟아내고 싶은
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `지금 이 기분, 어떤 꽃에 가까워?

[SENSORY]
🌹|아직 피지 않은 봉오리 같은
🥀|조금씩 시들어가는
🌻|햇빛을 찾고 있는
🍀|뿌리는 있는데 잎이 없는
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `지금 네 마음이 머무는 곳은?

[SENSORY]
🌿|조용한 숲속 오솔길
🌊|파도 소리 들리는 바닷가
🌙|달빛 비추는 정원
🌾|바람에 흔들리는 들판
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
    ],
    2: [
      {
        raw: `지금 이 상황, 어느 쪽이 더 가까워?

[COMPARISON]
A_emoji: 🌱
A_title: 씨앗이 막 트는 순간
A_desc: 시작은 했는데 어떻게 자랄지 모르겠어
B_emoji: 🥀
B_title: 꽃이 시드는 순간
B_desc: 한때는 잘 됐는데 지금은 힘이 빠지는 것 같아
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `두 개 중에 더 공감되는 게 있어?

[COMPARISON]
A_emoji: 🌧️
A_title: 비가 내려야 자라는 상황
A_desc: 힘들지만 이게 성장의 과정 같아
B_emoji: 🏜️
B_title: 메마른 땅에 혼자 서있는 느낌
B_desc: 에너지도 없고 물도 없어
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `지금 네 상황이 더 어떤 느낌이야?

[COMPARISON]
A_emoji: 🌙
A_title: 달이 뜨기 전 어두운 밤
A_desc: 아직은 어둡지만 곧 빛이 올 것 같아
B_emoji: ⛅
B_title: 구름이 해를 가리는 오후
B_desc: 빛이 있는 건 아는데 안 보여서 답답해
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
technique: 자연 관찰
content: 네가 고른 것들을 보면, 마치 가뭄 후의 땅처럼 — 뭔가를 기다리고 있는 것 같아. 비가 와야 꽃이 피듯, 지금 네가 필요한 건 시간인지, 아니면 방향인지. 그 차이가 느껴져?
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
technique: 계절 순환
content: 나무는 겨울에 죽은 게 아니야 — 봄을 준비하는 거잖아. 지금 네가 느끼는 멈춤이나 침묵이, 사실은 다음을 위한 준비일 수도 있어. 그 침묵 안에 뭐가 숨어있는 것 같아?
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
technique: 뿌리와 가지
content: 흔들리는 건 가지야, 뿌리가 아니야. 지금 네가 흔들린다고 느끼는 게 — 그게 표면적인 것인지, 아니면 정말 중심이 흔들리는 건지. 두 가지는 달라.
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
        raw: `이 순간, 네 마음의 정원에 필요한 게 뭐야?

[OPTIONS]
🌧️ 그냥 비가 좀 와줬으면 해 (정화가 필요해) [추천]
🌱 조용히 뿌리부터 다시 내리고 싶어
🌸 누군가 같이 물 줘줬으면 해
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `지금 가장 당기는 게 뭐야?

[OPTIONS]
🍃 잠깐 바람이나 맞으면서 쉬고 싶어 [추천]
🔍 왜 이렇게 됐는지 파악하고 싶어
🌱 작더라도 뭔가 심어보고 싶어
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `오늘 이 대화가 끝났을 때 어떻게 되면 좋겠어?

[OPTIONS]
🌙 오늘 하루 부드럽게 마무리되면 좋겠어 [추천]
🌱 작은 씨앗 하나라도 심은 느낌이면 좋겠어
🤝 혼자 서있는 느낌이 덜어지면 충분해
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
    ],
    5: [
      { raw: "달빛 아래, 조용히... 지금 제일 마음에 걸리는 게 뭐야?" },
      { raw: "그게 언제부터 이렇게 됐어?" },
      { raw: "지금 이 감정에 꽃 이름을 붙인다면 뭐가 될 것 같아?" },
      { raw: "혼자 정원을 가꾼다면, 지금 어느 부분이 제일 신경 쓰여?" },
      { raw: "밤바람 같은 사람이 되고 싶어? 아니면 아침 이슬 같은 사람?" },
      { raw: "이 고민, 씨앗이 될 수 있을까? 아니면 그냥 흙으로 돌아가는 게 맞아?" },
      { raw: "지금 네가 돌보고 싶은 게 있어?" },
      { raw: "한참 후에 돌아봤을 때 이 시간이 어떻게 기억됐으면 좋겠어?" },
    ],
  },

  전략실: {
    1: [
      {
        raw: `지금 상태를 진단해봐. 가장 가까운 신호는?

[SENSORY]
📊|데이터가 뒤섞인 느낌
⏱️|마감을 앞둔 긴장감
🔋|배터리가 다 된 상태
🎯|목표는 보이는데 길이 안 보이는
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `지금 네 시스템이 뭐라고 신호를 보내고 있어?

[SENSORY]
⚠️|경고등이 켜진 느낌
🔄|무한 루프에 빠진 느낌
📉|하락 곡선을 그리는 느낌
🔌|연결이 끊긴 느낌
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `이 상황을 숫자로 표현한다면?

[SENSORY]
0️⃣|완전히 바닥, 리셋이 필요한
5️⃣|중간, 어느 쪽으로도 갈 수 있는
8️⃣|거의 다 왔는데 마지막이 막힌
❓|측정 불가, 변수가 너무 많은
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
    ],
    2: [
      {
        raw: `지금 문제의 핵심이 뭐야?

[COMPARISON]
A_emoji: 📋
A_title: 실행력 부족
A_desc: 알고는 있는데 행동으로 옮기기가 힘들어
B_emoji: 🧭
B_title: 방향성 부재
B_desc: 열심히 하는데 올바른 방향인지 모르겠어
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `지금 네 상황이 더 어떤 느낌이야?

[COMPARISON]
A_emoji: 🔥
A_title: 리소스 과부하 상태
A_desc: 너무 많은 걸 처리하려다 과부하가 걸린 상태
B_emoji: 🧊
B_title: 모멘텀 상실 상태
B_desc: 멈춰있어서 다시 시작하기가 더 어려운 상태
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `이 두 가지 중에 더 공감되는 게 있어?

[COMPARISON]
A_emoji: 🔍
A_title: 문제를 더 분석해야 해
A_desc: 아직 뭐가 문제인지 파악을 못 했어
B_emoji: ⚡
B_title: 이미 알아, 실행만 하면 돼
B_desc: 머리로는 아는데 발이 안 떨어져
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
technique: 변수 분리
content: 지금 상황에서 컨트롤할 수 있는 것과 없는 것을 나눠봐. 네가 얘기한 것들 중에 네 손에 달린 건 뭐야? 그것만 봐도 다르게 보이는 게 있어?
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
technique: 최소 실행 단위
content: 지금 막혀있는 거, 너무 크게 생각하고 있는 건 아닐까? 가장 작게 쪼갠다면 — 오늘 당장 할 수 있는 제일 작은 한 걸음은 뭐야?
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
technique: 역방향 분석
content: 원하는 결과가 이미 일어났다고 가정해봐. 거기서 거꾸로 오면 — 지금 이 순간 뭘 하고 있어야 해? 그 역산이 지금 네가 우선해야 할 것을 보여줄 수 있어.
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
        raw: `지금 어떤 모드가 필요해?

[OPTIONS]
🔍 분석 모드 — 뭐가 문제인지 파악하고 싶어 [추천]
⚡ 실행 모드 — 그냥 바로 움직이고 싶어
🔋 충전 모드 — 지금은 쉬어야 할 것 같아
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `오늘 이 대화 끝에 뭘 갖고 싶어?

[OPTIONS]
📊 상황 파악 — 뭐가 문제인지 정리 [추천]
🗺️ 다음 행동 계획 — 구체적으로 뭘 할지
💡 관점 전환 — 다른 시각으로 보고 싶어
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `오늘 이 대화가 끝났을 때 어떻게 되면 좋겠어?

[OPTIONS]
🎯 하나의 명확한 다음 행동이 보이면 좋겠어 [추천]
📝 지금까지의 생각이 정리되면 충분해
🔋 조금이라도 에너지가 회복되면 좋겠어
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
    ],
    5: [
      { raw: "지금 상황을 분석한다면, 어디서 막혀있어?" },
      { raw: "변수를 하나 바꿀 수 있다면 뭘 바꾸고 싶어?" },
      { raw: "지금 컨트롤할 수 있는 것과 없는 것을 구분해본다면?" },
      { raw: "이 문제, 1주일 전 네가 봤을 때도 같은 결론이었을 것 같아?" },
      { raw: "지금 네가 가진 정보로 내릴 수 있는 최선의 판단은 뭐야?" },
      { raw: "만약 신뢰할 수 있는 사람한테 이 상황을 설명한다면 뭐라고 말할 것 같아?" },
      { raw: "지금 네가 가장 우선순위를 두고 있는 게 뭐야?" },
      { raw: "그 결정, 한 달 후에도 같은 판단일 것 같아?" },
    ],
  },

  천문대: {
    1: [
      {
        raw: `지금 네 마음이 어떤 별 같아?

[SENSORY]
⭐|멀리서 희미하게 빛나는
💫|빠르게 떨어지고 있는
🌑|달이 없는 밤처럼 어두운
🌟|갑자기 환해진 것 같은
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `우주에서 지금 네 위치는?

[SENSORY]
🛸|어디로 가야 할지 모르고 떠도는
🪐|궤도를 벗어난 것 같은
🌌|무한한 가능성 앞에 얼어붙은
🔭|뭔가를 찾고 있는데 안 보이는
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `지금 이 감각, 어느 쪽에 더 가까워?

[SENSORY]
🌠|무언가 반짝이기 시작하는 느낌
🌫️|우주 먼지처럼 흩어지는 느낌
☄️|무언가 충돌할 것 같은 느낌
🌙|조용하고 고요한 달 같은 느낌
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
    ],
    2: [
      {
        raw: `지금 상황, 어떤 느낌이야?

[COMPARISON]
A_emoji: 🔭
A_title: 먼 곳을 바라보고 있어
A_desc: 꿈은 크고 선명한데 지금 위치가 너무 멀게 느껴져
B_emoji: 🌑
B_title: 빛을 잃어버린 것 같아
B_desc: 예전엔 빛났는데 지금은 그 빛이 어디 갔는지 모르겠어
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `이 두 가지 중에 더 공감되는 게 있어?

[COMPARISON]
A_emoji: ☄️
A_title: 모든 게 빠르게 지나가는 느낌
A_desc: 따라잡을 수가 없어서 지쳐
B_emoji: ⏳
B_title: 시간이 멈춘 것 같은 느낌
B_desc: 나만 멈춰있고 세상이 움직이는 것 같아
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `지금 네 마음의 우주 지도, 어떤 모양이야?

[COMPARISON]
A_emoji: 🌌
A_title: 수많은 별이 가득한
A_desc: 하고 싶은 건 많은데 어디서 시작해야 할지 모르겠어
B_emoji: 🕳️
B_title: 블랙홀처럼 빨아들이는
B_desc: 에너지도, 의지도 다 사라지는 것 같아
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
technique: 먼 별의 빛
content: 지금 보이는 별빛은 수천 년 전에 출발한 거야. 지금 네가 느끼는 이 감정도 — 지금 막 생긴 게 아닐 수 있어. 오래전에 시작된 무언가가 지금 보이는 건 아닐까?
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
technique: 항법 별자리
content: 옛날 선원들은 별을 보고 방향을 잡았어. 네 인생에서 지금도 빛나고 있는 '항법 별' — 변하지 않는 가치나 사람이 있어? 그게 지금 어디를 가리키고 있는 것 같아?
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
technique: 중력 관찰
content: 무엇이 지금 네 에너지를 끌어당기고 있어? 두려움인지, 욕망인지, 책임감인지. 그 중력의 중심에 있는 게 뭔지 알면 — 지금 네가 왜 이쪽으로 끌리는지 이해할 수 있어.
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
        raw: `오늘 밤 천문대에서, 네 마음의 별자리를 그린다면?

[OPTIONS]
🔭 더 자세히 들여다보고 싶어 [추천]
🌟 일단 빛나는 것부터 찾아보고 싶어
🌙 지금은 그냥 바라보고 싶어
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `우주 속 네 위치, 지금 어떻게 느껴져?

[OPTIONS]
🛸 어디로든 갈 수 있는 자유를 느끼고 싶어 [추천]
⭐ 내가 어떤 별인지 알고 싶어
🌑 지금은 어두움 속에 있어도 괜찮아
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `오늘 이 대화 끝에 뭘 갖고 가고 싶어?

[OPTIONS]
💫 한 줄기 빛이라도 보이면 충분해 [추천]
🗺️ 다음에 향할 방향이 하나라도 보이면 좋겠어
🌌 지금 이 감각을 온전히 느끼고 싶어
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
    ],
    5: [
      { raw: "우주처럼 광대한 네 마음 속, 지금 제일 밝게 빛나는 게 뭐야?" },
      { raw: "그 꿈이 처음 보이기 시작한 건 언제야?" },
      { raw: "별이 빛나는 건 혼자야 — 근데 별자리는 연결이잖아. 지금 너한테 연결되는 별이 있어?" },
      { raw: "지금 네 궤도, 네가 원하는 방향으로 가고 있어?" },
      { raw: "가끔 빛이 안 보일 때 있어? 그럴 때 어떻게 해?" },
      { raw: "만약 네가 별을 이름 붙일 수 있다면, 오늘 이 순간에 어떤 이름을 붙일 것 같아?" },
      { raw: "이 고민이 해결된다면, 그 이후 세상은 어떤 모습이야?" },
      { raw: "마지막으로 — 지금 네 마음이 어때?" },
    ],
  },

  종말: {
    1: [
      {
        raw: `극한 상황에서 드러나는 진짜 감각 — 지금 어느 쪽이 더 가까워?

[SENSORY]
🔥|불이 꺼지기 직전처럼 아직 타오르는
🧊|모든 게 얼어붙은 것 같은
🌪️|모든 게 무너지는 것 같은
💀|이미 다 끝난 것 같은
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `살아남은 자의 감각 — 지금 네 안에 있는 게 뭐야?

[SENSORY]
⚔️|싸워서라도 지키고 싶은 것이 있는
🏃|지금 당장 뛰어야 할 것 같은
🫀|아직 심장이 뛰고 있다는 걸 아는
🌑|아무것도 느끼지 못하는
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `세상 끝에서, 남은 에너지로 뭘 하고 싶어?

[SENSORY]
🌅|마지막 일출을 보고 싶은
📝|남기고 싶은 무언가가 있는
🤝|곁에 있고 싶은 사람이 있는
😶|아무것도 하고 싶지 않은
[/SENSORY]
[CHEAT]다 별로야[/CHEAT]`,
      },
    ],
    2: [
      {
        raw: `극한 상황에서 네 선택은?

[COMPARISON]
A_emoji: ⚔️
A_title: 끝까지 버티기
A_desc: 힘들어도 여기서 포기하면 다 무너지는 것 같아
B_emoji: 🏕️
B_title: 살아남기 위해 후퇴하기
B_desc: 지금 이 싸움은 이길 수 없어 — 살아남는 게 먼저야
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `지금 네 감각, 어느 쪽이 더 맞아?

[COMPARISON]
A_emoji: 🔥
A_title: 아직 불씨가 있어
A_desc: 힘들지만 포기하기 싫어. 뭔가 남아있어
B_emoji: 💧
B_title: 불이 꺼져가고 있어
B_desc: 더 이상 버틸 에너지가 없는 것 같아
[/COMPARISON]
[OPTIONS]
🤷 둘 다 아닌데
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `지금 네 상황이 더 어떤 느낌이야?

[COMPARISON]
A_emoji: 🌪️
A_title: 통제할 수 없는 혼돈
A_desc: 상황이 내 손을 벗어났어. 뭘 해도 안 될 것 같아
B_emoji: 🏔️
B_title: 험한 길이지만 길은 있어
B_desc: 힘들지만 이게 유일한 길인 것 같아
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
technique: 생존 본능
content: 극한 상황에서 인간이 버티는 건 "의미" 때문이야. 지금 네가 이 고민을 하고 있다는 것 자체가 — 아직 포기 안 했다는 거야. 그 버티는 힘의 근원, 뭔지 알아?
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
technique: 핵심만 남기기
content: 모든 걸 다 잃어도 남길 수 있는 게 하나 있다면 뭐야? 그게 지금 네가 진짜 지키고 싶은 거야. 그 핵심을 중심으로 다시 생각하면, 지금 뭘 해야 할지가 보일 수 있어.
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
technique: 극한의 명확성
content: 다 무너질 것 같을 때 오히려 뭐가 가장 중요한지 선명해지는 순간이 있어. 지금 그 압박 속에서 — 절대 놓치고 싶지 않은 게 뭔지 느껴져?
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
        raw: `세상이 흔들릴 때, 지금 네가 필요한 건?

[OPTIONS]
🔥 아직 타오를 불씨를 찾고 싶어 [추천]
🛡️ 지켜야 할 것을 확인하고 싶어
🏃 지금 당장 움직여야 해
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `극한의 순간, 본질로 돌아간다면?

[OPTIONS]
💡 내가 진짜 원하는 게 뭔지 알고 싶어 [추천]
⚔️ 싸울 가치가 있는지 판단하고 싶어
🫀 살아있다는 느낌을 되찾고 싶어
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
      {
        raw: `오늘 이 대화 끝에 뭘 갖고 가고 싶어?

[OPTIONS]
🔥 작은 불씨 하나라도 [추천]
🗡️ 계속 나아갈 이유
🌅 내일을 볼 수 있다는 확신
🤷 모르겠어
[/OPTIONS]
[CHEAT]다 별로야[/CHEAT]`,
      },
    ],
    5: [
      { raw: "세상이 내일 끝난다면, 오늘 뭘 하고 싶어?" },
      { raw: "이 고민, 100년 후에도 중요할까? 아니면 지금만 이렇게 느껴지는 걸까?" },
      { raw: "지금 진짜 살아있다는 느낌이 드는 게 있어?" },
      { raw: "가장 힘든 순간에 버틸 수 있게 해주는 게 뭐야?" },
      { raw: "모든 걸 다 내려놓는다면, 뭘 제일 마지막에 내려놓을 것 같아?" },
      { raw: "네가 진짜 두려워하는 게 뭐야?" },
      { raw: "이 압박 속에서도 사라지지 않는 게 뭐야?" },
      { raw: "마지막으로 — 지금 이 순간, 살아있다는 느낌이 들어?" },
    ],
  },
};

// ── 테마별 세션 요약 ──────────────────────────────────────────────────────────
const THEME_SUMMARY_MAP: Record<ThemeKey, string> = {
  모험가:
    "오늘 함께 걸어온 길 — 막힌 것처럼 보이던 갈림길에서, 네가 사실은 이미 방향을 알고 있었어. 다만 확신이 필요했을 뿐. 한 발씩, 네 속도로 가도 충분해.",
  달빛정원:
    "오늘 네 마음의 정원을 함께 거닐었어. 시들어 보이던 것들도 사실 뿌리는 살아있어. 천천히, 비가 오면 꽃이 피듯이 — 지금 이 침묵도 성장의 일부야.",
  전략실:
    "오늘 대화를 통해 한 가지 분명해진 것 — 문제는 이미 파악하고 있어. 다음 단계는 하나를 골라 실행하는 것. 완벽한 계획보다 작은 실행이 더 많은 걸 알려줄 거야.",
  천문대:
    "오늘 밤 별을 바라보며 알게 된 것 — 네가 찾고 있는 빛은 이미 어딘가에 있어. 지금은 구름 뒤에 가려있을 뿐. 맑아지면 반드시 보일 거야.",
  종말:
    "극한 속에서 드러난 것 — 네 안에 아직 불씨가 있어. 다 끝난 것처럼 느껴질 때도 살아남는 이유가 있는 사람은 달라. 그 이유, 기억해.",
};

/**
 * 테마별 데모 세션 요약 반환 (폴백용)
 */
export function getDemoSummary(theme?: ThemeKey): string {
  if (!theme || !(theme in THEME_SUMMARY_MAP)) {
    return THEME_SUMMARY_MAP["모험가"];
  }
  return THEME_SUMMARY_MAP[theme];
}

/**
 * 사용자의 실제 선택/입력을 반영한 세션 요약
 *
 * 철학 근거:
 * - 절대 금지 "사용자가 입력한 걸 정리만 해서 돌려주기"와 구분:
 *   여기서는 사용자 단어 + 패턴(반복/전환)을 "발견"으로 재구성.
 *   단순 복창이 아닌, "네가 보여준 경향"을 한 문장으로 엮는다.
 * - API 실패 시에도 세션이 비어보이지 않도록 — "끝까지 포기하지 않는다" 원칙.
 */
export function buildContextualSummary(params: {
  theme?: ThemeKey;
  userMessages: string[];
  cheatCount: number;
  levelsVisited: number[];
}): string {
  const { theme, userMessages, cheatCount, levelsVisited } = params;
  const base = getDemoSummary(theme);

  if (userMessages.length === 0) {
    return base;
  }

  // 사용자가 실제로 고른 것 중 마지막 2개 추출 (이모지 포함 선택지)
  const lastChoices = userMessages
    .slice(-3)
    .map((m) => m.trim())
    .filter((m) => m.length > 0 && m.length <= 40);

  // 레벨 전환 횟수 (깊이로 들어갔는지)
  const uniqueLevels = new Set(levelsVisited).size;

  const fragments: string[] = [];

  if (lastChoices.length > 0) {
    // 마지막 선택을 "오늘 네가 머문 자리"로 표현
    fragments.push(`오늘 네가 고른 것 — "${lastChoices[lastChoices.length - 1]}".`);
  }

  if (uniqueLevels >= 3) {
    fragments.push("여러 레벨을 오가면서도 끝까지 따라왔어.");
  } else if (uniqueLevels === 1) {
    fragments.push("한 자리에서 조용히 머물렀어. 그것도 풀림이야.");
  }

  if (cheatCount >= 2) {
    fragments.push("맞지 않으면 그만, 이라고 말할 줄 아는 건 사실 드문 거야.");
  } else if (cheatCount === 0 && userMessages.length >= 3) {
    fragments.push("다 별로야를 한 번도 안 눌렀네. 오늘은 따라와 줬어.");
  }

  // 테마 맛깔 문장으로 마무리
  fragments.push(base.split(" — ").slice(-1)[0] || base);

  return fragments.join(" ").trim();
}

/**
 * 사다리 세션 데모 응답 생성
 * theme 파라미터 추가: 테마별 응답 우선 사용, 없으면 기본값(모험가) 폴백
 * 기존 3-파라미터 시그니처는 하위호환 유지 (theme 생략 시 모험가 기본값)
 */
export function getDemoLadderResponse(
  level: LadderLevel,
  turnCount: number,
  isSummaryMode: boolean,
  theme?: ThemeKey
): string {
  if (isSummaryMode) {
    return getDemoSummary(theme);
  }

  const themedResponses = theme ? (THEME_RESPONSES[theme]?.[level] ?? []) : [];
  const baseResponses = LEVEL_RESPONSES[level];

  // 테마 응답 먼저, 이후 기본값으로 채움
  const merged = [...themedResponses, ...baseResponses];
  const index = turnCount % merged.length;
  return merged[index].raw;
}
