# Project Config (불변)

## 제품
- **이름**: 풀림 (Pullim)
- **한줄**: AI가 답을 주지 않고, Socratic 질문으로 사용자가 스스로 명확화하는 의사결정/멘탈케어 서비스
- **스택**: Next.js 15, React 19, TypeScript, Tailwind CSS 4, Supabase, Claude API (Sonnet), Zustand
- **위치**: ~/study/main/pullim/pullim/ (Next.js 웹앱)

## 안전 규칙 (절대 불변)
- 위기 감지 3단계: GREEN / YELLOW(Tier B) / RED(Tier A)
- RED 시: 즉시 LLM 중단 → 전문기관 안내 (1393, 1577-0199)
- 존재 가치 의심하게 만드는 말 금지 (톤 무관)
- AI는 augment only — 절대 replace human judgment 아님

## AI 활용 구조 (워크플로우 스택)
```
[대표 이상규 = 오케스트레이터]
├── 코딩: Claude Code (Opus=복잡, Sonnet=일상, Haiku=라우팅)
├── 리서치: Gemini Deep Research + Perplexity(GPT 5.4/Kimi/Sonnet) + Claude
├── 의사결정 검증: 교차 모델 (Claude + GLM-5 + GPT 5.1, 최소 2종)
│   ├── 3인칭 프레이밍 필수
│   └── 불일치 지점 = 핵심 의사결정 포인트
├── 콘텐츠/생성: Perplexity+Sonnet / GPT 5.1
└── 품질검증: GLM-5 (Judge Agent) → 불일치 시 3자 판정
```

## 금지 사항
- AI 팀 시뮬레이션 (멀티에이전트 롤플레이) 금지 — 구조적으로 실패함 (ICLR 2025)
- 세션_맥락.md 단일 파일 덮어쓰기 방식 금지
- 글로벌 설정에서 창업 라우팅 금지 (컨텍스트 낭비)

## 상태 관리 원칙
1. 불변(이 파일) vs 가변(projects/) 분리
2. decisions/, sessions/, handoffs/ 는 덮어쓰기 금지, 추가만
3. 프로젝트별 파일 분리 (projects/프로젝트명.md)
4. 완료 프로젝트 → projects/_done/, 아이디어 → projects/_backlog/
5. git으로 버전관리

## 프로젝트 파일 필수 구조
```
# 프로젝트명
**상태**: 진행 중 / 완료 / 대기
**현재 단계**: N. 단계명

## 단계 (순서 강제)
1. **리서치** — 방법: [워크플로우 지정]
2. **논의** — 리서치 합성, 불일치 중심
3. **검증** — /cross-check
4. **실행** — 산출물 제작
5. **최종 검증** — 제출/배포 전 교차검토
```
각 프로젝트 성격에 따라 단계 조정 가능 (대표 승인 필요)
