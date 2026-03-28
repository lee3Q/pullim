// 테마별 스토리형 파악 장면 데이터
// 각 장면: 일러스트 + 나레이션 + 2-3개 선택지 (추천 표시)
// 선택은 이야기의 일부처럼 느끼게, 성격 측정은 뒤에서.
// "벤치에 앉을래 지나갈래?" > "너는 분석적이야 직관적이야?"

export type ThemeType = "adventure" | "garden" | "strategy" | "stargazer";
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
  {
    id: "garden_11",
    illustration: "달빛 아래 작은 분수, 동전 하나가 바닥에 반짝임",
    imagePath: "/images/v3/garden_11.png",
    narrative: "작은 분수 옆에 서 있어.\n물소리가 생각을 가라앉혀.\n\n바닥에 동전 하나가 보여.\n누군가의 소원이었겠지.",
    choices: [
      { emoji: "🪙", label: "동전을 들어 다시 던진다", spicyLabel: "남의 소원 재활용 ㅋ", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "💭", label: "그냥 바라보기만 한다", spicyLabel: "관찰자 모드", signals: [{ axis: "approach", value: -1 }], recommended: true },
      { emoji: "✨", label: "내 소원을 속으로 빈다", spicyLabel: "동전 없어도 소원은 가능", signals: [{ axis: "coping", value: 1 }] },
    ],
  },
  {
    id: "garden_12",
    illustration: "정원 담장 너머로 달이 크게 떠오름",
    imagePath: "/images/v3/garden_12.png",
    narrative: "담장 위로 달이 크게 올라왔어.\n\n저 너머에\n또 다른 정원이 있을까.",
    choices: [
      { emoji: "🌕", label: "담장을 넘어본다", spicyLabel: "남의 정원 무단 침입 ㅋ", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "🌿", label: "이 정원에 머문다", spicyLabel: "여기도 충분함", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "🔭", label: "달을 오래 바라본다", spicyLabel: "달 봐봤자 답 없음 ㅋ", signals: [{ axis: "decision", value: -1 }] },
    ],
  },
  {
    id: "garden_13",
    illustration: "정원 깊숙이, 오래된 우물이 있음",
    imagePath: "/images/v3/garden_13.png",
    narrative: "깊은 곳에 우물이 있어.\n들여다보면 바닥이 안 보여.\n\n뭔가 떨어뜨리면\n소리가 날까, 안 날까.",
    choices: [
      { emoji: "🪨", label: "돌멩이를 떨어뜨린다", spicyLabel: "결과 없어도 시도하는 게 중요", signals: [{ axis: "approach", value: 1 }] },
      { emoji: "👂", label: "귀를 기울인다", spicyLabel: "소리 없어도 뭔가 있을 수 있음", signals: [{ axis: "decision", value: -1 }], recommended: true },
      { emoji: "🚶", label: "그냥 지나친다", spicyLabel: "모르는 게 나을 때도 있음", signals: [{ axis: "risk", value: -1 }] },
    ],
  },
  {
    id: "garden_14",
    illustration: "이슬 맺힌 거미줄, 아침 빛에 반짝임",
    imagePath: "/images/v3/garden_14.png",
    narrative: "거미줄에 이슬이 맺혀서\n빛에 반짝이고 있어.\n\n작고 연약한데\n어쩐지 단단해 보여.",
    choices: [
      { emoji: "🕷️", label: "거미가 어디 있는지 찾아본다", spicyLabel: "거미 찾으면 뭐함 ㅋ", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "💎", label: "이슬 하나를 손으로 건드린다", spicyLabel: "터지면 아쉬운데 건드리게 됨", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "📸", label: "눈에 담아둔다", spicyLabel: "부수면 안 되는 것들이 있음", signals: [{ axis: "coping", value: 1 }], recommended: true },
    ],
  },
  {
    id: "garden_15",
    illustration: "정원 끝, 문이 하나 있음 — 열려 있는지 닫혀 있는지 모호함",
    imagePath: "/images/v3/garden_15.png",
    narrative: "정원 끝에 문이 있어.\n열려 있는 것 같기도 하고\n닫혀 있는 것 같기도 해.\n\n여기까지 온 게 의미 있었어.",
    choices: [
      { emoji: "🚪", label: "문을 열고 나간다", spicyLabel: "들어왔으면 나가야지", signals: [{ axis: "decision", value: 1 }] },
      { emoji: "🌿", label: "정원에 좀 더 있는다", spicyLabel: "끝낼 필요 없잖아", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "🤔", label: "문 앞에서 잠깐 멈춘다", spicyLabel: "나가도 되는지 모르겠음", signals: [{ axis: "decision", value: -1 }] },
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
  {
    id: "adventure_11",
    illustration: "숲 한가운데, 오래된 나침반이 땅에 박혀 있음",
    imagePath: "/images/v3/adventure_11.png",
    narrative: "땅에 박힌 나침반.\n바늘이 계속 흔들려.\n\n진북을 가리키지 않아.\n그런데 묘하게 믿음이 가.",
    choices: [
      { emoji: "🧭", label: "나침반을 뽑아서 들고 간다", spicyLabel: "쓸모없어도 챙기는 게 사람", signals: [{ axis: "approach", value: 1 }] },
      { emoji: "👣", label: "감각대로 방향을 잡는다", spicyLabel: "나침반 없어도 길은 있음", signals: [{ axis: "decision", value: 1 }], recommended: true },
      { emoji: "🔍", label: "왜 바늘이 흔들리는지 살핀다", spicyLabel: "원인 먼저 ㅋ", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  {
    id: "adventure_12",
    illustration: "폭포 앞, 물이 거세게 쏟아지고 뒤에 동굴 입구가 보임",
    imagePath: "/images/v3/adventure_12.png",
    narrative: "폭포 너머에 뭔가 있어.\n들어가려면 물을 맞아야 해.\n\n차갑고 거세 보이지만\n저쪽이 궁금해.",
    choices: [
      { emoji: "💦", label: "뛰어들어서 통과한다", spicyLabel: "물에 젖는 건 잠깐임", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "🌿", label: "돌아가는 길을 찾는다", spicyLabel: "안 젖는 방법이 있을 수도", signals: [{ axis: "risk", value: -1 }], recommended: true },
      { emoji: "⏳", label: "폭포가 줄어들길 기다린다", spicyLabel: "폭포는 안 줄어들 거임 ㅋ", signals: [{ axis: "decision", value: -1 }] },
    ],
  },
  {
    id: "adventure_13",
    illustration: "모닥불 앞에 여러 여행자들이 둘러앉아 있음",
    imagePath: "/images/v3/adventure_13.png",
    narrative: "밤이 됐어.\n모닥불 주위에 낯선 여행자들.\n서로 이야기를 나누고 있어.\n\n자리가 하나 비어 있어.",
    choices: [
      { emoji: "🔥", label: "자리에 앉아 이야기를 듣는다", spicyLabel: "끼어들지 않아도 함께일 수 있음", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "💬", label: "내 이야기를 꺼낸다", spicyLabel: "모닥불엔 사연이 필요함", signals: [{ axis: "approach", value: 1 }] },
      { emoji: "🌙", label: "멀찍이서 불빛만 바라본다", spicyLabel: "참여 안 해도 따뜻함은 느낌", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  {
    id: "adventure_14",
    illustration: "다음 날 아침, 숲길에 발자국 두 줄이 나란히 있음",
    imagePath: "/images/v3/adventure_14.png",
    narrative: "어젯밤 같이 걸었던 누군가의 발자국.\n\n앞으로 가면 같은 방향,\n뒤로 가면 혼자가 돼.",
    choices: [
      { emoji: "🚶‍♂️", label: "발자국을 따라간다", spicyLabel: "혼자보단 낫지 않냐", signals: [{ axis: "coping", value: 1 }] },
      { emoji: "🗺️", label: "내 길을 간다", spicyLabel: "동행이 항상 도움은 아님", signals: [{ axis: "decision", value: 1 }], recommended: true },
      { emoji: "📢", label: "소리쳐서 그 사람을 찾는다", spicyLabel: "먼저 연락하는 게 뭐가 부끄럼", signals: [{ axis: "approach", value: 1 }] },
    ],
  },
  {
    id: "adventure_15",
    illustration: "숲 끝, 탁 트인 평원이 펼쳐짐 — 숲과 빛의 경계",
    imagePath: "/images/v3/adventure_15.png",
    narrative: "숲이 끝났어.\n탁 트인 평원이 펼쳐져.\n\n뒤에는 지나온 숲,\n앞에는 처음 보는 땅.",
    choices: [
      { emoji: "🌄", label: "주저 없이 나아간다", spicyLabel: "멈추면 지는 거", signals: [{ axis: "decision", value: 1 }] },
      { emoji: "🌲", label: "숲을 한 번 돌아본다", spicyLabel: "왔던 길을 아는 게 힘이 됨", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "⛺", label: "경계에서 잠시 쉰다", spicyLabel: "전환점에선 쉬어야 함", signals: [{ axis: "risk", value: -1 }] },
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
  {
    id: "strategy_11",
    illustration: "빈 회의실, 화이트보드에 '?'만 적혀 있음",
    imagePath: "/images/v3/strategy_11.png",
    narrative: "다음 회의까지 30분 남았어.\n아무도 없는 회의실.\n화이트보드에 물음표만 있어.\n\n뭔가 적고 싶어.",
    choices: [
      { emoji: "✍️", label: "지금 생각 나는 걸 적어둔다", spicyLabel: "회의 전 정리는 필수", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "🧘", label: "잠깐 멍하게 있는다", spicyLabel: "비워야 채워짐", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "📱", label: "메모앱에 따로 정리한다", spicyLabel: "화이트보드보다 앱이 낫지", signals: [{ axis: "decision", value: 1 }] },
    ],
  },
  {
    id: "strategy_12",
    illustration: "두 개의 보고서, 결론이 정반대임",
    imagePath: "/images/v3/strategy_12.png",
    narrative: "같은 데이터를 두 팀이 분석했는데\n결론이 정반대야.\n\n둘 다 논리가 맞아.\n어떻게 할래?",
    choices: [
      { emoji: "🔍", label: "데이터를 직접 다시 본다", spicyLabel: "중간자가 직접 봐야 함", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "🤝", label: "두 팀을 한 자리에 모은다", spicyLabel: "싸워야 답이 나옴 ㅋ", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "⚖️", label: "더 신뢰할 수 있는 팀 걸 따른다", spicyLabel: "트랙레코드가 답임", signals: [{ axis: "decision", value: 1 }] },
    ],
  },
  {
    id: "strategy_13",
    illustration: "퇴근 후 혼자 남은 사무실, 모니터 불빛만 켜져 있음",
    imagePath: "/images/v3/strategy_13.png",
    narrative: "모두 퇴근했어.\n혼자 남은 사무실.\n\n아직 할 일이 있는데\n집중이 잘 돼.",
    choices: [
      { emoji: "💻", label: "집중해서 마무리한다", spicyLabel: "이 시간이 골든타임", signals: [{ axis: "risk", value: 1 }, { axis: "decision", value: 1 }] },
      { emoji: "🏠", label: "내일 하기로 하고 퇴근한다", spicyLabel: "번아웃보다 내일이 나음", signals: [{ axis: "risk", value: -1 }], recommended: true },
      { emoji: "📋", label: "할 일 목록 정리하고 퇴근한다", spicyLabel: "정리하면 내일 바로 시작 가능", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  {
    id: "strategy_14",
    illustration: "작은 화분에 새싹이 올라옴, 책상 위에 있음",
    imagePath: "/images/v3/strategy_14.png",
    narrative: "책상 한쪽에 화분을 뒀는데\n새싹이 올라왔어.\n\n심은 기억이 가물가물해.\n언제였더라.",
    choices: [
      { emoji: "💧", label: "물을 준다", spicyLabel: "기억 못 해도 챙기는 게 중요", signals: [{ axis: "coping", value: 1 }] },
      { emoji: "📅", label: "언제 심었는지 찾아본다", spicyLabel: "기록이 있으면 확인해야지", signals: [{ axis: "approach", value: -1 }], recommended: true },
      { emoji: "😊", label: "그냥 기분 좋게 본다", spicyLabel: "이유 없이 좋은 것도 있음", signals: [{ axis: "decision", value: -1 }] },
    ],
  },
  {
    id: "strategy_15",
    illustration: "프로젝트 마지막 날, 체크리스트가 거의 다 체크됨",
    imagePath: "/images/v3/strategy_15.png",
    narrative: "체크리스트에\n항목이 하나 남았어.\n\n작은 항목이야.\n근데 제일 오래 남아 있었어.",
    choices: [
      { emoji: "✅", label: "마지막 항목을 체크한다", spicyLabel: "끝내야 끝난 거지", signals: [{ axis: "decision", value: 1 }] },
      { emoji: "🔁", label: "전체를 한 번 더 훑는다", spicyLabel: "마무리는 꼼꼼하게", signals: [{ axis: "approach", value: -1 }], recommended: true },
      { emoji: "🎉", label: "일단 완료 선언한다", spicyLabel: "완벽보다 완성이 중요", signals: [{ axis: "risk", value: 1 }] },
    ],
  },
];

// ═══════════════════════════════════════════
// 천문대 — 밤하늘 + 별 + 방향 + 가능성
// ═══════════════════════════════════════════

const STARGAZER_SCENES: StoryScene[] = [
  {
    id: "stargazer_1",
    illustration: "천문대 입구, 둥근 돔이 열려 있고 별이 쏟아질 것 같은 밤하늘",
    imagePath: "/assets/discovery/stargazer_1.png",
    narrative: "천문대 문이 열려 있어.\n안으로 들어가면\n거대한 망원경이 보여.\n\n두 방향이 있어.\n망원경 앞으로 가거나,\n옥상 계단으로 올라가거나.",
    choices: [
      { emoji: "🔭", label: "망원경으로 다가간다", spicyLabel: "도구가 있으면 써야지", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "⭐", label: "옥상으로 올라간다", spicyLabel: "맨눈으로 보는 게 진짜", signals: [{ axis: "approach", value: 1 }], recommended: true },
    ],
  },
  {
    id: "stargazer_2",
    illustration: "망원경 렌즈 너머로 보이는 거대한 목성, 줄무늬가 선명함",
    imagePath: "/assets/discovery/stargazer_2.png",
    narrative: "망원경을 들여다보니\n목성이 가득 차 있어.\n줄무늬가 선명하고\n작은 위성들도 보여.\n\n누군가 옆에서 속삭여.\n\"저기 가고 싶어요?\"",
    choices: [
      { emoji: "🚀", label: "\"갈 수 있다면 가고 싶어\"", spicyLabel: "왕복 불가인데 ㅋ 그래도 가고 싶음", signals: [{ axis: "risk", value: 1 }] },
      { emoji: "🌍", label: "\"여기가 더 좋아\"", spicyLabel: "있는 곳이 최고임", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "🤔", label: "\"...생각해본 적 없는데\"", spicyLabel: "질문이 갑작스러움 ㅋ", signals: [{ axis: "decision", value: -1 }] },
    ],
  },
  {
    id: "stargazer_3",
    illustration: "은하수가 펼쳐진 하늘, 아래에는 어두운 들판",
    imagePath: "/assets/discovery/stargazer_3.png",
    narrative: "옥상에 서니\n은하수가 머리 위를 가로질러.\n\n수억 개의 별.\n근데 어느 별을 봐야 할지\n모르겠어.",
    choices: [
      { emoji: "✨", label: "제일 밝은 별을 찾는다", spicyLabel: "밝은 게 눈에 먼저 들어옴", signals: [{ axis: "approach", value: 1 }] },
      { emoji: "🌌", label: "전체를 그냥 바라본다", spicyLabel: "하나 고르면 나머지를 놓치잖아", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "📍", label: "방향부터 잡는다 — 북극성 찾기", spicyLabel: "감동보다 위치가 먼저", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
  {
    id: "stargazer_4",
    illustration: "유성이 하늘을 가로질러 사라지는 순간",
    imagePath: "/assets/discovery/stargazer_4.png",
    narrative: "갑자기 유성 하나가\n하늘을 가로질러.\n\n0.5초.",
    choices: [
      { emoji: "🌠", label: "소원을 빈다", spicyLabel: "조건반사 ㅋ 원래 그러는 거잖아", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "📸", label: "사진 찍으려다 놓친다", spicyLabel: "현실은 눈보다 폰이 먼저임", signals: [{ axis: "decision", value: 1 }] },
      { emoji: "😮", label: "그냥 멍하니 본다", spicyLabel: "아무 생각 없는 게 맞음", signals: [{ axis: "risk", value: -1 }] },
    ],
  },
  {
    id: "stargazer_5",
    illustration: "천문대 관장이 별자리 지도를 펼쳐 보이고 있음",
    imagePath: "/assets/discovery/stargazer_5.png",
    narrative: "천문대 관장이\n낡은 별자리 지도를 펼쳐.\n\n\"이 별자리들은\n각자 이야기가 있어요.\"\n\n어느 별자리가 눈에 들어와?",
    choices: [
      { emoji: "🦁", label: "사자자리 — 용기와 위엄", spicyLabel: "레오 = 관종임 ㅋ", signals: [{ axis: "risk", value: 1 }, { axis: "approach", value: 1 }] },
      { emoji: "🌊", label: "물고기자리 — 흐름과 감수성", spicyLabel: "감성 충만 ㅋ", signals: [{ axis: "coping", value: 1 }, { axis: "approach", value: -1 }] },
      { emoji: "🏹", label: "오리온자리 — 목표와 추진", spicyLabel: "오리온이 제일 찾기 쉬움 ㅋ", signals: [{ axis: "decision", value: 1 }, { axis: "risk", value: -1 }], recommended: true },
    ],
  },
  {
    id: "stargazer_6",
    illustration: "망원경 옆에 열린 노트, 누군가 별 관측 기록을 남겨둔 흔적",
    imagePath: "/assets/discovery/stargazer_6.png",
    narrative: "망원경 옆에 노트가 펼쳐져 있어.\n누군가의 관측 기록.\n\n마지막 페이지에\n\"아직 이름 없는 별\"이라고 적혀 있어.",
    choices: [
      { emoji: "✍️", label: "내가 이름을 지어준다", spicyLabel: "공식 등록은 못 해도 ㅋ", signals: [{ axis: "approach", value: 1 }, { axis: "risk", value: 1 }] },
      { emoji: "📖", label: "앞 페이지부터 읽어본다", spicyLabel: "맥락을 알아야 이름도 붙이지", signals: [{ axis: "approach", value: -1 }], recommended: true },
      { emoji: "🌟", label: "그냥 이름 없는 채로 두는 게 좋다", spicyLabel: "이름이 없어도 존재는 함", signals: [{ axis: "coping", value: 1 }] },
    ],
  },
  {
    id: "stargazer_7",
    illustration: "먹구름이 몰려오며 별이 가려지기 시작함",
    imagePath: "/assets/discovery/stargazer_7.png",
    narrative: "구름이 몰려오고 있어.\n별이 하나씩 가려져.\n\n잠깐이면 다시 보일 수도 있고\n오늘은 이미 끝일 수도 있어.",
    choices: [
      { emoji: "⏳", label: "구름이 걷히길 기다린다", spicyLabel: "기다리면 보임 — 아마도 ㅋ", signals: [{ axis: "decision", value: -1 }] },
      { emoji: "🚗", label: "구름 없는 곳으로 이동한다", spicyLabel: "안 되면 장소를 바꿔야지", signals: [{ axis: "risk", value: 1 }], recommended: true },
      { emoji: "🏠", label: "오늘은 그만한다", spicyLabel: "억지로 보면 재미없어짐", signals: [{ axis: "coping", value: -1 }] },
    ],
  },
  {
    id: "stargazer_8",
    illustration: "두 사람이 같은 별을 바라보고 있음, 각자 다른 방향을 가리킴",
    imagePath: "/assets/discovery/stargazer_8.png",
    narrative: "옆에 있던 사람이\n저 별을 가리키며 말해.\n\"저거 북극성이에요.\"\n\n근데 방향이 달라 보여.",
    choices: [
      { emoji: "🤝", label: "\"맞아요\" — 그냥 동의한다", spicyLabel: "내가 틀렸을 수도 있으니까", signals: [{ axis: "coping", value: 1 }] },
      { emoji: "🔍", label: "직접 확인해본다", spicyLabel: "확인하면 되잖아 ㅋ", signals: [{ axis: "approach", value: -1 }], recommended: true },
      { emoji: "💬", label: "\"제가 봤을 땐 저쪽인 것 같은데요\"", spicyLabel: "틀리면 창피하지만 말해야지", signals: [{ axis: "approach", value: 1 }] },
    ],
  },
  {
    id: "stargazer_9",
    illustration: "오래된 천체 사진 여러 장이 벽에 걸려 있음, 수십 년 전 것도 있음",
    imagePath: "/assets/discovery/stargazer_9.png",
    narrative: "벽에 오래된 천체 사진들이 걸려 있어.\n수십 년 전 것도 있어.\n\n같은 별인데 사진마다 달라 보여.",
    choices: [
      { emoji: "📅", label: "찍힌 연도 순서대로 본다", spicyLabel: "시간 순이 제일 정직함", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "❤️", label: "제일 마음에 드는 걸 먼저 본다", spicyLabel: "끌리는 게 있으면 거기서 시작", signals: [{ axis: "decision", value: 1 }], recommended: true },
      { emoji: "🕰️", label: "제일 오래된 걸 찾는다", spicyLabel: "처음이 있어야 지금이 있지", signals: [{ axis: "coping", value: -1 }] },
    ],
  },
  {
    id: "stargazer_10",
    illustration: "천문대 꼭대기, 360도 탁 트인 밤하늘, 바람이 느껴짐",
    imagePath: "/assets/discovery/stargazer_10.png",
    narrative: "천문대 꼭대기에 올랐어.\n360도로 하늘이 펼쳐져.\n\n어느 방향을 먼저 볼지\n결정해야 해.",
    choices: [
      { emoji: "🌅", label: "동쪽 — 해가 뜨는 방향", spicyLabel: "시작은 동쪽이지", signals: [{ axis: "decision", value: 1 }] },
      { emoji: "⭐", label: "북쪽 — 북극성이 있는 방향", spicyLabel: "방향은 북극성으로 잡는 거야", signals: [{ axis: "approach", value: -1 }], recommended: true },
      { emoji: "🌌", label: "은하수가 지나는 쪽", spicyLabel: "제일 화려한 쪽으로", signals: [{ axis: "risk", value: 1 }] },
    ],
  },
  {
    id: "stargazer_11",
    illustration: "작은 망원경을 조립하는 안내서, 부품이 여러 개 흩어져 있음",
    imagePath: "/images/v3/stargazer_11.png",
    narrative: "작은 망원경 키트가 있어.\n안내서대로 하면 만들 수 있어.\n\n부품이 생각보다 많아.",
    choices: [
      { emoji: "📋", label: "안내서를 먼저 다 읽는다", spicyLabel: "ㅋㅋ 모범생 코스", signals: [{ axis: "approach", value: -1 }] },
      { emoji: "🔧", label: "일단 조립하면서 본다", spicyLabel: "해봐야 앎", signals: [{ axis: "decision", value: 1 }], recommended: true },
      { emoji: "🎥", label: "영상 튜토리얼을 찾는다", spicyLabel: "안내서보다 영상이 나음 ㅋ", signals: [{ axis: "coping", value: -1 }] },
    ],
  },
  {
    id: "stargazer_12",
    illustration: "지구에서 가장 가까운 별 알파 센타우리까지의 거리가 적힌 안내판",
    imagePath: "/images/v3/stargazer_12.png",
    narrative: "안내판에 적혀 있어.\n\"가장 가까운 별까지 4.2광년.\"\n\n빛의 속도로 4년.\n뭔가 멀고도 가까운 느낌.",
    choices: [
      { emoji: "🤯", label: "우주의 크기에 압도된다", spicyLabel: "나 = 먼지 ㅋ 실감남", signals: [{ axis: "coping", value: 1 }] },
      { emoji: "📐", label: "얼마나 먼지 계산해본다", spicyLabel: "숫자로 바꾸면 실감 안 남", signals: [{ axis: "approach", value: -1 }], recommended: true },
      { emoji: "💭", label: "\"그래도 별은 존재하잖아\"", spicyLabel: "거리가 멀어도 있는 건 있음", signals: [{ axis: "decision", value: -1 }] },
    ],
  },
  {
    id: "stargazer_13",
    illustration: "천문대 카페에 관측 일지들이 쌓여 있음, 방문자들이 남긴 것",
    imagePath: "/images/v3/stargazer_13.png",
    narrative: "천문대 한쪽에\n방문자 관측 일지들이 쌓여 있어.\n\n아무나 남길 수 있대.\n빈 페이지가 있어.",
    choices: [
      { emoji: "✍️", label: "오늘 본 것을 적는다", spicyLabel: "기록은 남는 게 맞음", signals: [{ axis: "approach", value: 1 }], recommended: true },
      { emoji: "📖", label: "다른 사람 기록을 읽는다", spicyLabel: "내 것보다 남의 게 더 흥미로울 수도", signals: [{ axis: "coping", value: 1 }] },
      { emoji: "🚪", label: "그냥 지나친다", spicyLabel: "남길 게 없으면 안 남기면 됨", signals: [{ axis: "risk", value: -1 }] },
    ],
  },
  {
    id: "stargazer_14",
    illustration: "새벽빛이 지평선에 올라오기 시작, 별이 하나씩 사라짐",
    imagePath: "/images/v3/stargazer_14.png",
    narrative: "어느새 새벽이야.\n별이 하나씩 사라지고 있어.\n\n곧 다 사라질 거야.",
    choices: [
      { emoji: "🌅", label: "마지막 별을 찾아 눈에 담는다", spicyLabel: "사라지기 전에 봐야지", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "📸", label: "지평선 사진을 찍는다", spicyLabel: "별 사라지면 새벽이 주인공", signals: [{ axis: "decision", value: 1 }] },
      { emoji: "😴", label: "이제 자러 간다", spicyLabel: "충분히 봤으면 됨", signals: [{ axis: "risk", value: -1 }] },
    ],
  },
  {
    id: "stargazer_15",
    illustration: "천문대 출구, 열린 문 너머로 새벽빛이 쏟아짐",
    imagePath: "/images/v3/stargazer_15.png",
    narrative: "천문대 문 앞에 서 있어.\n밖은 이미 새벽이야.\n\n밤새 본 것들이\n머릿속에 남아 있어.",
    choices: [
      { emoji: "🌄", label: "새벽 공기를 마시며 나간다", spicyLabel: "끝냈으면 나가야지", signals: [{ axis: "decision", value: 1 }] },
      { emoji: "🔭", label: "망원경을 한 번 더 들여다본다", spicyLabel: "조금만 더 — 항상 이래", signals: [{ axis: "coping", value: 1 }], recommended: true },
      { emoji: "📓", label: "오늘 밤을 정리하고 나간다", spicyLabel: "마무리가 있어야 다음이 있음", signals: [{ axis: "approach", value: -1 }] },
    ],
  },
];

// ═══════════════════════════════════════════
// 테마 스토리 조립
// ═══════════════════════════════════════════

export const THEME_STORIES: Record<ThemeType, ThemeStory> = {
  stargazer: {
    theme: "stargazer",
    name: "천문대",
    bgImage: "/assets/stargazer-enter-bg.png",
    introText: "밤하늘을 같이 보자.\n답은 없어도 괜찮아.",
    scenes: STARGAZER_SCENES,
    outroNarrative: "새벽빛이 밀려오고\n별들이 하나씩 잠들고 있어.\n\n오늘 밤 네가 바라본 방향이\n어딘지 조금은 보여.",
    outroButtonText: "🌟 천문대에서 시작하기",
    outroImagePath: "/assets/discovery/stargazer_outro.png",
    minScenes: 10,
    continuePrompt: "별을 더 볼래?",
    startPrompt: "여기서 시작하기",
  },
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
