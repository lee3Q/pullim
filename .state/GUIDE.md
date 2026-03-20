# 풀림 사용 가이드

## 터미널 커맨드

| 커맨드 | 기능 |
|--------|------|
| `pp` | 풀림 세션 시작 (cd + claude) |
| `ppl` | .state/ 변경분 git 자동 커밋 |
| `gg` | GLM-5 세션 (교차검증용, 별도 터미널) |

## 세션 안 커맨드

| 커맨드 | 기능 |
|--------|------|
| `/pullim` | 상태 브리핑 (현재 단계 + 마지막 결정 + handoff + 다음 할 일) |
| `/cross-check` | GLM-5 교차 모델 검증 (같은 세션에서 실행) |
| `/handoff` | 세션 맥락 저장 (compact 전 or 종료 전) |
| `/풀림-테스트` | 풀림 AI 체험 (v1) |
| `/풀림-v2-테스트` | 멀티 에이전트 체험 (v2) |
| `/풀림-강력처방` | 빠른 처방 |

## 일반 플로우

```
pp                          # 세션 시작
/pullim                     # 브리핑
(작업)                       # 코딩/리서치/의사결정
/cross-check                # 중요 결정 시 교차검증
/handoff                    # 종료 전 맥락 저장
ppl                         # 터미널에서 git 커밋
```

## 컨텍스트 관리 (3겹 안전망)

```
Layer 1: .state/            ← 항상 존재 (결론 + 상태)
Layer 2: /handoff           ← compact/종료 전 생성 (맥락 + 과정)
Layer 3: /resume-session    ← 전체 대화 복원 (풀 transcript)
```

| 상황 | 사용법 |
|------|--------|
| 일반 이어하기 | `pp` → `/pullim` |
| 맥락 중요한 이어하기 | `pp` → `/pullim` → handoff 자동 읽힘 |
| 디테일 전부 필요 | `pp` → `/resume-session` |
| compact 직전 | `/handoff` → compact 허용 |
| Sonnet 전환 시 | `/pullim`만으로 충분 (state 파일 작음) |

## 워크플로우 패턴

### 패턴 A: 문서 작성 (사업계획서, PPT, 신청서)
```
pp → /pullim → 기존 자료 읽기 → 초안 생성
→ /cross-check (핵심 수치/주장) → 수정 → 완성
→ /handoff → ppl
```

### 패턴 B: 개발 작업 (코드 구현)
```
pp → /pullim → 스펙 작성 (1페이지)
→ 구현 (Opus) → 간단한 수정 (/model sonnet)
→ /handoff → ppl → git push
```

### 패턴 C: 의사결정 (방향 전환, 기능 우선순위)
```
pp → /pullim → 안건 정리
→ Pre-mortem: "이 결정이 실패했다면 왜?"
→ /cross-check (최소 1회)
→ Perplexity 리서치 (필요시)
→ 결정 기록 (.state/decisions/)
→ /handoff → ppl
```

### 패턴 D: 리서치 (시장 조사, 경쟁 분석)
```
3개 병렬:
  1. Claude (pp 세션): 즉시 합성
  2. Perplexity: 사례 + 수치 (GPT 5.4 or Kimi)
  3. Gemini Deep Research: 심층 분석

→ pp 세션에서 3개 합성 → /cross-check → /handoff → ppl
```

### 패턴 E: 풀림 제품 테스트
```
pp → /풀림-테스트 (or /풀림-v2-테스트)
→ 체험 세션 진행 → 자동 리포트 생성
→ /handoff → ppl
```

## 사용 예시: 사업계획서 작성

```
$ pp
> /pullim
  현재 단계: 구조 개편 완료
  다음 할 일: 실제 풀림 작업 적용
  뭐부터 할까?

> 창업공간 대여 신청 사업계획서 작성. ./신청서/ 에 기존 자료 있어.
  (AI가 기존 자료 읽고 초안 작성)

> /cross-check TAM 234-468억 추정이 현실적인가?
  (GLM-5 교차검증 → 불일치 발견 → 보수/기본/낙관 시나리오 제안)

> Perplexity에서 조사한 결과: (붙여넣기)
  (3개 소스 합성 → 최종 수치 확정)

> /handoff
  (맥락 저장)

$ ppl
  (git 커밋)
```

## 모델 맵

```
[Tier 1 — 메인]
  Claude Opus 4.6    복잡한 분석, 아키텍처, 핵심 코딩
  Claude Sonnet 4.6  일상 작업, 드래프트
  Claude Haiku 4.5   경량 작업, 분류, 라우팅

[Tier 2 — 교차검증 + 리서치]
  GLM-5              같은 환경 Judge Agent (/cross-check)
  GPT 5.1            범용 교차검증
  Perplexity         리서치 + 생성 (GPT 5.4 / Kimi K2.5 / Sonnet 선택)
  Gemini             Deep Research (심층 리서치)

[Tier 3 — 예비]
  dolphin-llama3     검열 없는 피드백, 오프라인 (alias: y)
  qwen2.5-coder      빠른 코드 체크, 오프라인 (alias: qq)
```

## 핵심 규칙

| 규칙 | 이유 |
|------|------|
| 중요 결정 → `/cross-check` 1회 이상 | 단일 모델 sycophancy 58% |
| 수치/주장 → 외부 검증 (Perplexity) | AI가 수치를 지어냄 |
| compact 전 → `/handoff` | 맥락 소실 방지 |
| 세션 끝 → `/handoff` + `ppl` | 컨텍스트 + git 보존 |
| 덮어쓰기 금지 | decisions/, sessions/, handoffs/ 는 추가만 |
| 3인칭 프레이밍 | "내가 X" → "한 창업자가 X를 고려 중" |
| AI 팀 시뮬레이션 금지 | 구조적 실패 (ICLR 2025 검증) |

## 파일 구조

```
~/study/main/pullim/           ← pp로 여기서 시작
├── CLAUDE.md                  ← 자동 로드
├── .state/
│   ├── GUIDE.md               ← 이 파일
│   ├── project-config.md      ← 불변 (아키텍처/원칙)
│   ├── projects/              ← 프로젝트별 상태 파일
│   ├── decisions/             ← 추가만 (덮어쓰기 X)
│   ├── sessions/              ← 추가만 (덮어쓰기 X)
│   └── handoffs/              ← 추가만 (덮어쓰기 X)
├── pullim/                    ← Next.js 웹앱
├── 제품/                       ← PRD, seed
├── 리서치/                     ← 시장 리서치
├── 사전/                       ← 풀림 용어
├── 신청서/                     ← PPT, 신청서
├── 테스트/                     ← 테스트 세션 기록
└── archive/                   ← 이전 팀 자료

GitHub: https://github.com/lee3Q/pullim (private)
```
