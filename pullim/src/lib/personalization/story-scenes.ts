// 테마별 스토리형 파악 장면 데이터
// 각 장면: 일러스트 + 나레이션 + 2-3개 선택지 (추천 표시)
// 선택은 이야기의 일부처럼 느끼게, 성격 측정은 뒤에서.
// "벤치에 앉을래 지나갈래?" > "너는 분석적이야 직관적이야?"

export type ThemeType = "adventure" | "garden" | "strategy";
export type Axis = "approach" | "risk" | "coping" | "decision";

export interface Signal {
  axis: Axis;
  value: number; // -1 ~ +1
}

export interface StoryChoice {
  emoji: string;
  label: string;
  spicyLabel?: string;
  signals: Signal[];
  recommended?: boolean;
}

export interface StoryScene {
  id: string;
  illustration: string; // 일러스트 설명 (나중에 이미지로 교체)
  imagePath?: string;   // 실제 이미지 경로 (있으면)
  narrative: string;    // 나레이션 텍스트
  choices: StoryChoice[];
}

export interface ThemeStory {
  theme: ThemeType;
  name: string;
  bgImage: string;
  introText: string;
  scenes: StoryScene[];
  outroNarrative: string;
  outroButtonText: string;
  outroImagePath?: string;
  minScenes: number;         // 최소 장면 수 (이후 계속/시작 선택)
  continuePrompt: string;    // "계속 산책할래?"
  startPrompt: string;       // "여기서 시작하기"
}

// ═══════════════════════════════════════════
// 달빛정원 — 산책 + 만남 + 대화 + 철학
// ═══════════════════════════════════════════

const GARDEN_SCENES: StoryScene[] = [
  {
    id: "garden_1",
    illustration: "안개 낀 정원 입구, 작은 돌계단, 양쪽에 꽃, 멀리 벤치가 보임",
    imagePath: "/assets/discovery/garden_1.jpg",
    narrative: "안개가 발목까지 내려와 있어.\n여기가 정원이야.\n\n두 갈래 길이 보여.\n한쪽은 꽃이 활짝 핀 길,\n다른 쪽은 오래된 돌담이 이어지는 길.",
    choices: [
      { emoji: "🌸", label: "꽃길 — 먼저 눈이 간다", spicyLabel: "꽃길 ㅋㅋ 플래그 아님?", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "🪨", label: "돌담길 — 오래된 것 같다", spicyLabel: "ㄹㅇ 예쁜 건 다 함정", signals: [{ axis: "risk", value: -1 }], recommended: true },
    ],
  },
  {
    id: "garden_2",
    illustration: "길을 걷다 벤치에 앉아있는 누군가 발견, 등을 보이고 있음",
    imagePath: "/assets/discovery/garden_2.jpg",
    narrative: "발소리를 죽이게 되는 고요함 속에\n벤치에 누군가 있어.\n\n등만 보이는데,\n어깨가 조금 처져 있어.",
    choices: [
      { emoji: "🤝", label: "옆에 앉는다", spicyLabel: "앉 ㅋ 어차피 외로운 거지", signals: [{ axis: "coping", value: 1 }, { axis: "approach", value: 1 }] },
      { emoji: "👀", label: "발소리를 줄여 지나간다", spicyLabel: "알빠노", signals: [{ axis: "coping", value: -1 }, { axis: "approach", value: -1 }], recommended: true },
      { emoji: "💬", label: "\"괜찮아요?\" 말을 건다", spicyLabel: "안 물어보면 내가 나쁜놈 되는 구조", signals: [{ axis: "coping", value: -1 }, { axis: "approach", value: 1 }] },
    ],
  },
  {
    id: "garden_3",
    illustration: "벤치 옆에 앉음, 상대가 고개를 돌림, 살짝 미소",
    imagePath: "/assets/discovery/garden_3.jpg",
    narrative: "옆에 앉으니\n그 사람이 천천히 고개를 돌려.\n\"...고마워요.\"\n\n서로 말이 없어.\n어색하지는 않아.\n그 사람이 조용히 물어.\n\n\"혹시 여기 자주 와요?\"",
    choices: [
      { emoji: "😌", label: "\"아니요, 처음이에요\"", spicyLabel: "첨 본 사이에 신상 털기?", signals: [{ axis: "approach", value: 1 }] },
      { emoji: "🌙", label: "\"생각이 많은 날엔 오게 돼요\"", spicyLabel: "머리 터질 것 같으면 걷는 게 답", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "🤷", label: "\"그냥 발이 이끄는대로\"", spicyLabel: "ㅇㅇ 이유 없음", signals: [{ axis: "decision", value: 1 }], recommended: true },
    ],
  },
  {
    id: "garden_4",
    illustration: "두 사람이 정원 연못을 바라보고 있음, 수면에 달이 비침",
    imagePath: "/assets/discovery/garden_4.jpg",
    narrative: "나란히 연못가에 서서\n수면에 비친 달을 바라봐.\n\n한참 말이 없던 그 사람이 물어.\n\"저 달, 진짜일까요.\n아니면 물에 비친 게 진짜일까요?\"",
    choices: [
      { emoji: "🌕", label: "\"둘 다 진짜지\"", spicyLabel: "둘 다 어차피 알빠노", signals: [{ axis: "approach", value: 1 }] },
      { emoji: "💧", label: "\"비친 게 더 예뻐\"", spicyLabel: "ㄹㅇ 필터가 본체", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "🤔", label: "\"그게 중요한 거야?\"", spicyLabel: "갑자기 철학과냐", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  // ─── 이후 보너스 장면 (계속 산책) ───
  {
    id: "garden_5",
    illustration: "정원에 빗방울이 떨어지기 시작, 멀리 정자가 보임",
    imagePath: "/assets/discovery/garden_5.jpg",
    narrative: "이야기를 나누는 사이\n빗방울이 하나씩 떨어지기 시작해.\n\n멀리 정자가 보여.\n비가 빠르게 굵어지고 있어.",
    choices: [
      { emoji: "☂️", label: "정자로 뛰어간다", spicyLabel: "감기 걸리면 누가 책임짐?", signals: [{ axis: "risk", value: -1 }] },
      { emoji: "🌧️", label: "비를 맞으며 걷는다", spicyLabel: "어차피 ㅈ된 거 빡세게 ㄱㄱ", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "🤲", label: "잠깐 하늘을 올려다본다", spicyLabel: "인생 자체가 비인데 뭘", signals: [{ axis: "decision", value: 1 }], recommended: true },
    ],
  },
  {
    id: "garden_6",
    illustration: "비가 그치고, 나비 한 마리가 손 근처에 맴돎",
    imagePath: "/assets/discovery/garden_6.jpg",
    narrative: "비가 그쳤어.\n나비 한 마리가 날아와\n손 가까이에 맴돌아.\n\n가만히 있으면 앉을 것 같은데.",
    choices: [
      { emoji: "🤚", label: "가만히 기다린다", spicyLabel: "집착 ㄴㄴ", signals: [{ axis: "decision", value: -1 }] },
      { emoji: "🦋", label: "살짝 손을 뻗어본다", spicyLabel: "ㄱㄱ 까이면 그때 울어", signals: [{ axis: "approach", value: 1 }], recommended: true },
      { emoji: "📸", label: "눈에 담아두기만 한다", spicyLabel: "만지면 도망감 ㅋ", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  {
    id: "garden_7",
    illustration: "커다란 나무 줄기에 오래된 글씨가 새겨져 있음",
    imagePath: "/assets/discovery/garden_7.jpg",
    narrative: "큰 나무 밑을 지나다\n줄기에 뭔가 새겨진 걸 발견해.\n\n가까이 가보니—\n\"여기 온 사람들은 다 이유가 있었어.\"\n\n손끝으로 만지면 꽤 오래된 글씨야.",
    choices: [
      { emoji: "🤔", label: "누가 썼을까 궁금하다", spicyLabel: "쓸데없는 궁금증 발동 ㅋ", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "😊", label: "왠지 위로가 된다", spicyLabel: "ㅋㅋ 나 이런 거에 약함 ㅅㅂ", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "✍️", label: "나도 뭔가 남기고 싶다", spicyLabel: "여기왔다 안 남기면 손해", signals: [{ axis: "risk", value: 1 }] },
    ],
  },
  {
    id: "garden_8",
    illustration: "정원 한쪽에 물뿌리개가 놓여 있고, 시든 꽃이 보임",
    imagePath: "/assets/discovery/garden_8.jpg",
    narrative: "정원 한쪽에\n물뿌리개가 놓여 있어.\n\n옆에 시든 꽃 몇 송이.\n물을 주면 살아날 것 같기도 하고.",
    choices: [
      { emoji: "💧", label: "물을 줘본다", spicyLabel: "내가 뭔데 구원자 코스프레함", signals: [{ axis: "coping", value: -1 }] },
      { emoji: "🌿", label: "자연에 맡긴다", spicyLabel: "알아서 크는 풀이 잡초임", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "🔍", label: "왜 시들었는지 살펴본다", spicyLabel: "원인도 모르고 물 주면 노답 ㅋ", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  {
    id: "garden_9",
    illustration: "따뜻한 돌 위에 고양이가 웅크리고 있음, 눈을 반쯤 뜨고",
    imagePath: "/assets/discovery/garden_9.jpg",
    narrative: "따뜻한 돌 위에\n고양이가 웅크리고 있어.\n\n눈을 반쯤 뜨고\n이쪽을 보는 것 같기도 하고.",
    choices: [
      { emoji: "🐱", label: "다가가서 쓰다듬는다", spicyLabel: "고양이 보면 손이 먼저 감", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "🪑", label: "근처에 앉아서 같이 쉰다", spicyLabel: "ㅇㅇ 각자 알아서 쉬자", signals: [{ axis: "decision", value: -1 }], recommended: true },
      { emoji: "🫡", label: "눈인사만 나누고 지나간다", spicyLabel: "고양이한테 오지랖 ㄴㄴ", signals: [{ axis: "risk", value: -1 }] },
    ],
  },
  {
    id: "garden_10",
    illustration: "안개 낀 정원 깊은 곳에서 작은 종소리가 들림",
    imagePath: "/assets/discovery/garden_10.jpg",
    narrative: "안개가 다시 내려오는데\n어디선가 작은 종소리가 들려.\n\n소리가 나는 쪽은\n가본 적 없는 길이야.",
    choices: [
      { emoji: "🔔", label: "소리를 따라간다", spicyLabel: "호기심 참으면 병 걸림", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "🧘", label: "멈춰서 소리만 듣는다", spicyLabel: "알면 뭐함 ㅋ 그냥 좋은 소리", signals: [{ axis: "decision", value: -1 }], recommended: true },
      { emoji: "🔙", label: "왔던 길로 돌아간다", spicyLabel: "귀찮 ㅋ 롤하러 감", signals: [{ axis: "risk", value: -1 }] },
    ],
  },
];

// ═══════════════════════════════════════════
// 모험가 — 탐험 + 동료 + 위기 + 결단
// ═══════════════════════════════════════════

const ADVENTURE_SCENES: StoryScene[] = [
  {
    id: "adventure_1",
    illustration: "울창한 숲 입구, 두 갈래 길, 한쪽은 밝고 한쪽은 어두움",
    imagePath: "/assets/discovery/adventure_1.jpg",
    narrative: "낙엽 밟히는 소리.\n숲이 시작됐어.\n\n두 갈래 길.\n한쪽은 햇빛이 쏟아지는 넓은 길,\n다른 쪽은 어둑하지만 새소리가 선명한 좁은 길.",
    choices: [
      { emoji: "☀️", label: "넓은 길 — 빛이 보이는 쪽으로", spicyLabel: "어두운 데 = 일단 패스", signals: [{ axis: "risk", value: -1 }] },
      { emoji: "🌲", label: "좁은 길 — 그 소리가 계속 마음에 걸린다", spicyLabel: "안전한 길 = 노잼", signals: [{ axis: "risk", value: 1 }], recommended: true },
    ],
  },
  {
    id: "adventure_2",
    illustration: "숲 속 빈터에 오래된 보물상자, 자물쇠가 걸려 있음",
    imagePath: "/assets/discovery/adventure_2.jpg",
    narrative: "빈터 한가운데 낡은 상자가 있어.\n이끼가 낀 자물쇠.\n옆에 열쇠 같은 게 놓여 있어.\n\n...방금, 상자가 움직인 것 같은데.",
    choices: [
      { emoji: "🔑", label: "열쇠를 들어 조심히 연다", spicyLabel: "함정이면? ㅋ 리셋하면 되지", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "💪", label: "그냥 뚜껑을 잡아당긴다", spicyLabel: "까봐야 앎 ㅋ 뜯어", signals: [{ axis: "approach", value: 1 }], recommended: true },
      { emoji: "👁️", label: "좀 더 관찰한다", spicyLabel: "호기심 고양이 꼴 나기 싫으면", signals: [{ axis: "decision", value: -1 }] },
    ],
  },
  {
    id: "adventure_3",
    illustration: "길 옆에 쓰러진 여행자, 발목을 잡고 있음",
    imagePath: "/assets/discovery/adventure_3.jpg",
    narrative: "길 옆에서 신음소리가 들려.\n누군가 쓰러져서 발목을 잡고 있어.\n\n위급하진 않은데\n혼자 일어서긴 힘들어 보여.",
    choices: [
      { emoji: "🏥", label: "약초를 찾으러 간다", spicyLabel: "위로가 밥 먹여줌?", signals: [{ axis: "coping", value: -1 }] },
      { emoji: "🤝", label: "옆에 앉아서 말을 건다", spicyLabel: "옆에 있어달라고 안 했는데 ㅋ", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "🗺️", label: "근처 마을까지 거리를 확인한다", spicyLabel: "감성팔이 ㄴㄴ 실질적으로", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  {
    id: "adventure_4",
    illustration: "어둠 속에서 빛나는 눈, 묵직한 목소리가 울림",
    imagePath: "/assets/discovery/adventure_4.jpg",
    narrative: "어둠 속에서 낮고 무거운 목소리.\n\n\"여행자여.\n소원 하나를 들어주지.\n단—지금 이 순간 말해야만 해.\"",
    choices: [
      { emoji: "💭", label: "\"잠깐, 생각할 시간을 줘\"", spicyLabel: "수상한 데서 소원 빌면 노답", signals: [{ axis: "decision", value: -1 }] },
      { emoji: "⚡", label: "망설임 없이 대답한다", spicyLabel: "ㄹㅇ 이미 정했으면서 ㅋ", signals: [{ axis: "decision", value: 1 }], recommended: true },
      { emoji: "🤨", label: "\"왜 갑자기? 뭘 원하는 건데?\"", spicyLabel: "공짜? ㅋㅋ 어디서 사기를", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  // ─── 보너스 장면 ───
  {
    id: "adventure_5",
    illustration: "절벽 끝에 반짝이는 것이 보임, 낡은 밧줄이 매달려 있음",
    imagePath: "/assets/discovery/adventure_5.jpg",
    narrative: "절벽 끝에 뭔가 반짝이고 있어.\n내려가면 볼 수 있는데\n밧줄이 꽤 낡아 있어.\n\n돌아가는 길은 시간이 한참 걸려.",
    choices: [
      { emoji: "🧗", label: "밧줄을 잡고 내려간다", spicyLabel: "안 하고 후회 vs 하고 후회", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "🔍", label: "다른 길을 찾아본다", spicyLabel: "반짝이는 건 99% 쓰레기", signals: [{ axis: "risk", value: -1 }], recommended: true },
      { emoji: "🪨", label: "돌을 던져서 밧줄 상태를 확인한다", spicyLabel: "이건 용기가 아니라 바보짓", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  {
    id: "adventure_6",
    illustration: "세 갈래 길, 이정표가 있지만 글씨가 지워져 있음",
    imagePath: "/assets/discovery/adventure_6.jpg",
    narrative: "세 갈래 길이야.\n이정표가 있는데 글씨가 다 지워져 있어.\n\n감각에 의존할 수밖에 없어.\n왼쪽에서 물소리.\n가운데는 조용해.\n오른쪽에서 연기 냄새.",
    choices: [
      { emoji: "💧", label: "물소리 쪽으로", spicyLabel: "물소리 ㅋㅋ 변소일수도", signals: [{ axis: "coping", value: 1 }] },
      { emoji: "🤫", label: "조용한 가운데 길로", spicyLabel: "조용한 게 제일 안전함", signals: [{ axis: "risk", value: -1 }], recommended: true },
      { emoji: "🔥", label: "연기 냄새 쪽으로", spicyLabel: "연기 나는 데 = 뭔가 있음", signals: [{ axis: "risk", value: 1 }] },
    ],
  },
  {
    id: "adventure_7",
    illustration: "작은 마을, 간판이 기울어진 여인숙, 안에서 불빛과 웃음소리",
    imagePath: "/assets/discovery/adventure_7.jpg",
    narrative: "작은 마을에 도착했어.\n여인숙 창문 너머로 불빛과 웃음소리가 새어 나와.\n\n따뜻해 보이는데\n뭔가 어색한 기운도 함께 느껴져.",
    choices: [
      { emoji: "🏠", label: "들어가서 쉰다", spicyLabel: "판단력 0인데 뭘 함 ㅋ 자자", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "⛺", label: "마을 밖에서 야영한다", spicyLabel: "인싸력 0 충전 필요", signals: [{ axis: "risk", value: -1 }] },
      { emoji: "🍺", label: "들어가서 사람들 속에 섞인다", spicyLabel: "술 = 진실의 세럼", signals: [{ axis: "approach", value: -1 }], recommended: true },
    ],
  },
  {
    id: "adventure_8",
    illustration: "깊은 동굴, 안쪽에서 푸른 빛이 새어 나옴",
    imagePath: "/assets/discovery/adventure_8.jpg",
    narrative: "동굴 입구가 보여.\n안쪽 깊은 곳에서 푸른 빛이 새어 나와.\n\n아름다워.\n뭔지는 알 수 없어.",
    choices: [
      { emoji: "✨", label: "빛을 향해 들어간다", spicyLabel: "겁나면 집에 있던가", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "🗣️", label: "\"거기 누구 있어?\" 소리쳐본다", spicyLabel: "선빵필승", signals: [{ axis: "approach", value: 1 }] },
      { emoji: "📝", label: "입구에서 관찰만 한다", spicyLabel: "들어가면 나오는 게 문제 ㅋ", signals: [{ axis: "approach", value: -1 }], recommended: true },
    ],
  },
  {
    id: "adventure_9",
    illustration: "넓은 강, 물살이 세 보임, 멀리 다리의 잔해",
    imagePath: "/assets/discovery/adventure_9.jpg",
    narrative: "길이 강가에서 끊겨 있어.\n물살이 꽤 세 보여.\n\n다리는 부서져 있고,\n더 가면 얕은 곳이 있을지도 몰라.",
    choices: [
      { emoji: "🏊", label: "여기서 건너본다", spicyLabel: "돌아가면 시간 ㅈ버림", signals: [{ axis: "risk", value: 1 }, { axis: "decision", value: 1 }] },
      { emoji: "🚶", label: "얕은 곳을 찾아간다", spicyLabel: "빡세도 가야 함", signals: [{ axis: "risk", value: -1 }, { axis: "decision", value: -1 }], recommended: true },
      { emoji: "🛠️", label: "잔해로 뗏목을 만든다", spicyLabel: "ㅋㅋ 맥가이버 코스프레", signals: [{ axis: "coping", value: -1 }] },
    ],
  },
  {
    id: "adventure_10",
    illustration: "높은 탑 꼭대기, 사방이 보이고 바람이 세게 붊",
    imagePath: "/assets/discovery/adventure_10.jpg",
    narrative: "탑 꼭대기에 올랐어.\n사방이 보여.\n\n여기서 뛰어내리면\n날개가 생길지도 모른다고 적혀 있어.\n\n...그럴 리가.",
    choices: [
      { emoji: "🦅", label: "...한번 믿어볼까", spicyLabel: "뛰면 날개 생김? ㅋ 안 생김", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "🔭", label: "경치를 즐긴다", spicyLabel: "ㄹㅇ 이거 쓴 새끼 정신감정 필요", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "🪜", label: "계단으로 내려간다", spicyLabel: "현실주의자는 계단으로 ㅋ", signals: [{ axis: "risk", value: -1 }] },
    ],
  },
];

// ═══════════════════════════════════════════
// 전략실 — 미션 + 팀 + 위기 + 판단
// ═══════════════════════════════════════════

const STRATEGY_SCENES: StoryScene[] = [
  {
    id: "strategy_1",
    illustration: "넓은 회의실, 화이트보드에 두 가지 전략이 적혀 있음",
    imagePath: "/assets/discovery/strategy_1.jpg",
    narrative: "자리에 앉자마자 브리핑이 시작돼.\n화이트보드에 두 안이 나란히 적혀 있어.\n\nA안 — 한 번도 실패한 적 없는 방법.\nB안 — 아직 아무도 해본 적 없는 방법.",
    choices: [
      { emoji: "📊", label: "A안 — 실패가 없는 쪽으로", spicyLabel: "되던 걸 왜 건드림? 노답", signals: [{ axis: "risk", value: -1 }] },
      { emoji: "🚀", label: "B안 — 아무도 안 해봤으니까", spicyLabel: "다 하는 건 이미 늦은 거", signals: [{ axis: "risk", value: 1 }], recommended: true },
    ],
  },
  {
    id: "strategy_2",
    illustration: "모니터 화면에 숫자가 빼곡한 보고서, 빨간 동그라미",
    imagePath: "/assets/discovery/strategy_2.jpg",
    narrative: "보고서를 검토하다가\n숫자가 안 맞는 부분이 눈에 걸려.\n\n작은 오차야.\n근데 이 오차가 결론을 바꿀 수도, 아닐 수도 있어.",
    choices: [
      { emoji: "🧮", label: "직접 다시 계산한다", spicyLabel: "남 믿으면 ㅈ됨", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "💡", label: "전체 맥락으로 판단한다", spicyLabel: "나무 보다가 숲 놓치는 꼴", signals: [{ axis: "approach", value: 1 }], recommended: true },
      { emoji: "📞", label: "담당자에게 확인한다", spicyLabel: "만든 놈이 고쳐", signals: [{ axis: "coping", value: -1 }] },
    ],
  },
  {
    id: "strategy_3",
    illustration: "사무실, 팀원이 머리를 잡고 있음, 모니터에 에러 화면",
    imagePath: "/assets/discovery/strategy_3.jpg",
    narrative: "팀원이 실수로\n중요한 파일을 날렸어.\n\n얼굴이 하얘져서\n멍하니 모니터를 보고 있어.",
    choices: [
      { emoji: "🛠️", label: "복구 방법부터 찾는다", spicyLabel: "울어봤자 파일 복구 안 됨 ㅋ", signals: [{ axis: "coping", value: -1 }] },
      { emoji: "☕", label: "\"괜찮아, 같이 해결하자\"", spicyLabel: "ㅋ 화나는데 참는 중", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "📋", label: "백업 여부를 확인한다", spicyLabel: "백업 없으면 수업료 ㅋ", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  {
    id: "strategy_4",
    illustration: "긴 회의 테이블, 양쪽에 팀이 나뉘어 앉아 있음",
    imagePath: "/assets/discovery/strategy_4.jpg",
    narrative: "양쪽 다 물러서지 않아.\n결정권이 너한테 있어.\n\n둘 다 틀린 말이 없어.\n시간은 좀 있어.",
    choices: [
      { emoji: "⏸️", label: "\"내일까지 데이터 더 모으자\"", spicyLabel: "지금 고르면 한쪽 적 됨", signals: [{ axis: "decision", value: -1 }] },
      { emoji: "✅", label: "지금 결정한다", spicyLabel: "안 고르면 둘 다 적 됨", signals: [{ axis: "decision", value: 1 }], recommended: true },
      { emoji: "🤝", label: "\"둘 다 장점을 합치면?\"", spicyLabel: "싸우지 말고 합쳐 ㅋ 귀찮게", signals: [{ axis: "approach", value: 1 }] },
    ],
  },
  // ─── 보너스 장면 ───
  {
    id: "strategy_5",
    illustration: "뉴스 알림이 뜬 노트북, 경쟁사 로고",
    imagePath: "/assets/discovery/strategy_5.jpg",
    narrative: "경쟁사가 예상 못한 제품을 냈어.\n팀 단톡방이 술렁이기 시작해.\n\n우리 전략이 흔들릴 수도 있고,\n무시해도 될 수준일 수도 있어.",
    choices: [
      { emoji: "🔎", label: "충분히 분석하고 대응한다", spicyLabel: "호들갑 ㄴㄴ 경쟁사가 원하는 꼴", signals: [{ axis: "risk", value: -1 }, { axis: "approach", value: -1 }] },
      { emoji: "⚡", label: "즉시 카운터 전략을 세운다", spicyLabel: "머뭇거리면 뺏김", signals: [{ axis: "risk", value: 1 }, { axis: "decision", value: 1 }], recommended: true },
      { emoji: "🧘", label: "지켜본다 — 아직 데이터가 부족하다", spicyLabel: "기다려 ㅋ 걔네 망하면 이득", signals: [{ axis: "decision", value: -1 }] },
    ],
  },
  {
    id: "strategy_6",
    illustration: "이메일 화면, 긴 문장이 적혀 있지만 핵심이 안 보임",
    imagePath: "/assets/discovery/strategy_6.jpg",
    narrative: "클라이언트가 메일을 보냈는데\n읽으면 읽을수록 뭘 원하는지 모르겠어.\n\n답장은 보내야 해.",
    choices: [
      { emoji: "📝", label: "항목별로 질문 리스트를 만든다", spicyLabel: "뭔 소린지 1도 모르겠음 ㅋ 전화 ㄱ", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "📞", label: "바로 전화해서 대화한다", spicyLabel: "메일 핑퐁 ㅋㅋ 전화 1방이면 끝", signals: [{ axis: "approach", value: 1 }], recommended: true },
      { emoji: "🤔", label: "내가 이해한 대로 정리해서 보낸다", spicyLabel: "대충 보내면 걔네가 고쳐줌", signals: [{ axis: "decision", value: 1 }] },
    ],
  },
  {
    id: "strategy_7",
    illustration: "캘린더에 빨간 마감일, 새 요청 메모가 쌓여 있음",
    imagePath: "/assets/discovery/strategy_7.jpg",
    narrative: "마감이 3일 남았는데\n범위가 늘었어.\n\n다 하려면 빡빡하고\n일부만 하면 퀄리티는 보장돼.",
    choices: [
      { emoji: "✂️", label: "우선순위를 재조정한다", spicyLabel: "다 한다는 놈 = 아무것도 안 하는 놈", signals: [{ axis: "coping", value: -1 }] },
      { emoji: "💪", label: "다 해본다", spicyLabel: "건강 갈아 넣기 ㅋ", signals: [{ axis: "risk", value: 1 }], recommended: true },
      { emoji: "📊", label: "상황을 보고하고 판단을 맡긴다", spicyLabel: "니 돈 아니면 알빠노", signals: [{ axis: "coping", value: 1 }] },
    ],
  },
  {
    id: "strategy_8",
    illustration: "상사가 웃으며 떠남, 빈 화이트보드",
    imagePath: "/assets/discovery/strategy_8.jpg",
    narrative: "상사가 말해.\n\"이번 건은 자유롭게 해봐.\n내가 다 맡길게.\"\n\n텅 빈 화이트보드 앞에 서있어.",
    choices: [
      { emoji: "📋", label: "계획부터 세운다", spicyLabel: "자유롭게 = 관심 없다는 뜻", signals: [{ axis: "decision", value: -1 }] },
      { emoji: "🎯", label: "바로 시작한다", spicyLabel: "생각만 하면 아무것도 안 됨", signals: [{ axis: "decision", value: 1 }] },
      { emoji: "🧑‍🤝‍🧑", label: "팀원들 의견을 먼저 듣는다", spicyLabel: "혼자 다 할 거면 월급 다 줘", signals: [{ axis: "coping", value: 1 }], recommended: true },
    ],
  },
  {
    id: "strategy_9",
    illustration: "사무실 창밖이 어두움, 모니터에 작업 중인 파일",
    imagePath: "/assets/discovery/strategy_9.jpg",
    narrative: "오늘 안에 끝내면\n내일이 편해져.\n\n근데 지금 집중력이 좀 떨어지고\n피로가 쌓여있어.",
    choices: [
      { emoji: "🌙", label: "조금만 더 한다", spicyLabel: "내일의 나도 피곤함 ㅋ", signals: [{ axis: "risk", value: 1 }, { axis: "decision", value: 1 }] },
      { emoji: "🏠", label: "내일 아침에 한다", spicyLabel: "지금 하면 퀄리티 ㅈ됨", signals: [{ axis: "risk", value: -1 }], recommended: true },
      { emoji: "☕", label: "환기하고 다시 판단한다", spicyLabel: "환기 = 유튜브 1시간", signals: [{ axis: "decision", value: -1 }] },
    ],
  },
  {
    id: "strategy_10",
    illustration: "발표대 위, 청중 한 명이 손을 들고 있음",
    imagePath: "/assets/discovery/strategy_10.jpg",
    narrative: "발표 중인데\n누군가 손을 들어.\n\n\"그 접근은 위험하지 않나요?\"\n\n분위기가 살짝 긴장돼.",
    choices: [
      { emoji: "🎤", label: "바로 반박한다", spicyLabel: "위험? 데이터 보고 말해", signals: [{ axis: "decision", value: 1 }, { axis: "approach", value: 1 }] },
      { emoji: "🤝", label: "\"좋은 지적이에요, 같이 보시죠\"", spicyLabel: "좆까 ㅋ 내가 알아서 함", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "📊", label: "데이터를 보여준다", spicyLabel: "감으로 까면 내가 숫자로 팸", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
];

// ═══════════════════════════════════════════
// 테마 스토리 조립
// ═══════════════════════════════════════════

export const THEME_STORIES: Record<ThemeType, ThemeStory> = {
  garden: {
    theme: "garden",
    name: "달빛정원",
    bgImage: "/assets/garden-scene-bg.png",
    introText: "정원으로 가자.\n조용하고 좋은 곳이야.",
    scenes: GARDEN_SCENES,
    outroNarrative: "그 사람이 일어나며 말해.\n\"이야기해줘서 고마워요.\n여기 있으면 마음이 편해져요.\"\n\n그 사람이 떠나고,\n정원이 조금 밝아진 것 같아.",
    outroButtonText: "🌿 정원에서 시작하기",
    outroImagePath: "/assets/discovery/garden_outro.jpg",
    minScenes: 10,
    continuePrompt: "정원을 좀 더 산책할래?",
    startPrompt: "여기서 시작하기",
  },
  adventure: {
    theme: "adventure",
    name: "모험가",
    bgImage: "/assets/adventure-bg.png",
    introText: "자, 모험을 떠나볼까.\n직감을 믿고 따라와.",
    scenes: ADVENTURE_SCENES,
    outroNarrative: "언덕 위에 올라서니\n여정이 한눈에 보여.\n\n네가 어떤 모험가인지\n조금 알 것 같아.",
    outroButtonText: "🗡️ 모험 시작하기",
    outroImagePath: "/assets/discovery/adventure_outro.jpg",
    minScenes: 10,
    continuePrompt: "모험을 계속할래?",
    startPrompt: "여기서 시작하기",
  },
  strategy: {
    theme: "strategy",
    name: "전략실",
    bgImage: "/assets/strategy-office-bg.png",
    introText: "좋아요.\n몇 가지 상황을 같이 봐볼게요.",
    scenes: STRATEGY_SCENES,
    outroNarrative: "브리핑이 끝났습니다.\n\n당신의 의사결정 패턴이\n보이기 시작합니다.",
    outroButtonText: "🎯 전략실 입장",
    outroImagePath: "/assets/discovery/strategy_outro.jpg",
    minScenes: 10,
    continuePrompt: "다음 미션 받을래?",
    startPrompt: "여기서 시작하기",
  },
};

export function getThemeStory(theme: ThemeType): ThemeStory {
  return THEME_STORIES[theme];
}
