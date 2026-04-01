# 하네스: 사다리-도구 연결 (리서치 + 분석)

## 배경
슬라이드 3장: "이종모델 분석 / 이종모델 리서치 — 기존 앱이 못 주는 것을 풀림이 해결"
슬라이드 4장: "+ 리서치/분석이 각 단계를 보조"
슬라이드 5장: "분석 = 여러 AI 독립 분석, 의견 갈리는 지점 / 리서치 = 여러 관점 조사·비교, 할루시네이션 교차 검증"

**현재 상태**: 리서치 API(`/api/ultimate/research`)와 분석 API(`/api/ultimate/analyze`)가 각각 존재하지만, 사다리 세션(LadderSession)과 **연결되어 있지 않음**. 사다리 세션은 `/api/ultimate/listen`만 호출 중.

**목표**: 사다리 세션 진행 중 적절한 시점에 리서치/분석을 트리거하고, 결과를 세션 내에서 보여주는 것.

## 아키텍처 설계

```
LadderSession (기존)
├── /api/ultimate/listen (SSE 스트리밍 대화) ← 기존
├── behind-the-scenes.ts (이면사고) ← 기존
│
└── 🆕 도구 연결 레이어
    ├── /api/ladder/research (사다리용 리서치 래퍼)
    ├── /api/ladder/analyze (사다리용 분석 래퍼)
    ├── tool-trigger.ts (트리거 감지 로직)
    └── ToolCard.tsx + AnalysisCard.tsx (결과 표시 UI)
```

**트리거 시점**:
- 리서치: 턴 4+ 이후 주제가 명확해졌을 때, 또는 사용자가 "찾아봐", "리서치" 등 요청 시
- 분석: 턴 6+ 이후, 또는 사용자가 "다른 시각", "분석" 등 요청 시
- 자동 트리거는 behind-the-scenes의 topicClarity 판단 기반
- 세션당 리서치 1회, 분석 1회 제한 (API 비용 관리)

## 공통 규칙
- 기존 파일을 **먼저 읽고** 최신 상태 위에서 수정
- 파일 수정 후 반드시 `cd ~/study/main/pullim/pullim && npx next build` 로 빌드 확인
- 커밋 메시지: `feat: [간단 설명]`
- 기존 LadderSession 흐름을 깨지 마라 — 도구는 **보조**이지 필수가 아님
- API 키 없으면 데모 모드 자동 적용 (기존 isDemoMode 패턴 따르기)

---

## Task 1: 도구 트리거 감지 로직

**생성 대상**: `pullim/src/lib/session/tool-trigger.ts`

**해야 할 것**:
1. 먼저 `pullim/src/lib/session/behind-the-scenes.ts` 읽어서 BehindInference, BehaviorSignals 타입 확인
2. 먼저 `pullim/src/lib/session/ladder-types.ts` 읽어서 LadderMessage 타입 확인
3. 아래 인터페이스 + 함수 구현:

```typescript
export interface ToolTriggerState {
  researchTriggered: boolean;  // 세션 내 리서치 이미 실행했는지
  analysisTriggered: boolean;  // 세션 내 분석 이미 실행했는지
  turnCount: number;
  topicSummary: string;        // 현재까지 파악된 주제 요약
}

export interface ToolSuggestion {
  type: "research" | "analysis" | null;
  reason: string;              // 왜 이 도구를 제안하는지 (UI 표시용)
  autoTrigger: boolean;        // true면 자동 실행, false면 버튼 제안
}

export function checkToolTrigger(
  messages: LadderMessage[],
  state: ToolTriggerState,
  inference: BehindInference | null
): ToolSuggestion
```

4. `checkToolTrigger` 로직:
   - `state.researchTriggered && state.analysisTriggered` → `null` (둘 다 실행됨)
   - 사용자 메시지에 키워드 감지 (명시적 요청):
     - 리서치: "찾아", "검색", "리서치", "조사", "데이터", "통계", "사례"
     - 분석: "분석", "다른 시각", "다른 관점", "비교", "의견"
     - 키워드 매치 → `autoTrigger: true`
   - 자동 트리거 (명시적 요청 없을 때):
     - 리서치: `turnCount >= 4` && `!researchTriggered` && `inference?.opening === true` → `autoTrigger: false` (버튼 제안)
     - 분석: `turnCount >= 6` && `!analysisTriggered` && `researchTriggered` → `autoTrigger: false`
   - reason 예시: "이 주제에 대해 데이터를 찾아볼 수 있어", "다른 AI들은 어떻게 볼지 확인해볼까?"

5. 주제 요약 추출 헬퍼:
```typescript
export function extractTopicSummary(messages: LadderMessage[]): string
```
   - 사용자 메시지(role=user)만 필터, 최근 4개를 이어붙여 100자 제한
   - 빈 메시지면 "(아직 주제 파악 중)" 반환

**검증**: 빌드 통과

---

## Task 2: 사다리용 리서치/분석 API 래퍼

**생성 대상**:
- `pullim/src/app/api/ladder/research/route.ts`
- `pullim/src/app/api/ladder/analyze/route.ts`

### 2-A: 리서치 래퍼

**해야 할 것**:
1. 먼저 `pullim/src/app/api/ultimate/research/route.ts` 전체 읽기
2. 먼저 `pullim/src/lib/demo.ts` 읽어서 isDemoMode, DEMO_RESEARCH_CARDS 확인
3. 새 라우트 생성 — 기존 research를 사다리 맥락에 맞게 래핑:

```typescript
// Request
interface LadderResearchRequest {
  topicSummary: string;    // extractTopicSummary()의 결과
  theme: string;           // 현재 테마
  currentLevel: number;    // 현재 사다리 레벨
}

// Response
interface LadderResearchResponse {
  cards: DataCard[];       // 기존 DataCard 재사용
  skipped: boolean;
  demoMode: boolean;
}
```

4. 구현:
   - 위기 감지(`detectCrisis`) 먼저 실행
   - `isDemoMode()` → DEMO_RESEARCH_CARDS 3장 반환 (기존 패턴)
   - 실제 모드 → 기존 `buildResearchPrompt` 로직을 참조하되, 프롬프트를 사다리 맥락에 맞게 조정:
     - "사용자가 사다리 세션에서 다음 주제로 대화 중이다: {topicSummary}"
     - 3가지 관점(통계/사례/전문가) 동일
   - Perplexity API 호출 (기존 research/route.ts와 동일한 방식)
   - 결과를 DataCard[]로 파싱하여 반환
   - API 키 없으면 → 데모 카드 반환 + `demoMode: true`

### 2-B: 분석 래퍼

**해야 할 것**:
1. 먼저 `pullim/src/app/api/ultimate/analyze/route.ts` 전체 읽기
2. 먼저 `pullim/src/lib/providers/index.ts` 읽어서 parallelChat, getAvailableProviders 확인
3. 새 라우트 생성:

```typescript
// Request
interface LadderAnalyzeRequest {
  topicSummary: string;
  messages: { role: string; content: string }[];  // 최근 대화 6턴
  theme: string;
}

// Response
interface LadderAnalyzeResponse {
  perspectives: LadderPerspective[];  // 3개 관점 (간소화된 분석)
  disagreement: string | null;        // 의견 갈리는 핵심 지점 1개
  demoMode: boolean;
}

interface LadderPerspective {
  name: string;         // "공감형 시각", "분석형 시각", "도전형 시각"
  model: string;        // 실제 사용한 모델
  observation: string;  // 1~2문장 관찰
  question: string;     // 사용자에게 던지는 질문
}
```

4. 구현:
   - 위기 감지 먼저
   - `isDemoMode()` → 데모 관점 3개 하드코딩 반환
   - 실제 모드:
     - `getAvailableProviders()` 호출
     - 3개 관점(공감/분석/도전)에 대해 각각 다른 모델 할당 (assignModels 패턴)
     - 프롬프트: "사용자가 '{topicSummary}'에 대해 고민 중이다. 당신은 {관점}에서 1~2문장으로 관찰하고, 사용자가 스스로 생각해볼 질문 1개를 던져라."
     - `parallelChat()` 3개 호출
     - 결과 파싱 → LadderPerspective[]
     - 3개 관점 비교 → 가장 다른 의견 = disagreement 문자열
   - API 키 없으면 데모 반환
5. 데모 데이터 (테마별 1세트):
   - 공감형: "지금 많이 지쳐 있는 것 같아요." + "지금 가장 쉬고 싶은 부분은 어디인가요?"
   - 분석형: "현재 상황을 정리하면 선택지가 보일 수 있어요." + "가장 먼저 해결하고 싶은 한 가지는?"
   - 도전형: "지금이 변화할 타이밍일 수 있어요." + "만약 실패해도 괜찮다면 뭘 하고 싶으세요?"
   - disagreement: "공감형은 쉼을 권하고, 도전형은 행동을 권합니다. 어느 쪽이 끌리나요?"

**검증**: 빌드 통과

---

## Task 3: 도구 결과 표시 UI 컴포넌트

**생성 대상**:
- `pullim/src/components/session/ToolCards.tsx`

**해야 할 것**:
1. 먼저 `pullim/src/components/session/LadderSession.tsx`를 읽어서 기존 스타일/톤 파악
2. 먼저 `pullim/src/lib/types-ultimate.ts` 읽어서 DataCard 타입 확인
3. 두 가지 컴포넌트 구현:

### ResearchCards — 리서치 결과 카드
```typescript
interface ResearchCardsProps {
  cards: DataCard[];
  demoMode: boolean;
  onDismiss: () => void;
}
```
- DataCard 3장을 가로 스크롤 또는 세로 나열
- 각 카드: title(이모지 포함) + fact(1~2문장) + confidence 배지(high=초록/medium=노랑/low=빨강)
- source가 있으면 작은 글씨로 출처 표시
- demoMode면 카드 하단에 "(데모 데이터)" 작은 텍스트
- "확인" 버튼으로 닫기 → onDismiss
- 기존 판타지 다크 톤 유지 (반투명 배경 + 둥근 모서리 + 보라색 강조)
- 등장 애니메이션: fade-in + slide-up (CSS transition)

### AnalysisView — 분석 결과 뷰
```typescript
interface AnalysisViewProps {
  perspectives: LadderPerspective[];
  disagreement: string | null;
  demoMode: boolean;
  onDismiss: () => void;
  onSelectPerspective: (question: string) => void;  // 관점의 질문을 세션에 주입
}
```
- 관점 3개를 카드로 나열 (각각 이름 + 관찰 + 질문)
- 질문을 탭하면 → onSelectPerspective로 해당 질문을 세션에 전달 (사용자가 이 질문에 답하는 흐름)
- disagreement가 있으면 하단에 강조 박스: "의견이 갈리는 지점: {disagreement}"
- 스타일: 기존 LadderSession 카드 스타일과 통일

### LadderPerspective 타입 (여기서 export)
```typescript
export interface LadderPerspective {
  name: string;
  model: string;
  observation: string;
  question: string;
}
```

**검증**: 빌드 통과

---

## Task 4: LadderSession에 도구 연결 통합

**수정 대상**: `pullim/src/components/session/LadderSession.tsx`

**해야 할 것**:
1. 먼저 파일 전체를 읽어라 (중요!)
2. import 추가:
   - `import { checkToolTrigger, extractTopicSummary, ToolTriggerState, ToolSuggestion } from "@/lib/session/tool-trigger"`
   - `import { ResearchCards, AnalysisView, LadderPerspective } from "./ToolCards"`
   - `import type { DataCard } from "@/lib/types-ultimate"`

3. state 추가 (기존 state 선언부 근처):
```typescript
const [toolState, setToolState] = useState<ToolTriggerState>({
  researchTriggered: false,
  analysisTriggered: false,
  turnCount: 0,
  topicSummary: "",
});
const [toolSuggestion, setToolSuggestion] = useState<ToolSuggestion | null>(null);
const [researchCards, setResearchCards] = useState<DataCard[] | null>(null);
const [analysisPerspectives, setAnalysisPerspectives] = useState<LadderPerspective[] | null>(null);
const [analysisDisagreement, setAnalysisDisagreement] = useState<string | null>(null);
const [toolLoading, setToolLoading] = useState(false);
const [toolDemoMode, setToolDemoMode] = useState(false);
```

4. 도구 트리거 체크 — **AI 응답 수신 완료 후** (기존 스트리밍 완료 콜백 위치에):
```typescript
// 턴 카운트 갱신
const newTurnCount = toolState.turnCount + 1;
const newTopicSummary = extractTopicSummary(store.messages);
const newToolState = { ...toolState, turnCount: newTurnCount, topicSummary: newTopicSummary };
setToolState(newToolState);

// 도구 제안 체크
const suggestion = checkToolTrigger(store.messages, newToolState, currentInference);
if (suggestion.type) {
  if (suggestion.autoTrigger) {
    triggerTool(suggestion.type, newTopicSummary);
  } else {
    setToolSuggestion(suggestion);
  }
}
```

5. triggerTool 함수:
```typescript
async function triggerTool(type: "research" | "analysis", topicSummary: string) {
  setToolLoading(true);
  setToolSuggestion(null);
  try {
    if (type === "research") {
      const res = await fetch("/api/ladder/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicSummary, theme, currentLevel: store.currentLevel }),
      });
      const data = await res.json();
      setResearchCards(data.cards);
      setToolDemoMode(data.demoMode);
      setToolState(prev => ({ ...prev, researchTriggered: true }));
    } else {
      const recentMessages = store.messages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/ladder/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topicSummary, messages: recentMessages, theme }),
      });
      const data = await res.json();
      setAnalysisPerspectives(data.perspectives);
      setAnalysisDisagreement(data.disagreement);
      setToolDemoMode(data.demoMode);
      setToolState(prev => ({ ...prev, analysisTriggered: true }));
    }
  } catch (e) {
    console.error("Tool trigger failed:", e);
  }
  setToolLoading(false);
}
```

6. UI 렌더링 (phase === "session" 블록 내, 메시지 영역 아래에):
```tsx
{/* 도구 제안 버튼 */}
{toolSuggestion && !toolLoading && (
  <button
    onClick={() => triggerTool(toolSuggestion.type!, toolState.topicSummary)}
    className="mx-auto my-2 px-4 py-2 rounded-xl bg-indigo-900/30 border border-indigo-500/20 text-indigo-300 text-sm hover:bg-indigo-900/50 transition-colors"
  >
    {toolSuggestion.type === "research" ? "📚" : "🔬"} {toolSuggestion.reason}
  </button>
)}

{/* 로딩 */}
{toolLoading && (
  <div className="text-center text-indigo-400/60 text-sm my-2 animate-pulse">
    {toolSuggestion?.type === "research" ? "리서치 중..." : "분석 중..."}
  </div>
)}

{/* 리서치 결과 */}
{researchCards && (
  <ResearchCards
    cards={researchCards}
    demoMode={toolDemoMode}
    onDismiss={() => setResearchCards(null)}
  />
)}

{/* 분석 결과 */}
{analysisPerspectives && (
  <AnalysisView
    perspectives={analysisPerspectives}
    disagreement={analysisDisagreement}
    demoMode={toolDemoMode}
    onDismiss={() => { setAnalysisPerspectives(null); setAnalysisDisagreement(null); }}
    onSelectPerspective={(question) => {
      // 관점의 질문을 사용자 입력으로 주입
      setAnalysisPerspectives(null);
      setAnalysisDisagreement(null);
      // 기존 메시지 전송 로직 활용 — question을 input에 세팅하거나 직접 전송
      // 구현: store의 addMessage나 기존 handleSend와 동일한 패턴 사용
    }}
  />
)}
```

7. **주의사항**:
   - 기존 phase 전환 로직 건드리지 마라
   - 기존 스트리밍 로직 건드리지 마라
   - 도구 결과는 메시지 목록 아래, 입력창 위에 표시
   - 도구가 실패해도 세션은 정상 진행 (catch에서 로깅만)

**검증**: 빌드 통과

---

## Task 5: 빌드 + 통합 테스트 + 커밋

**해야 할 것**:
1. `cd ~/study/main/pullim/pullim && npx next build` 실행
2. 타입 에러 있으면 수정
3. 빌드 통과 확인
4. 커밋: `feat: 사다리-도구 연결 — 리서치/분석 트리거 + UI 통합`
5. `git push origin main`

---

## 예상 시간: 60분
## 우선도: 슬라이드 정합성 — 발표에서 "리서치/분석이 각 단계를 보조"라고 말함, 실제로 작동해야 함
