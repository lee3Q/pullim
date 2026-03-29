#!/bin/bash
# 밤배치 — 2026-03-29 전면 점검 수정
# 5개 하네스 순차 실행 (H4→H1→H5→H2→H3 순서: 빌드→긴급→기능→UX→신규)
# 3-model CC 반영: H1/H2 타임아웃 확장, 빌드 게이트, BGM 누락 대응
#
# 사용:
#   caffeinate -s bash ~/study/main/pullim/scripts/night-batch.sh ~/study/main/pullim/scripts/batch-tasks/2026-03-29-night.sh

PROJECT_ROOT="$HOME/study/main/pullim"
HARNESS_DIR="$PROJECT_ROOT/.state/harnesses"
WEBAPP_ROOT="$PROJECT_ROOT/pullim"

tasks() {
  # Task 1: 이미지 매핑 + BGM 누락 처리 + 아포칼립스 배포 (30분)
  TASK_TIMEOUT=1800
  run_task 1 "이미지+배포" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H4_이미지배포정리.md — 모든 작업 항목을 AC에 맞춰 실행하라. 추가: themes/index.ts에서 참조하는 BGM 파일(stargazer-bgm.mp3, stargazer-bgm-2.mp3, apocalypse-bgm.mp3)이 public/assets/에 없으면 빈 무음 mp3를 생성하거나 기존 테마 BGM을 복사하여 대응하라. 빌드 통과 후 git commit + push까지."

  # Task 2: 데모 세션 긴급 수정 (60분 — CC에서 위험 판정)
  TASK_TIMEOUT=3600
  run_task 2 "데모긴급수정" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H1_데모세션긴급수정.md — P1은 이미 수정됨(스트리밍 태그, LadderSession.tsx:610). 중복 작업하지 마라. P2(응답 확충)와 P3(데모 완주)만 실행하라. 반드시 demo-ladder.ts를 먼저 읽고 기존 구조 위에 확장하라. AC에 맞춰 실행하고 빌드 통과 확인."

  # Task 3: 내면사고 개선 (30분)
  TASK_TIMEOUT=1800
  run_task 3 "내면사고" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H5_내면사고개선.md — 모든 작업 항목을 AC에 맞춰 실행하라. demo-ladder.ts는 이전 태스크가 수정했으므로 반드시 먼저 읽고 최신 코드 위에 작업하라. 빌드 통과 확인."

  # === 빌드 게이트 (H2 전 검증 — Sonnet CC 권장) ===
  TASK_TIMEOUT=300
  run_task 3.5 "빌드게이트" "cd $WEBAPP_ROOT && npx next build 2>&1 | tail -5. 빌드 실패하면 에러를 수정하라."

  # Task 4: 텍스트 게임 UX (60분 — 가장 큰 작업)
  TASK_TIMEOUT=3600
  run_task 4 "텍스트게임UX" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H2_텍스트게임UX.md — 우선순위: Task 1(진입화면 분리)과 Task 2(배경이미지)가 필수. Task 3(내러티브)과 Task 4(선택지 게임화)는 시간이 남으면 실행. 중요: 배경이미지와 내러티브 래핑은 LadderSession.tsx에서 처리하라. 각 레벨 컴포넌트(SensoryLevel/ComparisonLevel/AnalysisLevel/ChoiceLevel)는 수정하지 마라(Sonnet CC 권장). 반드시 기존 LadderSession.tsx를 먼저 읽고 최신 코드 위에 수정하라(이전 태스크가 수정했을 수 있음). 철학 참조: $PROJECT_ROOT/제품/풀림_미션과_진짜UX_2026-03-25.md 와 $PROJECT_ROOT/제품/풀림_진짜시작_2026-03-24.md 를 반드시 읽고 반영하라. 빌드 통과 확인."

  # Task 5: 약속 기능 기반 (30분)
  TASK_TIMEOUT=1800
  run_task 5 "약속기능" "$COMMON 하네스 파일을 읽어라: $HARNESS_DIR/2026-03-29_H3_약속기능기반.md — 반드시 LadderSession.tsx와 SessionSummary.tsx를 먼저 읽고 최신 코드 위에 수정하라(이전 태스크가 수정했을 수 있음). 철학 참조: $PROJECT_ROOT/.state/projects/풀림_철학개선.md 의 '약속' 섹션을 반드시 읽고 반영하라. 빌드 통과 확인."
}
