# Seed: 행동 기반 개인화 — Walking Skeleton

## 한줄 목표
사용자를 파악하는 과정 자체가 재미있는 게임이고, 파악한 것을 바탕으로 사용자가 결정을 '느끼도록' 돕는 시스템. 파악 → 느끼게 → 결정. 이 인과고리가 핵심.

## 핵심 경험 (대표 원문)

> "즐거워? 아니야? 그럼 다른거. 아니야? 그럼 다른거. 이제 좀 괜찮아? 이거네."
> "심리 테스트처럼 현실과 관계없어보이는 걸 통해 데이터를 파악해도 되고."
> "마치 말 못하는 아기를 데리고, 표정만 보면서 아기가 좋아할 간식을 갖다주는 것처럼."
> "AI가 대화 이면에서 계속 생각을 해서 태도를 결정하게 하는거지."

## 완료 기준 (AC)

1. **사용자가 재미있는 선택을 3~5번 하면**, AI가 "너는 이런 사람인 것 같아"를 (말하지 않고) 행동으로 보여준다. 톤이 바뀌고, 질문 방식이 바뀌고, 선택지가 달라진다.
2. **선택이 어렵지 않다.** "뚝딱뚝딱 vs 흐름대로" 수준. 고민 없이 직감으로 고를 수 있는 것들.
3. **망설이거나 짧게 답하면 AI가 알아채고 방식을 바꾼다.** 사용자는 "왜 바꿨어?"라고 묻지 않는다 — 자연스러워서.
4. **두 번째 세션에서 첫 세션의 패턴이 살아있다.** "아, 기억하네" 느낌.
5. **대표가 직접 해보고 "다르다"고 느끼면 완료.**

## 이것은 기존 파이프라인(listen→research→analyze...)과 별개의 새로운 경험이다.
기존 파이프라인은 건드리지 않는다. 새로운 흐름을 만든다.

---

## 범위 (IN)

### 1. 파악 게임 — "너를 알아가는 시간"

세션 초반에 진행되는 게임화된 파악 과정. 심리 테스트 느낌이지만 풀림 테마에 맞게.

**게임 구조:**
- 3~5개의 쉬운 선택을 연속으로 제시
- 각 선택은 고민과 무관해 보이지만 성향을 드러냄
- 테마(모험가/달빛정원/전략실)에 맞는 세계관으로 포장

**예시 (모험가 테마):**
```
1. "두 갈래 길이 보인다. 어디로?"
   - 🌲 숲 속 오솔길 (→ 신중함, 안전 선호)
   - 🌋 연기 나는 산길 (→ 도전적, 자극 선호)

2. "보물상자를 발견했다. 어떻게?"
   - 🔑 열쇠를 찾아본다 (→ 분석적, 단계적)
   - 💪 그냥 연다 (→ 직관적, 행동 우선)

3. "동료가 다쳤다. 어떻게?"
   - 🏥 약초를 찾으러 간다 (→ 문제해결 지향)
   - 🤝 옆에 앉아서 기다린다 (→ 공감 지향)

4. "마왕이 제안한다. '한 가지 소원을 들어주지.'"
   - 💭 "생각할 시간을 줘" (→ 숙고형)
   - ⚡ 즉시 대답한다 (→ 즉흥형)
```

**수집되는 것 (사용자는 모름):**
- 어떤 선택을 했는지 (성향 분류)
- 얼마나 빨리 골랐는지 (확신도)
- 어떤 선택지에서 오래 멈췄는지 (갈등 지점)

**비일관성도 데이터다:**
- 기존 심리검사: 비일관적 응답 = 무효 데이터, 버림
- 풀림: 비일관적 응답 = "이 사람은 자기를 잘 모른다" = 핵심 데이터
- 일관적 선택 → 자기이해 높음 → 분석/리서치 위주로 진행
- 비일관적 선택 → 자기이해 낮음 → 감각/직관 위주로 진행 ("느끼게 만들기" 기법 우선)
- 빠르게 골랐는데 비일관 → 충동적, 생각 없이 고름 → 천천히 확인하며 진행
- 오래 골랐는데 비일관 → 진짜 모르는 상태 → 최대한 부담 줄이고 쉬운 것부터

**질문 설계 원칙:**
- 심리학 기본 원리(Big Five 등) 기반 초안으로 구현. 이후 리서치로 교체 예정
- 3~5개 선택 중 의도적으로 같은 축을 2번 측정하는 쌍을 포함 → 일관성 자동 측정

**파악 결과 (내부 프로필):**
```typescript
interface UserProfile {
  // 선택 기반
  approachStyle: "analytical" | "intuitive";    // 분석적 vs 직관적
  riskTolerance: "cautious" | "adventurous";    // 신중 vs 도전적
  copingStyle: "problem_solving" | "empathy";   // 문제해결 vs 공감
  decisionSpeed: "deliberate" | "spontaneous";  // 숙고 vs 즉흥

  // 행동 기반 (자동 측정)
  avgSelectionTime: number;     // 평균 선택 시간
  hesitationPoints: number[];   // 망설인 선택지 인덱스
  confidence: number;           // 전체 확신도 (빠른 선택 비율)
  consistency: number;          // 0~1, 같은 축 2회 측정의 일관성
  selfAwareness: "high" | "low";  // consistency + confidence 종합
}
```

### 2. 이면 사고 레이어 — 매 턴 실시간 조정

파악 게임이 끝나고 본 대화가 시작되면, AI는 이면에서 계속 사용자를 읽는다.

**프론트엔드 행동 수집 (`hooks/useBehaviorSignals.ts`):**
```typescript
interface BehaviorSignals {
  responseTimeMs: number;        // 직전 응답까지 걸린 시간
  messageLength: number;         // 직전 메시지 길이
  lengthTrend: "shorter" | "stable" | "longer";   // 3턴 추세
  timeTrend: "faster" | "stable" | "slower";       // 3턴 추세
  choiceHesitationMs: number;    // 선택지 앞에서 멈춘 시간
  choiceChanges: number;         // 선택지 바꾼 횟수 ("잘 못고르네" 감지)
  turnCount: number;
}
```

**매 API 호출 시 behaviorSignals를 함께 전송.**

**`lib/personalization/behavior-reader.ts`** — 신호 → 태도 지시문:
```
IF 답변이 점점 짧아짐 (3턴 연속)
  → "피로하거나 관심이 줄었다. 가볍게 전환하거나 마무리 제안."

IF 선택지 앞에서 45초+ 멈춤
  → "결정이 어렵다. 선택지를 줄이거나 더 쉽게 재구성."

IF 즉답 (3초 이내)
  → "깊이 생각하지 않는 상태. 가볍게 진행하되 중요 지점에서 확인."

IF 답변이 점점 길어짐
  → "마음이 열리는 중. 끊지 말고 따라가라."

IF 단답 (5자 이하)
  → "말하기 싫은 상태. 추궁하지 말고 선택지를 제시."
```

**주입:** 시스템 프롬프트 끝에 `[BEHAVIOR_CONTEXT]` 블록.
사용자에게 "네 응답 시간이 길어졌어" 같은 직접 언급 절대 금지.

### 3. 세션 간 기억 — "나를 기억하는 AI"

**DB (Supabase):**
```sql
-- 사용자 프로필 (파악 게임 결과 + 누적 패턴)
CREATE TABLE user_profiles (
  user_id TEXT PRIMARY KEY,
  profile JSONB NOT NULL DEFAULT '{}',    -- UserProfile
  session_count INT DEFAULT 0,
  last_session_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 세션별 행동 요약 (이벤트 원본 아님, 요약만)
CREATE TABLE session_summaries (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user_profiles(user_id),
  theme TEXT NOT NULL,
  avg_response_time_ms INT,
  avg_message_length INT,
  satisfaction_score INT,           -- 1~5, null이면 스킵
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**세션 시작 시:**
1. localStorage에서 user_id 조회 (없으면 생성)
2. user_profiles에서 프로필 조회
3. 첫 방문이면 → 파악 게임 시작
4. 재방문이면 → 프로필 기반 톤 설정 + 파악 게임 스킵 (또는 짧게)

**`lib/personalization/history-reader.ts`** — 재방문 시 프롬프트 주입:
```
IF analytical + cautious → "이 사용자는 분석적이고 신중하다. 근거를 먼저 제시하고, 성급하게 결론짓지 마라."
IF intuitive + adventurous → "이 사용자는 직관적이고 도전적이다. 느낌을 먼저 물어보고, 데이터보다 감각으로 다가가라."
IF 지난 만족도 낮음 → "지난번에 만족하지 못했다. 다른 접근을 시도하라."
IF 세션 완료율 낮음 → "이 사용자는 세션을 자주 중단한다. 핵심을 빨리."
```

### 4. 익명 사용자 식별
- `lib/user-id.ts` — localStorage에 랜덤 ID 저장/조회
- 로그인 없이 동일 브라우저 = 동일 사용자
- 시크릿/기기변경 → 새 사용자 (파악 게임부터 다시)

### 5. 만족도 수집
- 세션 끝에 테마에 맞는 톤으로 간단히: "오늘 여정은 어땠어?" (별 1~5)
- 스킵 가능 (스킵 자체도 기록)

### 6. Supabase 연결
- `lib/supabase/client.ts` — 서버/클라이언트 초기화
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## 범위 (OUT) — 이번에 하지 않는 것
- 기존 파이프라인(listen→research→analyze→debate→conclude) 수정
- 고민 라우팅 (Quick/Talk/Deep)
- 모델 저비용화
- 고급 비언어 분석 (타이핑 패턴, 시선 추적)
- ML/스코어링 기반 개인화 (데이터 충분 후)
- 사용자 인증/로그인
- 프라이버시 동의 UI (다음 슬라이스)
- 감각 트리거 ("느끼게 만들기" 기법들 — 극단화, 타인 시점 등은 다음 슬라이스. 단, 이번 Walking Skeleton에서 프로필 기반으로 톤/접근을 바꾸는 것이 "느끼게"의 첫 단계)
- "행동과 말의 일치" 검증 (패턴 데이터 충분 후 — 다음 슬라이스)
- 파악 게임의 달빛정원/전략실 버전 (모험가 먼저, 나머지는 다음)
- 파악 게임 중 실시간 분기/적응 (이번은 3~5선택 고정 순서 수집 → 프로필 생성. "즐거워? 다른거" 적응형 게임 흐름은 다음 슬라이스)
- 결정 유형별 패턴 누적 (치킨 예시 수준의 "이 조건일 때 보통 이렇더라" → 데이터 충분 후 슬라이스에서 `decision_patterns` 테이블 추가)

## 새 파일 목록 (예상)
```
src/
├── app/
│   ├── api/
│   │   ├── profile/route.ts          # 프로필 조회/생성
│   │   └── session-summary/route.ts  # 세션 요약 저장
│   └── adventure/[id]/
│       └── discovery-game.tsx        # 파악 게임 컴포넌트 (모험가)
├── components/
│   └── discovery/
│       ├── DiscoveryGame.tsx         # 파악 게임 UI
│       ├── DiscoveryChoice.tsx       # 선택지 카드
│       └── DiscoveryResult.tsx       # (내부용) 결과 표시 안 함
├── hooks/
│   ├── useBehaviorSignals.ts         # 실시간 행동 수집
│   └── useUserProfile.ts            # 프로필 조회/캐시
└── lib/
    ├── supabase/
    │   └── client.ts                 # Supabase 초기화
    ├── personalization/
    │   ├── behavior-reader.ts        # 세션 내 실시간 태도 조정
    │   ├── history-reader.ts         # 세션 간 프로필 기반 조정
    │   └── discovery-engine.ts       # 파악 게임 로직 + 프로필 생성
    └── user-id.ts                    # 익명 사용자 ID
```

## 기존 코드 변경
- `listen/route.ts` — behaviorSignals 파라미터 추가 + [BEHAVIOR_CONTEXT] 주입
- 세션 페이지(`[id]/page.tsx`) — useBehaviorSignals 훅 추가 + 파악 게임 분기
- 그 외 기존 파일 변경 없음

## 테스트 시나리오

### 파악 게임
1. 첫 방문: 모험가 테마 → 파악 게임 3~5선택 → 본 대화 시작 → AI 톤이 프로필에 맞춰짐
2. 빠르게 고르는 사용자: 전부 3초 이내 → "즉흥형" 프로필 → 직관적 톤
3. 오래 고르는 사용자: 매번 30초+ → "숙고형" 프로필 → "천천히 생각해봐" 톤

### 세션 내 실시간 조정
4. 답변 점점 짧게 → AI가 질문 가볍게 바꾸거나 마무리 제안
5. 선택지 앞에서 1분+ 멈춤 → AI가 "편하게 골라봐" 또는 선택지 재구성
6. 갑자기 장문 → AI가 끊지 않고 따라감

### 세션 간 기억
7. 재방문: 파악 게임 스킵 → 프로필 기반 톤으로 바로 시작
8. 시크릿 창: 새 사용자 → 파악 게임부터

### 안전
9. 위기 감지가 항상 behavior-reader보다 먼저 실행

## 참고 자료
- `제품/풀림_진짜시작_2026-03-24.md` — 대표 비전 원문
- `리서치/대형프로젝트_진행방법론_2026-03-24.md` — Walking Skeleton 아키텍처
- `제품/고민_라우팅_설계.md` — 통합 경계 참고 (충돌 방지)
