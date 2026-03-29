#!/bin/bash
# 밤배치 — 2026-03-29 전면 점검 수정
# 5개 하네스 순차 실행 (H4→H1→H5→H2→H3 순서: 빌드→긴급→기능→UX→신규)
#
# 사용:
#   caffeinate -s bash ~/study/main/pullim/scripts/night-batch.sh ~/study/main/pullim/scripts/batch-tasks/2026-03-29-night.sh

PROJECT_ROOT="$HOME/study/main/pullim"
HARNESS_DIR="$PROJECT_ROOT/.state/harnesses"
TASK_TIMEOUT=2400  # 40분 (각 태스크)

tasks() {
  # Task 1: 이미지 매핑 + 아포칼립스 배포 (가장 단순, 빌드 확인 포함)
  run_task 1 "이미지+배포" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H4_이미지배포정리.md — 모든 작업 항목을 AC에 맞춰 실행하라. 빌드 통과 후 git commit + push까지."

  # Task 2: 데모 세션 긴급 수정 (CRITICAL — 사용자 체감 최우선)
  run_task 2 "데모긴급수정" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H1_데모세션긴급수정.md — P1은 이미 수정됨(스트리밍 태그). P2(응답 확충)와 P3(데모 완주)만 실행하라. AC에 맞춰 실행하고 빌드 통과 확인."

  # Task 3: 내면사고 개선
  run_task 3 "내면사고" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H5_내면사고개선.md — 모든 작업 항목을 AC에 맞춰 실행하라. 빌드 통과 확인."

  # Task 4: 텍스트 게임 UX (가장 큰 작업)
  run_task 4 "텍스트게임UX" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H2_텍스트게임UX.md — 모든 작업 항목을 AC에 맞춰 실행하라. 철학 참조: ~/study/main/pullim/제품/풀림_미션과_진짜UX_2026-03-25.md 와 ~/study/main/pullim/제품/풀림_진짜시작_2026-03-24.md 를 반드시 읽고 반영하라. 빌드 통과 확인."

  # Task 5: 약속 기능 기반 (신규 기능)
  run_task 5 "약속기능" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H3_약속기능기반.md — 모든 작업 항목을 AC에 맞춰 실행하라. 철학 참조: ~/study/main/pullim/.state/projects/풀림_철학개선.md 의 '약속' 섹션을 반드시 읽고 반영하라. 빌드 통과 확인."
}
