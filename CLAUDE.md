# 풀림 (Pullim)

AI 의사결정/멘탈케어 SaaS. 1인 창업 (대표: 이상규).

## 세션 시작

1. `.state/project-config.md` 읽기 (불변 설정)
2. `.state/current-phase.md` 읽기 (현재 상태)
3. 필요 시 `.state/decisions/` 최근 결정 확인

## 세션 종료

1. `.state/current-phase.md` 갱신
2. 주요 결정이 있었으면 `.state/decisions/YYYY-MM-DD_제목.md` 추가 (덮어쓰기 금지)
3. 세션 로그: `.state/sessions/YYYY-MM-DD_session.md` 추가 (덮어쓰기 금지)

## 핵심 자료

| 키워드 | 경로 |
|--------|------|
| 웹앱 소스 | ./pullim/ |
| PRD, 제품 스펙 | ./제품/ |
| 리서치 | ./리서치/ |
| 사전 (풀림 용어) | ./사전/INDEX.md |
| 신청서, PPT | ./신청서/ |
| 테스트 세션 기록 | ./테스트/ |
| 아카이브 (이전 팀 자료) | ./archive/ |

## 원칙

- AI 팀 시뮬레이션 금지 (구조적으로 실패 — 리서치 검증 완료)
- 의사결정 시 교차 모델 검증 (최소 2개 이종 모델)
- 덮어쓰기 금지: decisions/, sessions/ 는 추가만
- 위기 안전: RED → LLM 즉시 중단 → 전문기관 안내
