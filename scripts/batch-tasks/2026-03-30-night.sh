#!/bin/bash
# 밤배치 태스크 — 2026-03-30 (UI 수정 + 배포 정상화)
# CC 반영: 5Task→4Task 압축, 타임아웃 45분

HARNESS_FILE="$PROJECT_ROOT/scripts/batch-harness-2026-03-30-night.md"
TASK_TIMEOUT=2700  # 45분

tasks() {
  run_task 1 "스트리밍태그필터" "$COMMON 하네스의 Task 1만 실행하라. LadderSession.tsx의 스트리밍 태그 필터를 강화하라. stripStreamTags 헬퍼 함수를 만들어 [OPTIONS], [COMPARISON], [ANALYSIS], [SENSORY], HTML태그, A_emoji/B_emoji 키-값 등 모든 구조화 태그를 실시간으로 제거하라. 불완전한 태그(아직 닫히지 않은)도 처리하라."
  run_task 2 "UX플로우통합검증" "$COMMON 하네스의 Task 2만 실행하라. 5테마(adventure/garden/strategy/stargazer/apocalypse) × 5진입경로 전체를 코드 레벨로 추적하라. 끊어진 경로 수정. 데모 모드 5테마 응답 검증. 내면사고(behind-the-scenes) 동작 경로 확인 — inferState→behind-thought API→폴백 전체. showBehindThoughts 토글 UI 노출 확인."
  run_task 3 "API에러핸들링" "$COMMON 하네스의 Task 3만 실행하라. API 키 미설정 시 데모 모드 자동 전환 확인. 에러 시 SSE로 명확한 메시지 전달. .env.local.example 갱신. DEPLOY.md 환경변수 가이드 작성(5줄)."
  run_task 4 "빌드배포" "$COMMON 하네스의 Task 4만 실행하라. 빌드 확인 후 git commit + push. 커밋 메시지: fix: 스트리밍 태그 필터 강화 + UX 플로우 검증 수정 + API 에러 핸들링"
}
