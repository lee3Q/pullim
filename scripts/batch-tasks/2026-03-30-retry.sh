#!/bin/bash
# 밤배치 재실행 — 2026-03-30 (rate limit 실패분만)
# Task 1(H4)은 이미 성공했으므로 제외. Task 2~5만 실행.
#
# 사용:
#   caffeinate -s bash ~/study/main/pullim/scripts/night-batch.sh ~/study/main/pullim/scripts/batch-tasks/2026-03-30-retry.sh

PROJECT_ROOT="$HOME/study/main/pullim"
HARNESS_DIR="$PROJECT_ROOT/.state/harnesses"
WEBAPP_ROOT="$PROJECT_ROOT/pullim"

tasks() {
  # Task 1: 데모 세션 긴급 수정 (60분)
  TASK_TIMEOUT=3600
  run_task 1 "데모긴급수정" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H1_데모세션긴급수정.md — P1은 이미 수정됨(스트리밍 태그, LadderSession.tsx:610). 중복 작업하지 마라. P2(응답 확충)와 P3(데모 완주)만 실행하라. 반드시 demo-ladder.ts를 먼저 읽고 기존 구조 위에 확장하라. AC에 맞춰 실행하고 빌드 통과 확인."

  # Task 2: 내면사고 개선 (30분)
  TASK_TIMEOUT=1800
  run_task 2 "내면사고" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H5_내면사고개선.md — 모든 작업 항목을 AC에 맞춰 실행하라. demo-ladder.ts는 이전 태스크가 수정했으므로 반드시 먼저 읽고 최신 코드 위에 작업하라. 빌드 통과 확인."

  # === 빌드 게이트 ===
  TASK_TIMEOUT=300
  run_task 2.5 "빌드게이트" "cd $WEBAPP_ROOT && npx next build 2>&1 | tail -5. 빌드 실패하면 에러를 수정하라."

  # Task 3: 텍스트 게임 UX (60분)
  TASK_TIMEOUT=3600
  run_task 3 "텍스트게임UX" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H2_텍스트게임UX.md — 우선순위: Task 1(진입화면 분리)과 Task 2(배경이미지)가 필수. Task 3(내러티브)과 Task 4(선택지 게임화)는 시간이 남으면 실행. 중요: 배경이미지와 내러티브 래핑은 LadderSession.tsx에서 처리하라. 각 레벨 컴포넌트(SensoryLevel/ComparisonLevel/AnalysisLevel/ChoiceLevel)는 수정하지 마라(Sonnet CC 권장). 반드시 기존 LadderSession.tsx를 먼저 읽고 최신 코드 위에 수정하라(이전 태스크가 수정했을 수 있음). 철학 참조: $PROJECT_ROOT/제품/풀림_미션과_진짜UX_2026-03-25.md 와 $PROJECT_ROOT/제품/풀림_진짜시작_2026-03-24.md 를 반드시 읽고 반영하라. 빌드 통과 확인."

  # Task 4: 약속 기능 기반 (30분)
  TASK_TIMEOUT=1800
  run_task 4 "약속기능" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H3_약속기능기반.md — 반드시 LadderSession.tsx와 SessionSummary.tsx를 먼저 읽고 최신 코드 위에 수정하라(이전 태스크가 수정했을 수 있음). 철학 참조: $PROJECT_ROOT/.state/projects/풀림_철학개선.md 의 '약속' 섹션을 반드시 읽고 반영하라. 빌드 통과 확인."
}
