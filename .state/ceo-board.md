# 대표 보드

> Claude가 매 세션 종료 시 갱신한다. 대표는 이것만 보면 된다.

## 현재 상태 (04-05)

- 폴더 구조 개편 완료 (세계관/작업실/학습/아카이브)
- 시스템 정비 즉시 5건 완료 (MEMORY.md, hook, ouroboros, 상태파일, Telegram MCP)
- 워크플로우 재정착 진행 중 — 세션 컨텍스트 소실 문제 해결

## 🔴 해야 할 것 (대표만 가능)

1. **ANTHROPIC_API_KEY Vercel 세팅** — 5분. 시스템 구축 달라져서 급하지 않음.
   - `console.anthropic.com` → API Keys → Create Key → 복사
   - `vercel.com` → pullim → Settings → Environment Variables → 붙여넣기 → Save → Redeploy

2. **SQL 마이그레이션 실행** — Supabase 대시보드 > SQL Editor
   - 파일: `pullim/src/lib/supabase/migrations/001_sessions_table.sql`

## 📅 다가오는 일정

| 날짜 | 항목 | 상태 |
|------|------|------|
| 04-08 | ICC 발표 결과 발표 | 대기 |
| 04-10 | 두어스 지원서 작성 착수 (D-10) | 대기 |
| 04-16 14:00 | ICC 오리엔테이션 (상상관 12층) | 합격 시 |
| 04-20 15:00 | 두어스 마감 | 대기 |

## ⏸️ 보류 중

### 제품 — 시스템 재정착 후 재평가
| 항목 | 왜 보류 | 트리거 |
|------|---------|--------|
| 모델 확정 (Haiku vs Sonnet) | 시스템 구축 변경 | 워크플로우 재정착 완료 후 |
| 비용 시뮬레이션 재산정 | 모델 미확정 | 모델 확정 후 |
| Supabase 세션 영속화 | Phase 1 | Auth 구현 시 |
| preview/page.tsx dev gate | 급하지 않음 | 다음 코딩 세션 |

### UX 개선 (후순위)
| 항목 | 트리거 |
|------|--------|
| 매운맛 spicyLabel 교체 | 실사용자 피드백 |
| 나만의 느낌 카드 | Phase 1 |

## ✅ 최근 완료

- 04-05: 폴더 구조 전면 개편 + CLAUDE.md 분리 + 시스템 정비 5건
- 04-04: GLM-5 프로바이더 추가 + UI 몰입형 리뉴얼 + 풀림-icc 스킬
- 04-02: 사다리 세션 버그 3개 수정 + 배포, ICC 발표 완료
- 04-01: 밤배치 10/10 + BGM 교체 + 이미지 매핑 수정

*최종 갱신: 2026-04-05*
*갱신 주체: Claude (워크플로우 재정착 세션)*
