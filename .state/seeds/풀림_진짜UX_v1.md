# Seed: 풀림 진짜 UX — 온보딩 + 양방향 감각화 + 확률 프로필

## 한줄 목표
텍스트 게임이라고 착각할 만큼 부담없이 진행되고, 추천이 관찰 도구로 작동하며, 사용자를 입체적(확률 분포)으로 이해하는 풀림의 핵심 경험.

## 핵심 경험 (대표 원문)

> "고민 상담이 아니라, 텍스트 게임이라고 착각할 만큼 부담없고 즐겁게 만들고싶다."
> "직접 말하게 할 수 있지만, 그러고 싶지 않은 사람에겐 늘 선택지와 추천선택이 있어서 진행을 계속할 수 있다."
> "추천 선택지를 고르지 않는 건 오늘 그 사람의 다른 면을 보거나, 여태 데이터가 잘못되었거나 둘 중 하나."
> "결국 확률 싸움이야. 어떤 면을 많이 보여주냐가 그 사람의 성격일 테니까."
> "부족한 데이터로 태도를 결정하는거보다 질문이 더 늘어나는 게 낫다."

## 완료 기준 (AC)

1. **앱 첫 진입 시 길잡이가 자연스럽게 이름/말투/테마를 물어보고**, 매 선택에 추천이 붙어있어서 "몰라, 그냥 추천대로" 해도 진행 가능하다.
2. **파악이 부족하다고 느끼지 않는다.** 기본 5개 질문 후 일관성이 낮으면 자연스럽게 추가 질문이 나오고, 사용자는 "아직 파악 중이구나"라고 불안해하지 않는다.
3. **세션 중 모든 응답 지점에 선택지 + 추천 + 직접 입력이 공존한다.** 사용자는 언제든 고르거나 쓸 수 있다. 각 스텝은 길잡이 대사 1~2문장 → 선택지 제시 → 즉시 전환, 로딩 없이 텍스트 게임처럼 흘러간다.
4. **양방향 감각화가 작동한다.** 막막한 사람에겐 올라가기(감각→분석→결정), 합리적 사람에겐 내려가기(분석→감각→발견). 사용자는 방향 전환을 의식하지 않는다 — 자연스러워서.
5. **추천과 다른 걸 골랐을 때, 다음 추천이 그 선택을 반영해서 달라진다.** 사용자는 "나를 더 알아가는구나" 느낌을 받는다.
6. **재방문 시 "기억하네" 느낌이 든다.** 두 번째 세션부터 이름, 말투, 이전 성향이 반영된 톤으로 시작한다. 세 번째 세션에서는 추천 선택지가 첫 세션과 달라진 게 체감된다.
7. **대표가 직접 2회 세션 돌려보고 "텍스트 게임 같다"고 느끼면 완료.**

## 설계 원칙 (구현 시 반드시 준수)

- **테마는 모드가 아니다.** 모험가/정원/전략실은 분리된 기능이 아니라, 세션 전체의 톤과 배경으로만 작동한다. 대화, 학습, 자기 분석이 전부 같은 세계관 안에서 일어난다.
- **텍스트 게임 느낌.** 온보딩과 세션 모두 "대사 → 선택 → 즉시 전환"의 리듬. 로딩 화면, 긴 설명, 무거운 UI 없이 가볍게 흘러가야 한다.

## 기존 코드와의 관계

기존 Walking Skeleton(행동기반_개인화)이 만든 파일을 **대폭 수정/교체**한다.
기존 listen 파이프라인(research→analyze→debate→conclude)은 건드리지 않는다.

### 재사용하는 것
- `hooks/useBehaviorSignals.ts` — 행동 신호 수집 (그대로 사용)
- `lib/supabase/client.ts` — Supabase 초기화 (그대로)
- `lib/user-id.ts` — 익명 사용자 ID (그대로)
- `app/api/profile/route.ts` — 프로필 API (인터페이스 변경)
- `app/api/session-summary/route.ts` — 세션 요약 API (그대로)

### 교체하는 것
- `components/discovery/DiscoveryGame.tsx` → 새 온보딩 플로우로 교체
- `components/discovery/DiscoveryChoice.tsx` → 추천 표시가 포함된 새 선택지 컴포넌트
- `lib/personalization/discovery-engine.ts` → 적응형 질문 + 확률 프로필 엔진
- `lib/personalization/behavior-reader.ts` → 양방향 감각화 로직 추가
- `lib/personalization/history-reader.ts` → 확률 분포 프로필 기반으로 재작성
- `app/adventure/[id]/page.tsx` → 새 온보딩 + 세션 내 선택지 시스템 통합

---

## 범위 (IN)

### 1. 온보딩 플로우 — 길잡이가 안내하는 첫 만남

앱 첫 진입 시 시스템 메시지(길잡이 톤)로 단계별 진행.

```
[앱 진입]
  ↓
길잡이: "안녕하세요! 풀림에 오신 걸 환영해요.
        같이 꼬인 것들을 풀어나가봐요."
  ↓
"뭐라고 불러드릴까요?"
  [직접 입력] | 추천: [디바이스 이름 or "여행자"]
  ↓
"반말이 편해요, 존댓말이 편해요?"
  [반말] | [존댓말] | 추천: 반말
  ↓
"어떤 공간이 끌려?"
  🗡️ 모험가 — 희망도 패배도 있는 길
  🌿 정원 — 조용히 정리하는 곳
  🎯 전략실 — 딱 부러지게 가는 곳
  추천: (파악 전이므로 "모험가" 기본 추천)
  ↓
"좋아 [이름]! 저 언덕만 올라가면 바로 풀림에 들어갈 수 있어.
 같이 올라가보자! 몇 가지만 물어볼게."
  ↓
[적응형 파악 질문 시작]
```

**저장:**
- userName: string
- speechStyle: "casual" | "formal"
- selectedTheme: "adventure" | "garden" | "strategy"

**온보딩은 한 번만.** 재방문 시 저장된 설정으로 바로 세션 시작.
단, 설정 변경은 세션 시작 전에 가능.

### 2. 적응형 파악 질문 — 파악될 때까지

기본 5개 질문. 일관성 측정 결과에 따라 추가 질문 발동.

**기본 질문 구조 (기존과 동일):**
- 각 질문은 하나의 축(axis)을 측정
- 의도적으로 같은 축을 2번 측정하는 쌍 포함 → 일관성 계산
- 테마별 세계관으로 포장

**적응 로직:**
```typescript
function shouldAskMore(selections: SelectionRecord[]): boolean {
  const consistency = calculateConsistency(selections);
  const confidence = calculateConfidence(selections);

  // 일관성 낮고 확신도 낮으면 → 파악 부족, 추가 질문
  if (consistency < 0.5 && confidence < 0.3) return true;

  // 일관성 낮지만 확신도 높으면 → 충동적, 확인 질문 1개 더
  if (consistency < 0.5 && confidence >= 0.3) return true;

  return false;
}
```

**추가 질문 풀:**
- 기본 5개 외에 3~5개 추가 질문 준비 (다른 축 조합)
- 최대 8개까지 (그 이상은 피로)
- 추가 질문 시 길잡이: "하나만 더 물어볼게! 거의 다 왔어."

**파악 결과 → 확률 프로필:**
```typescript
interface UserDimension {
  value: number;        // -1.0 ~ 1.0 (예: -1=analytical, +1=intuitive)
  observations: number; // 이 축에서 관찰된 횟수
  lastUpdated: string;  // ISO date
}

interface ProbabilityProfile {
  // 차원별 연속값 (이진 분류 아님)
  approachStyle: UserDimension;     // analytical(-1) ↔ intuitive(+1)
  riskTolerance: UserDimension;     // cautious(-1) ↔ adventurous(+1)
  copingStyle: UserDimension;       // problem_solving(-1) ↔ empathy(+1)
  decisionSpeed: UserDimension;     // deliberate(-1) ↔ spontaneous(+1)

  // 메타 지표
  selfAwareness: UserDimension;     // low(-1) ↔ high(+1)

  // 행동 기반 (세션 누적)
  avgResponseTimeMs: number;
  engagementTrend: number;          // -1(이탈 경향) ~ +1(몰입 경향)
  recommendationAcceptRate: number; // 추천 수락 비율 (0~1)

  // 세션 카운터
  totalSessions: number;
  totalObservations: number;

  // [확장 포인트] 다음 Seed에서 추가될 필드 — 구조 변경 없이 확장 가능하도록
  // philosophyReactions?: Record<string, UserDimension>;  // 철학 이야기 반응 (자유/통제/관계 등)
  // valueFramework?: Record<string, UserDimension>;       // 가치관 프레임 (자율성/안정/성장 등)
}
```

**핵심: 기존 이진 분류 → 연속값 + 관찰 횟수.**
- 첫 파악 게임: `approachStyle: { value: 0.7, observations: 2 }` ← 2번 관찰, 약간 직관적
- 세션 2: 분석적 선택 → `value: 0.3, observations: 3` ← 직관적 쪽으로 기울지만 약해짐
- 세션 10: `value: 0.5, observations: 15` ← 이 사람은 반반, 상황에 따라 다름

**차원 업데이트 공식:**
```typescript
function updateDimension(
  dim: UserDimension,
  newSignal: number,  // -1 or +1
  weight: number = 1  // 기본 1, 추천 불일치 시 1.5
): UserDimension {
  const totalWeight = dim.observations + weight;
  const newValue = (dim.value * dim.observations + newSignal * weight) / totalWeight;
  return {
    value: newValue,
    observations: dim.observations + 1,
    lastUpdated: new Date().toISOString(),
  };
}
```

**추천 불일치 가중치:**
- 추천을 안 골랐을 때 → weight 1.5 (새로운 면일 확률 높음)
- 추천을 골랐을 때 → weight 1.0 (기존 패턴 확인)
- 데이터 적을 때(observations < 10) → "다른 면" 해석 기본
- 데이터 많을 때(observations ≥ 10) → 빈도 기반 자동 판단

### 3. 양방향 감각화 사다리 — 세션 내 선택지 시스템

세션 중 AI 응답마다 선택지가 붙는다. 항상 3가지 형태 공존:

```
[AI 응답 텍스트]

😤 답답하다 | 😎 근데 나 좀 대단한듯 | 😶 잘 모르겠어
추천: 😤 답답하다
[직접 쓰기 입력창]
```

**선택지 생성:** AI가 응답할 때 `[OPTIONS]...[/OPTIONS]` 마커로 선택지를 함께 생성.
기존 listen 파이프라인의 OPTIONS 추출 로직 재활용.

**추천 선택지 결정:**
```typescript
function getRecommendation(
  options: string[],
  profile: ProbabilityProfile,
  behaviorSignals: BehaviorSignals
): { index: number; reason: string } {
  // 프로필 차원 + 현재 행동 신호를 종합해서 가장 가능성 높은 선택 추천
  // reason은 내부 로깅용 (사용자에게 안 보여줌)
}
```

**양방향 감각화 — AI 시스템 프롬프트에 주입:**

```
[SENSORY_LADDER]
이 사용자의 현재 위치: {level}

올라가기 (막막한 사용자):
- 감각 수준: "이거 좋아? 싫어?" 수준의 이모지 선택지
- 분석 수준: "이렇게 보이는데 맞아?" 제안형 선택지
- 결정 수준: "이걸로 갈까?" 확인형 선택지

내려가기 (합리적 사용자):
- 분석 수준: 사용자가 이미 정리한 내용 확인
- 감각 수준: "구조는 알겠어. 그럼 느낌은?" 감정 선택지
- 발견 수준: "혹시 이건 아닐까 —" 새 프레임 제시

현재 사용자 프로필:
- selfAwareness: {value} (높으면 내려가기, 낮으면 올라가기)
- approachStyle: {value} (분석적이면 감각으로, 직관적이면 구조로)

선택지를 생성할 때:
1. 항상 3~4개 + 직접 쓰기 옵션
2. 하나에 [추천] 표시 (프로필 기반 가장 가능성 높은 것)
3. 사용자가 추천과 다른 걸 고르면 → 그 방향으로 자연스럽게 전환
4. "모르겠어" 류의 선택지 항상 포함 (폴백)
[/SENSORY_LADDER]
```

**감각화 방향 결정 로직:**
```typescript
function getSensoryDirection(profile: ProbabilityProfile): "up" | "down" | "neutral" {
  const sa = profile.selfAwareness.value;
  const approach = profile.approachStyle.value;

  // 자기이해 높고 분석적 → 내려가기 (감각으로)
  if (sa > 0.3 && approach < -0.3) return "down";

  // 자기이해 낮음 → 올라가기 (감각에서 시작)
  if (sa < -0.3) return "up";

  // 그 외 → 중립 (AI가 반응 보면서 판단)
  return "neutral";
}
```

### 4. 추천 불일치 추적

모든 선택지에서 추천 vs 실제 선택을 기록.

```typescript
interface ChoiceRecord {
  turnNumber: number;
  options: string[];
  recommendedIndex: number;
  chosenIndex: number;      // -1 = 직접 입력
  responseTimeMs: number;
  isMatch: boolean;         // recommended === chosen
  timestamp: string;
}
```

**세션 종료 시:**
- recommendationAcceptRate 갱신
- 불일치 선택들의 차원별 신호 → 프로필 업데이트 (weight 1.5)
- 일치 선택들 → 프로필 확인 (weight 1.0)

### 5. 세션 시작 분기

```typescript
// 첫 방문
if (isNewUser) {
  → 온보딩 플로우 (길잡이 → 이름/말투/테마 → 파악 질문)
  → 파악 완료 후 세션 시작
}

// 재방문
if (returningUser) {
  → 저장된 설정으로 바로 시작
  → 길잡이: "[이름]! 다시 왔구나. 오늘은 어떤 걸 들고 왔어?"
  → 선택지: 고민 있어 | 그냥 왔어 | 지난번 이어서 | 추천: (프로필 기반)
}
```

---

## 범위 (OUT) — 이번에 하지 않는 것

- 기존 listen 파이프라인(research→analyze→debate→conclude) 수정
- 철학/심리학 이야기화 콘텐츠 (다음 Seed: 세계관 내 학습/자기분석)
- 고민 없는 진입 경로 (다음 Seed: "그냥 왔어" 분기의 구체 구현)
- 길잡이 캐릭터 비주얼/고급 인터랙션 (미확정, 보류)
- 정원/전략실 테마별 파악 질문 (모험가 먼저, 나머지 다음)
- 프라이버시 동의 UI
- 사용자 인증/로그인
- Supabase 실제 연결 (localStorage 폴백 유지)
- ML/스코어링 기반 개인화

---

## 파일 수정 순서 (빌드 깨짐 방지)

아래 순서대로 수정해야 각 단계에서 빌드가 유지된다:

1. `lib/personalization/probability-profile.ts` 신규 (타입 정의)
2. `lib/personalization/discovery-engine.ts` 수정 (새 타입 기반)
3. `lib/personalization/history-reader.ts` 수정 (새 타입 기반)
4. `hooks/useUserProfile.ts` 수정 + `app/adventure/[id]/page.tsx` 임포트 동시 수정
5. `components/discovery/DiscoveryGame.tsx`, `DiscoveryChoice.tsx` 교체 + `page.tsx` props 동시 수정
6. `components/onboarding/*` 신규 + `components/session/*` 신규
7. `lib/personalization/behavior-reader.ts` 수정 (감각화 추가)
8. `lib/personalization/recommendation-engine.ts`, `sensory-ladder.ts` 신규
9. `app/api/ultimate/listen/route.ts` 수정 (SENSORY_LADDER 주입) — 마지막

## 파일 변경 계획

### 새 파일
```
src/
├── components/
│   ├── onboarding/
│   │   ├── OnboardingFlow.tsx        # 전체 온보딩 오케스트레이터
│   │   ├── WelcomeStep.tsx           # 길잡이 환영 + 이름 입력
│   │   ├── SpeechStyleStep.tsx       # 반말/존댓말 선택
│   │   └── ThemeSelectStep.tsx       # 테마 선택 (추천 포함)
│   └── session/
│       ├── ChoiceSelector.tsx        # 추천 표시 포함 선택지 컴포넌트
│       └── RecommendationBadge.tsx   # "추천" 뱃지
├── lib/
│   └── personalization/
│       ├── probability-profile.ts    # ProbabilityProfile 타입 + 업데이트 로직
│       ├── recommendation-engine.ts  # 추천 선택지 결정
│       └── sensory-ladder.ts         # 양방향 감각화 방향 결정
```

### 수정 파일
```
src/
├── components/discovery/
│   ├── DiscoveryGame.tsx             # 적응형 질문 로직으로 교체
│   └── DiscoveryChoice.tsx           # 추천 표시 추가
├── lib/personalization/
│   ├── discovery-engine.ts           # 추가 질문 풀 + 적응 로직 + 확률 프로필
│   ├── behavior-reader.ts            # 양방향 감각화 컨텍스트 생성 추가
│   └── history-reader.ts             # ProbabilityProfile 기반으로 재작성
├── hooks/
│   └── useUserProfile.ts             # ProbabilityProfile 타입으로 변경
├── app/
│   ├── adventure/[id]/page.tsx       # 온보딩 + 세션 내 선택지 시스템 통합
│   └── api/
│       └── ultimate/listen/route.ts  # SENSORY_LADDER 컨텍스트 주입 추가
```

---

## 테스트 시나리오

### 온보딩
1. 첫 방문: 길잡이 환영 → 이름("상규") → 반말 → 모험가 선택 → 파악 5개 → 세션
2. 추천만 따라가기: 모든 선택에서 추천 클릭 → 정상 진행 (막막한 사용자 시뮬레이션)
3. 추천 무시: 모든 선택에서 추천 아닌 것 클릭 → 프로필에 다른 면 기록

### 적응형 파악
4. 일관된 선택: 5개 후 종료
5. 비일관적 + 느림: 5개 후 추가 2~3개 → "하나만 더!" → 최대 8개
6. 비일관적 + 빠름: 5개 후 추가 1개 (충동 확인용)

### 양방향 감각화
7. 합리적 사용자 (대표 시뮬): "구조 다 파악했어" → AI가 "느낌은?" 내려가기
8. 막막한 사용자: 단답/모르겠어 반복 → AI가 감각 선택지 올라가기
9. 중간 사용자: AI가 반응 보면서 방향 전환

### 추천 불일치
10. 추천 수락 → 기존 패턴 확인 (weight 1.0)
11. 추천 거부 → "다른 면" 기록 (weight 1.5)
12. 10회 세션 후 → 추천 정확도 체감 향상

### 재방문
13. 두 번째 방문: 온보딩 스킵 → "[이름]! 다시 왔구나" → 프로필 기반 톤
14. 세 번째 방문: 프로필 점점 정교해짐 → 추천 더 정확

### 안전
15. 위기 감지가 항상 감각화/추천보다 먼저 실행

---

## 참고 자료
- `제품/풀림_미션과_진짜UX_2026-03-25.md` — 오늘 세션 전체 설계 원칙 + 시뮬레이션 기록
- `제품/풀림_진짜시작_2026-03-24.md` — 행동 기반 개인화 비전 원문
- `.state/seeds/행동기반_개인화_walking_skeleton.md` — 이전 Seed (이번에 발전시킴)
