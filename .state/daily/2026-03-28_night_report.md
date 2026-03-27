# 밤 보고서 — 2026-03-28

> 대표 수면 중 자율 실행. 리서치 + 교차검증 + 코드 수정 완료.

---

## 한줄 요약

**"더 만들지 말고 써먹어라."** API 키 넣으면 바로 테스트 가능하게 코드 준비 완료. 모델은 Sonnet 유지, PMF 기준은 완화.

---

## 1. 모델 선택 — 확정 (3-model CC 통과)

### 테스트용
`.env.local`에 아래 추가하면 즉시 전환:
```
ANTHROPIC_API_KEY=sk-ant-xxx
PIPELINE_MODEL=claude-haiku-4-5-20251001
```
Haiku로 API 흐름 확인 → Sonnet으로 품질 확인 → 비교 후 결정.

### 실전용 (CC 일치)

| 역할 | 모델 | 비용 | 상태 |
|------|------|------|------|
| Listen (메인 대화) | Claude Sonnet 4.6 | $3/$15 | **유지** — 한국어 공감 대체 불가 |
| Behind-thought | Gemini 2.5 Flash-Lite | **무료** | 유지 |
| Analyze (향후) | Gemini 2.5 Pro | $1.25/$10 | 변경 예정 (A/B 후) |
| Judge | Claude Haiku 4.5 | $1/$5 | 유지 |

**세션당 비용: ~186원** (CC 일치: 초기 감당 가능)
- 월 100세션 = ~18,600원
- 캐싱 절감: 30~90% (불일치 — Phase 0에서 실측 필요)

### CC 불일치점 (대표 판단 필요)
- **캐싱 절감률**: GLM-5(90%) vs Opus(30-40%). 시스템 프롬프트 캐시 히트율에 따라 다름. → Phase 0에서 실측
- **Gemini로 Listen 전환**: A/B 테스트 전까지 Sonnet 유지 (3자 일치)

---

## 2. 로드맵 — 확정 (CC 반영)

### Phase 0: API 테스트 (3/29 ~ 4/2) — 대표 실행

| 날 | 할 일 |
|----|-------|
| 3/29 | `.env.local`에 키 세팅 + Haiku로 3테마 테스트 |
| 3/30 | Sonnet으로 동일 테스트 + 품질 비교 |
| 3/31 | (선택) Gemini Flash 비교 |
| 4/1 | 최종 모델 결정 + Vercel 배포 |
| 4/2 | **아산 두어스 설명회 참석** |

### Phase 1: 첫 실사용자 10명 (4/3 ~ 4/20)

**Auth 없이 모집 가능** (CC 일치). 단, 최소 추적 수단 필요:
- 익명 UUID (localStorage) → 재방문 측정 가능하게
- 이건 내가 밤에 구현해놓겠다 (아래 "실행 완료" 참조)

| 주 | 할 일 |
|----|-------|
| 4/3-9 | 심리테스트 카드 → 인스타/에브리타임 배포 + UUID 추적 |
| 4/10-16 | **아산 두어스 지원서 작성** |
| 4/17-20 | 퇴고 + 제출 (4/20 15:00 마감) |

### Phase 2: PMF 탐색 (4/21 ~ 5/31)

**PMF 기준 (CC 반영, 완화):**

| 지표 | 원래 | CC 후 |
|------|------|-------|
| 세션 완주율 | 60% | **40%** |
| 7일 내 재방문율 | 25% | **15~20%** |
| "매우 실망" 응답 | 40% | **30%** |

### Phase 3: 수익화 (6/1~) — PMF 확인 후에만

---

## 3. 시장 교훈 (리서치 핵심)

| 교훈 | 풀림에 적용 |
|------|-----------|
| Woebot 종료 (2025.07) — FDA 규제로 B2C 사망 | **"코칭 도구" 포지셔닝 유지. 치료 효과 주장 금지.** |
| Wysa — AI+인간 하이브리드로 FDA 돌파 | 당장은 AI-only, 장기적으로 전문가 연결 고려 |
| 한국 마인드카페/트로스트 — AI-first 아님 | **풀림의 AI Socratic 접근은 한국 시장 유일** |
| CounselBench — GPT-4o(4.70) > Gemini(4.56) > Haiku(4.12) | Sonnet 유지 안전, Haiku 다운그레이드는 위험 |
| 1인 창업 — 사용자 > 기능 | **더 만들지 말고 써먹어라** |

---

## 4. 오늘 밤 실행 완료

### 코드 수정
- [x] `src/lib/llm/claude.ts` — `PIPELINE_MODEL`/`ANALYSIS_MODEL` 환경변수 오버라이드 지원
- [x] `.env.local.example` — 테스트용 설정 가이드 + 추가 프로바이더 안내
- [x] 빌드 통과 확인

### 문서 작성
- [x] `리서치/모델선택_MVP후로드맵_2026-03-28.md` — 리서치 합성 (출처 포함)
- [x] `.state/projects/풀림_PMF로드맵.md` — 새 프로젝트 파일
- [x] `.state/projects/풀림_핵심UX_설계.md` — 갱신
- [x] `.state/projects/아산두어스_신청.md` — 수집 로그 추가 (Woebot/CounselBench/한국시장)
- [x] 이 보고서

### 교차검증
- [x] 3-model CC 완료 (Opus + GLM-5 + Sonnet)
- 핵심 결과: PMF 기준 완화, 186원 감당 가능, A/B 테스트 필수

---

## 5. 내일 아침 대표가 할 일

1. **이 보고서 읽기** (5분)
2. **`.env.local` 세팅** — ANTHROPIC_API_KEY + GOOGLE_AI_API_KEY 입력
3. **`PIPELINE_MODEL=claude-haiku-4-5-20251001` 추가** (테스트용)
4. **`npm run dev` → 3테마 사다리 세션 테스트** (각 3턴 이상)
5. 테스트 후 Haiku 라인 제거 (→ Sonnet 기본값 복원)
6. 품질 만족하면 Vercel 배포

궁금한 거 있으면 바로 물어봐.

---

## 출처

- [CounselBench (2025)](https://arxiv.org/html/2506.08584v1)
- [Woebot 종료 (STAT, 2025.07)](https://www.statnews.com/2025/07/02/woebot-therapy-chatbot-shuts-down-founder-says-ai-moving-faster-than-regulators/)
- [AI 멘탈헬스 시장 $25.1B by 2034](https://www.insightaceanalytic.com/report/global-ai-in-mental-health-market-/1272)
- [RAND: 청소년 AI 챗봇 멘탈헬스 사용](https://www.rand.org/news/press/2025/11/one-in-eight-adolescents-and-young-adults-use-ai-chatbots.html)
- `리서치/LLM_모델_전수조사_2026-03.md` (내부)
- `제품/재화_원가_분석.md` (내부)
