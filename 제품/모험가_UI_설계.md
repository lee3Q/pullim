# 모험가 모드 UI/UX 설계

> 날짜: 2026-03-20
> 기반: 끝판왕_파이프라인_설계, 이종모델_오케스트레이션_설계, 현자_대사_시스템
> 레퍼런스: V2 코드 (pullim/src/) — 구조 유지, 세계관 씌움
> 디자인 키워드: 도트 아트, 모닥불, RPG 오두막, 따뜻한 어둠

---

## V2 → 끝판왕 UI 변경 요약

| | V2 | 끝판왕 (모험가) |
|---|-----|---------------|
| 배경 | 흰 배경 + 바이올렛 그라디언트 | **어두운 숲 + 모닥불 + 도트 아트** |
| 스테이지 | 5단계 (LISTEN→EXPERT_SELECT→ANALYZE→DEBATE→LAND) | **11단계 (ENTER~COMPLETE)** |
| 전문가 선택 | 10명 카드 (한글 텍스트) | **10개 구슬 (아이콘 + 빛나는 연출)** |
| 분석 | 같은 모델 × 3 | **이종 모델 병렬** |
| 리서치 | 없음 | **실시간 검색 → 데이터 카드** |
| 톤 | 중립 해요체 | **현자 고어체 + 세계관 연출** |
| 사운드 | 없음 | **앰비언트 BGM + 효과음** |

---

## 페이지 구조

```
/ (홈 — 캐릭터/테마 선택)
├── /adventure/{id}  (모험가 세션 — 핵심)
├── /strategy/{id}   (전략실 세션)
├── /garden/{id}     (달빛정원 세션)
├── /history         (세션 기록)
└── /v2/{id}         (V2 레거시 — 유지)
```

---

## 화면 1: 홈 (테마 선택)

### 레이아웃

```
┌─────────────────────────────────┐
│  풀림                    내 기록 │  ← 헤더
├─────────────────────────────────┤
│                                 │
│   [도트 모닥불 애니메이션]         │
│                                 │
│   "갈림길에 선 모험가여,"          │
│   "어디로 향할 것인가?"           │
│                                 │
│   ┌─────┐ ┌─────┐ ┌─────┐     │
│   │🧙   │ │🏙️   │ │🌿   │     │
│   │현자의│ │전략  │ │달빛  │     │
│   │오두막│ │  실  │ │정원  │     │
│   └─────┘ └─────┘ └─────┘     │
│                                 │
│   이번 달 0/3회 사용              │
│                                 │
├─────────────────────────────────┤
│  풀림은 전문 상담을 대체하지 않습니다 │
└─────────────────────────────────┘
```

### 동작

1. 테마 카드 탭 → 해당 테마 세계관으로 입장
2. 첫 방문이면 캐릭터 소개 + 이름 입력
3. 재방문이면 바로 고민 입력

### 스타일

```css
/* 배경: 어두운 숲 그라디언트 */
background: linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);

/* 모닥불 파티클: CSS animation */
.campfire-particle {
  animation: float-up 2s ease-out infinite;
  background: radial-gradient(circle, #ff6b35, #ff9f1c, transparent);
}

/* 테마 카드: 도트 아트 테두리 */
.theme-card {
  border: 2px solid rgba(255, 255, 255, 0.1);
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
  image-rendering: pixelated; /* 도트 아트 느낌 */
}
```

---

## 화면 2: 세션 (모험가 — 핵심)

### 전체 레이아웃

```
┌─────────────────────────────────┐
│  🧙 현자의 오두막         X 종료 │  ← 헤더
├─────────────────────────────────┤
│  [─●───────────────────]       │  ← 스테이지 인디케이터
│   입장  듣기  리서치  구슬  결론   │
├─────────────────────────────────┤
│                                 │
│  [도트 모닥불 배경 — 고정]        │
│                                 │
│  🧙 "모험가여, 오늘은 무슨        │  ← 현자 대사
│     바람이 불어 찾아왔는가?"       │
│                                 │
│  ┌──────────────────┐          │
│  │ 데이터 카드 영역    │          │  ← 3단계에서 표시
│  └──────────────────┘          │
│                                 │
│  ┌───┐ ┌───┐ ┌───┐            │
│  │💰 │ │🧭 │ │🎯 │            │  ← 4단계: 구슬 선택
│  └───┘ └───┘ └───┘            │
│                                 │
├─────────────────────────────────┤
│  [고민 입력...]          전송 ▶  │  ← 입력 바
└─────────────────────────────────┘
```

### 스테이지 인디케이터 (V2 → 끝판왕)

```
V2:  듣기 → 전문가 → 분석 → 토론 → 정리  (5단계)

끝판왕: 입장 → 듣기 → 리서치 → 구슬 → 결론  (5단계로 압축 표시)
        (내부 11단계지만 사용자에게는 5단계로 보임)
```

| 표시 단계 | 내부 단계 |
|----------|----------|
| 입장 | ENTER |
| 듣기 | LISTEN |
| 리서치 | RESEARCH, VERIFY, DISCUSS_1 |
| 구슬 | CRYSTAL_SELECT, CRYSTAL_ANALYZE, DISCUSS_2, DEBATE, DISCUSS_3, JUDGE |
| 결론 | CONCLUDE |

### 배경 (모닥불 캔버스)

```
- 전체 세션 배경: 어두운 오두막 내부 도트 아트
- 모닥불: CSS 애니메이션 (불꽃 파티클 + 빛 반사)
- 배경은 고정, 콘텐츠가 위에 오버레이
- 단계별로 배경 분위기 변화:
  - 입장/듣기: 모닥불 보통
  - 리서치: 현자가 두루마리 펼침 (배경 위 오버레이)
  - 구슬 선택: 모닥불 약해지고, 구슬이 빛남
  - 토론: 구슬 빛이 교차
  - 결론: 모닥불이 서서히 꺼짐
```

---

## 화면 3: 데이터 카드 (3단계 논의 1)

```
┌─────────────────────────────────┐
│                                 │
│  🧙 "세상의 기록을 살펴보았네."   │
│                                 │
│  ┌────────────────────────┐    │
│  │ 📊 1인 AI SaaS 생존율   │    │  ← 탭 가능한 카드
│  │ "3년 생존율 약 37%"     │    │
│  │ ─ 중소벤처기업부, 2025   │    │
│  └────────────────────────┘    │
│                                 │
│  ┌────────────────────────┐    │
│  │ 💰 구독 서비스 평균 단가  │    │
│  │ "월 7,000~15,000원"    │    │
│  │ ─ Statista, 2025       │    │
│  └────────────────────────┘    │
│                                 │
│  ┌────────────────────────┐    │
│  │ 👥 AI 코칭 이용 의향     │    │
│  │ "응답자의 48%"          │    │
│  │ ─ 한국갤럽, 2025        │    │
│  └────────────────────────┘    │
│                                 │
│  🧙 "가장 무겁게 느껴지는 것은?" │
│                                 │
└─────────────────────────────────┘
```

### 카드 스타일

```css
.data-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s;
}

.data-card:hover {
  border-color: rgba(255, 182, 72, 0.5); /* 모닥불 색 */
  background: rgba(255, 182, 72, 0.05);
}

.data-card.selected {
  border-color: #ff9f1c;
  background: rgba(255, 159, 28, 0.1);
  box-shadow: 0 0 20px rgba(255, 159, 28, 0.2);
}
```

---

## 화면 4: 구슬 선택 (4단계)

```
┌─────────────────────────────────┐
│                                 │
│  🧙 "어떤 눈으로 세상을            │
│     보고 싶은가?"                │
│                                 │
│  [모닥불이 약해지고 구슬이 떠오름]  │
│                                 │
│  💰      🧭      🎯            │
│  금화    나침반    거울           │
│                                 │
│  ⚖️      🔥      🪞            │
│  저울    모닥불    타인           │
│                                 │
│  🧠      📊      🤔      🏃    │
│  심연    전략    뒤집기    몸     │
│                                 │
│  ┌──────────────────────┐      │
│  │ 선택: 💰 🧭 🎯  (3/3) │      │
│  │          [확인]        │      │
│  └──────────────────────┘      │
│                                 │
└─────────────────────────────────┘
```

### 구슬 컴포넌트

```typescript
interface CrystalOrbProps {
  crystal: CrystalName;
  icon: string;
  label: string;
  description: string;  // "돈의 흐름이 보입니다"
  selected: boolean;
  disabled: boolean;     // 이미 3개 선택됨
  onClick: () => void;
}
```

### 구슬 스타일

```css
.crystal-orb {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, rgba(255,255,255,0.2), transparent);
  border: 2px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  cursor: pointer;
  transition: all 0.3s;
  animation: float 3s ease-in-out infinite;
}

.crystal-orb:hover {
  transform: scale(1.1);
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
}

.crystal-orb.selected {
  border-color: #ff9f1c;
  box-shadow: 0 0 40px rgba(255, 159, 28, 0.4);
  animation: pulse-glow 1.5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 159, 28, 0.3); }
  50% { box-shadow: 0 0 40px rgba(255, 159, 28, 0.6); }
}
```

---

## 화면 5: 구슬 분석 결과 (4단계 후반)

```
┌─────────────────────────────────┐
│                                 │
│  [구슬 1이 빛나는 애니메이션]     │
│                                 │
│  💰 금화의 구슬이 보여주는 것:    │
│  ┌────────────────────────┐    │
│  │ "실패 시 손실: 최대 ~원.  │    │
│  │  기회비용: 취업했으면 ~원. │    │
│  │  손익분기: 유료 ~명."     │    │
│  └────────────────────────┘    │
│                                 │
│  🧭 나침반의 구슬이 보여주는 것:  │
│  ┌────────────────────────┐    │
│  │ "시나리오 A: 창업 지속 →  │    │
│  │  시나리오 B: 취업 전환 →" │    │
│  └────────────────────────┘    │
│                                 │
│  🎯 거울의 구슬이 보여주는 것:    │
│  ┌────────────────────────┐    │
│  │ "'목숨을 걸어도 되냐'는   │    │
│  │  이미 답을 정한 질문."    │    │
│  └────────────────────────┘    │
│                                 │
│  ⚡ 엇갈리는 지점                 │
│  ┌────────────────────────┐    │
│  │ 금화는 "리스크"          │    │
│  │ 거울은 "안 하는 게 리스크" │    │
│  │ → 이것이 핵심 갈림길      │    │
│  └────────────────────────┘    │
│                                 │
└─────────────────────────────────┘
```

---

## 화면 6: 결론 (9단계)

```
┌─────────────────────────────────┐
│                                 │
│  🧙 "오늘 자네의 이야기를         │
│     들여다보았네."                │
│                                 │
│  ┌────────────────────────┐    │
│  │ 📋 세션 요약              │    │
│  │ 상황: ...               │    │
│  │ 핵심 갈림길: ...         │    │
│  │ 성향: ...               │    │
│  └────────────────────────┘    │
│                                 │
│  ┌──────────┐ ┌──────────┐    │
│  │ 선택지 A  │ │ 선택지 B  │    │
│  │ 리스크: ~ │ │ 리스크: ~ │    │
│  │ 보상: ~  │ │ 보상: ~  │    │
│  └──────────┘ └──────────┘    │
│                                 │
│  🧙 "자네는 이미, 답을 알고        │
│     있지 않은가?"                │
│                                 │
│  [잘 모르겠어요] [사실, 맞아요]    │
│                                 │
│  ─── 약속 후 ───                │
│                                 │
│  🧙 "기다리고 있겠네."            │
│                                 │
│  [모닥불이 서서히 꺼지는 애니메이션] │
│                                 │
└─────────────────────────────────┘
```

---

## 컴포넌트 트리

```
<ThemeProvider theme="adventure">
  <SessionPage>
    ├── <SessionHeader character="현자" />
    ├── <StageIndicator stages={5} current={...} />
    ├── <CampfireBackground stage={...} />  ← 배경 캔버스
    ├── <SessionContent>
    │   ├── <CharacterDialogue text={...} />
    │   ├── <DataCardList cards={...} />      ← 3단계
    │   ├── <CrystalSelector crystals={10} max={3} />  ← 4단계
    │   ├── <CrystalAnalysisView analyses={...} />
    │   ├── <DisagreementCard points={...} />
    │   ├── <DebateView rounds={...} />       ← 6단계
    │   ├── <ConclusionView data={...} />     ← 9단계
    │   └── <ActionCommitment />
    ├── <ChatInput />
    ├── <SelectionButtons options={...} />
    └── <CrisisAlert />  ← RED 프로토콜
  </SessionPage>
</ThemeProvider>
```

---

## 테마 시스템 (3테마 공유 구조)

```typescript
interface Theme {
  name: ThemeName;
  character: CharacterName;

  // 색상
  colors: {
    bg: string;           // 배경 그라디언트
    primary: string;      // 주요 액센트
    card: string;         // 카드 배경
    text: string;         // 텍스트
    muted: string;        // 보조 텍스트
  };

  // 연출
  background: {
    component: string;    // <CampfireBackground> | <CityBackground> | <GardenBackground>
    particles: string;    // 불꽃 | 없음 | 반딧불
  };

  // 구슬 명칭
  crystalLabel: string;   // "수정구슬" | "분석 렌즈" | "꽃봉오리"

  // 사운드
  sounds: {
    bgm: string;
    crystalSelect: string;
    stageComplete: string;
    sessionEnd: string;
  };
}

const THEMES: Record<ThemeName, Theme> = {
  모험가: {
    name: "모험가",
    character: "현자",
    colors: {
      bg: "from-[#1a1a2e] via-[#16213e] to-[#0f3460]",
      primary: "#ff9f1c",
      card: "rgba(255, 255, 255, 0.05)",
      text: "#e0e0e0",
      muted: "#888",
    },
    background: { component: "CampfireBackground", particles: "fire" },
    crystalLabel: "수정구슬",
    sounds: { bgm: "campfire-lofi", crystalSelect: "crystal", stageComplete: "scroll", sessionEnd: "fire-out" },
  },
  전략실: {
    name: "전략실",
    character: "비서",
    colors: {
      bg: "from-[#0a0a0a] via-[#1a1a1a] to-[#0a0a0a]",
      primary: "#60a5fa",
      card: "rgba(255, 255, 255, 0.03)",
      text: "#d0d0d0",
      muted: "#666",
    },
    background: { component: "CityBackground", particles: "none" },
    crystalLabel: "분석 렌즈",
    sounds: { bgm: "minimal-ambient", crystalSelect: "ui-click", stageComplete: "notification", sessionEnd: "screen-off" },
  },
  달빛정원: {
    name: "달빛정원",
    character: "친구",
    colors: {
      bg: "from-[#0f1729] via-[#1a2744] to-[#0f1729]",
      primary: "#a78bfa",
      card: "rgba(255, 255, 255, 0.04)",
      text: "#d4d4e0",
      muted: "#777",
    },
    background: { component: "GardenBackground", particles: "firefly" },
    crystalLabel: "꽃봉오리",
    sounds: { bgm: "acoustic-night", crystalSelect: "bloom", stageComplete: "envelope", sessionEnd: "moonlight-fade" },
  },
};
```

---

## 반응형

- 모바일 우선 (375px~)
- 태블릿 (768px~): 구슬 그리드 넓게
- 데스크톱 (1024px~): 중앙 max-w-2xl, 양쪽 여백에 배경 확장

---

## 사운드 시스템

```typescript
// Web Audio API 기반
class SoundManager {
  private bgm: AudioBufferSourceNode | null = null;
  private context: AudioContext;
  private muted: boolean = false;

  async playBGM(theme: ThemeName): Promise<void>;
  async playSFX(name: string): Promise<void>;
  fadeOut(duration: number): void;
  toggle(): void;
}
```

BGM은 세션 시작 시 자동 재생 (사용자 인터랙션 후).
음소거 토글 버튼 헤더에 표시.

---

## 로딩/대기 연출

| 단계 | 연출 |
|------|------|
| 리서치 중 | 두루마리 펼치는 도트 애니메이션 + 텍스트 나타남 |
| 구슬 분석 중 | 3개 구슬이 동시에 빛남 + 로딩 스피너 대신 파티클 |
| 토론 중 | 구슬 빛이 교차하는 애니메이션 |
| Judge 검증 중 | 비노출 (자연스러운 전환) |

스켈레톤 UI 대신 세계관 연출로 대기 시간을 경험으로 전환.

---

*설계: 2026-03-20 by Claude Code (A4 — 모험가 UI 설계)*
