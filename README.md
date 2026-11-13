# 🌿 Pullim (풀림)

> **Open-Source Cognitive Unraveling & Socratic Decision Workbench (Web + CLI + TypeScript Engine)**  
> 막연한 고민을 **사실(Fact)과 가정(Assumption)**으로 분리하고, **양방향 5단계 인지 사다리**와 **If-Then 실행 약속**으로 풀어내는 로컬 우선(Local-First) 오픈소스 도구입니다.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-brightgreen.svg)](package.json)
[![Node.js >= 22.6](https://img.shields.io/badge/node-%3E%3D22.6-339933.svg)](package.json)

---

## 왜 풀림(Pullim)인가요? (Why Pullim?)

백지 노트를 펴고 "내 고민을 정리해보자"라고 하면 어디서부터 적어야 할지 막막하고, 일반 AI 챗봇에게 물어보면 내 맥락도 모른 채 뻔한 정답이나 조언부터 늘어놓습니다.

**풀림(Pullim)**은 AI가 인간 대신 결정을 내리지 않고(**Augment Only**), 다음 **6가지 인지 도구**로 스스로의 결정과 행동을 끌어냅니다:

1. **사실(Fact) vs 가정(Assumption) 자동 분리**: 머릿속에 한 덩어리로 엉킨 문장에서 '확인된 사실'과 '아직 일어나지 않은 추측·두려움'을 분리하고 반례 질문을 던집니다.
2. **인지적 함정(Blind Spots) 6종 포착**: 이분법적 사고, 파국화, 타인 마음 단정, 과도한 당위 압박(`~해야만 한다`), 매몰비용 집착, 과잉분석 마비를 탐지합니다.
3. **3가지 시선 렌즈 (3 Perspective Lenses)**:
   - `🌿 공감·수용 시선 (Grounding)`: 감정 무게 덜어내기와 에너지 보호
   - `📐 구조·논리 시선 (Structural)`: 정보 가치와 가역적(되돌릴 수 있는) 결정 분리
   - `🧭 직관·전환 시선 (Exploratory)`: 프레임 뒤집기와 48시간 최소 실험
4. **양방향 5단계 인지 사다리 (Bidirectional 5-Level Cognitive Ladder)**:
   - **🔼 올라가기 (`Level 1 → 5`)**: 말로 설명하기 힘들 만큼 막막할 때 **감각(L1) → 양자 대비(L2) → 사실/가정(L3) → 작은 실험(L4) → 내 언어의 통찰(L5)**로 한 계단씩 올라갑니다.
   - **🔽 내려가기 (`Level 5 → 1`)**: 머리로는 장단점 분석이 다 끝났는데 마음이 안 움직일 때(과잉합리화 감지), 논리를 내려놓고 **감각·직관 단계(L2/L1)**로 내려가 진짜 걸림돌을 확인합니다.
   - **선택 부담 제거 (`✦ 추천 기본값`)**: 결정 피로 상태에서도 멈추지 않도록 모든 단계에 근거 있는 추천 선택지를 표시합니다.
5. **이면사고(Behind-the-Scenes) & 입체적 자기이해 분포**:
   - 사용자가 `'🔄 다른 각도로 찔러줘(Flip)'`를 누르거나 추천을 거부할 때 이를 오류가 아닌 **'오늘 발견한 나의 다른 면(Facet Shift)'**으로 포착하고 연속 확률 분포로 기록합니다.
6. **If-Then 실행 의도 & 명예의 전당 & 100% 로컬 데이터 주권**:
   - 피터 골위처(Gollwitzer)의 실행 의도(`"만약 [상황/단서]가 오면 → [10분 행동]을 한다"`)와 스스로 깨달은 문장을 **명예의 전당(Hall of Insights)**에 기록하며, 계정 없이 **JSON 백업/복원 및 Markdown 내보내기**를 지원합니다.

---

## 30초 빠른 시작 (Quick Start — `npm install` 조차 필요 없습니다!)

풀림은 외부 런타임 패키지 의존성이 **0개(Zero-Dependency)**인 순수 Node.js 22+ 네이티브 TypeScript로 구현되어, 클론 직후 즉시 실행됩니다.

```sh
git clone https://github.com/lee3Q/pullim.git
cd pullim

# 1. 웹 워크벤치 실행 (http://127.0.0.1:3147)
npm start

# 2. 터미널 CLI 데모 즉시 실행
npm run cli -- demo

# 3. 전체 테스트 스위트 실행 (54개 단위·통합·HTTP·CLI 테스트)
npm test
```

브라우저에서 **http://127.0.0.1:3147** 을 열면 유료 API 키나 클라우드 설정 없이 모든 기능을 즉시 사용할 수 있습니다. (원할 경우 UI 우측 상단 `⚙ AI 엔진`에서 로컬 **Ollama** 또는 **OpenAI / Anthropic Claude / Gemini API Key**를 연결할 수 있습니다.)

---

## 터미널 CLI 사용법 (CLI Usage)

개발자나 터미널 사용자는 웹 브라우저 없이도 CLI로 고민을 분해하고 Markdown/JSON으로 내보낼 수 있습니다.

```sh
# 1. 고민 문장 구조화 분해 (터미널 출력)
node bin/pullim.mjs unravel "이직 제안을 받았는데 조건은 좋지만 새 환경이 불안해서 결정을 못 내리고 있어요."

# 2. Obsidian / Notion 기록용 Markdown 리포트 출력
node bin/pullim.mjs unravel "사이드 프로젝트를 전면 개편할지 고민입니다." --markdown > decision.md

# 3. 양방향 5단계 인지 사다리 (과잉분석 시 내려가기: --direction down)
node bin/pullim.mjs ladder "머리로는 장단점 분석이 끝났는데 마음이 안 움직여요." --direction down

# 4. 명예의 전당(핵심 통찰) 문장 판별
node bin/pullim.mjs insight "결국 내가 두려웠던 건 실패 자체가 아니라 완벽해야 한다는 내 기준의 강박이었다."

# 5. 위기 안전 가드(Tier A/B) 테스트
node bin/pullim.mjs crisis-check "오늘 너무 지치고 힘들다" --json
```

---

## TypeScript 라이브러리로 사용하기 (Core SDK)

```ts
import {
  unravelConcern,
  createLadderSession,
  advanceLadderSession,
  exportUnravelToMarkdown,
} from "./src/index.ts";

// 1. 소크라테스 사고 분해
const result = unravelConcern(
  "내 레포를 사람들이 쓸만한 오픈소스로 변화시키고 싶은데 기존 코드가 아까워서 망설여져.",
  { preferredLens: "structural" },
);

console.log(result.reframedQuestion);
console.log(exportUnravelToMarkdown(result));

// 2. 양방향 5단계 사다리 세션
let session = createLadderSession(result.rawConcern);
session = advanceLadderSession(session, { type: "flip_angle" });
```

---

## 프로젝트 구조 (Architecture)

```text
pullim/
├── bin/
│   └── pullim.mjs                     # 터미널용 CLI (unravel, ladder, insight, crisis-check, demo)
├── src/
│   ├── index.ts                       # 오픈소스 라이브러리 엔트리포인트
│   ├── lib/
│   │   ├── core/
│   │   │   ├── unravel-engine.ts      # 사실/가정 분리, 인지 함정 6종, 3가지 시선, 가역적 실험, If-Then 빌더
│   │   │   ├── ladder-engine.ts       # 양방향 5단계 인지 사다리 (올라가기 L1→L5 / 내려가기 L5→L1)
│   │   │   ├── journal-portability.ts # 로컬 저널, 명예의 전당, JSON 백업/복원, Markdown 내보내기
│   │   │   └── llm-gateway.ts         # 오프라인 내장 엔진 + 로컬 Ollama + BYOK (OpenAI/Claude/Gemini)
│   │   ├── safety/
│   │   │   ├── crisis-detector.ts     # 결정론적 위기 감지 (Tier A 즉시 중단 / Tier B 안전 가드)
│   │   │   ├── risk-gate.ts           # 위기 상태 머신 및 긴급 보호 경로 (109, 1577-0199, 119)
│   │   │   ├── proposal-policy.ts     # 모델 제안 스키마 및 단계 전이 검증
│   │   │   └── policy-state-store.ts  # 세션 정책 상태 및 낙관적 동시성 제어
│   │   ├── session/
│   │   │   ├── action-history.ts      # 로컬 확정 행동 저장소
│   │   │   ├── promise-store.ts       # 로컬 If-Then 약속 저장소
│   │   │   └── behind-the-scenes.ts   # 이면사고(메타인지) 신호 추론 엔진
│   │   └── personalization/
│   │       └── probability-profile.ts # 4차원 연속 확률 분포 프로필
│   └── server/
│       ├── main.ts                    # 로컬 웹 워크벤치 실행 엔트리 (기본 포트 3147)
│       ├── workbench-server.ts        # Zero-Dependency Node HTTP 서버 & REST API
│       └── workbench-ui.ts            # 광고·블로트 없는 미니멀 웹 워크벤치 UI
├── tests/                             # 54개 단위·통합·포트폴리오·HTTP·CLI 테스트 (node:test)
├── docs/
│   ├── OPEN_SOURCE_AUDIT_AND_REDESIGN.md # 기존 레포 전체 검수 및 개편 보고서
│   └── USER_JOBS_AND_EVIDENCE.md      # 학술 근거 및 안전 경계 문서
└── LICENSE                            # MIT License
```

---

## 안전 및 윤리적 경계 (Safety & Non-Clinical Boundary)

- 풀림(Pullim)은 일상적인 고민 정리와 의사결정 보조를 위한 오픈소스 도구이며, **의료기기·심리치료·진단 도구·응급 서비스가 아닙니다.**
- 모든 입력은 외부 모델 호출 전 결정론적 위기 안전 가드(`src/lib/safety/crisis-detector.ts`)를 통과합니다. 자살·자해 등 즉각적 위기 신호(`Tier A`)가 감지되면 즉시 분석을 멈추고 **자살예방상담전화(109)**, **정신건강위기상담전화(1577-0199)**, **생명의전화(1588-9191)**, **119**를 안내합니다.

---

## 라이선스 (License)

이 프로젝트는 **MIT License** 하에 배포됩니다. 누구나 자유롭게 사용, 수정, 셀프호스팅 및 기여할 수 있습니다. 자세한 내용은 [LICENSE](LICENSE)를 참고하세요.
