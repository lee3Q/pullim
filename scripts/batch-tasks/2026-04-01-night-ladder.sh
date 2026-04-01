#!/bin/bash
# 밤배치 태스크 — 2026-04-01 (사다리-도구 연결)
# 하네스: scripts/harness-ladder-tools.md
# 기존 2026-04-01-night.sh (자동매칭+광고) 와 별도 실행

TASK_TIMEOUT=2400  # 40분 (Task 4가 가장 큼)
MAX_RATE_LIMIT_RETRIES=3

HARNESS_LT="$PROJECT_ROOT/scripts/harness-ladder-tools.md"

tasks() {
  # ── 하네스: 사다리-도구 연결 (5 Task) ──

  run_task 1 "도구트리거로직" "$COMMON 먼저 $HARNESS_LT 을 읽어라. Task 1만 실행하라. pullim/src/lib/session/tool-trigger.ts 를 생성하라. checkToolTrigger() + extractTopicSummary() 구현. 먼저 behind-the-scenes.ts와 ladder-types.ts를 읽고 타입을 맞춰라. 반드시 빌드 확인(cd ~/study/main/pullim/pullim && npx next build). 빌드 통과하면 git add -A && git commit -m 'feat: 사다리 도구 트리거 감지 로직'."

  run_task 2 "리서치분석API" "$COMMON 먼저 $HARNESS_LT 을 읽어라. Task 2만 실행하라. pullim/src/app/api/ladder/research/route.ts 와 pullim/src/app/api/ladder/analyze/route.ts 를 생성하라. 기존 ultimate/research와 ultimate/analyze를 먼저 읽고 패턴을 따라라. isDemoMode일 때 데모 데이터 반환 필수. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 사다리용 리서치/분석 API 래퍼'."

  run_task 3 "도구결과UI" "$COMMON 먼저 $HARNESS_LT 을 읽어라. Task 3만 실행하라. pullim/src/components/session/ToolCards.tsx 를 생성하라. ResearchCards + AnalysisView 컴포넌트. 기존 LadderSession.tsx를 먼저 읽고 판타지 다크 스타일을 따라라. DataCard 타입은 types-ultimate.ts에서 import. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 리서치/분석 결과 표시 UI 컴포넌트'."

  run_task 4 "세션통합연결" "$COMMON 먼저 $HARNESS_LT 을 읽어라. Task 4만 실행하라. pullim/src/components/session/LadderSession.tsx 를 수정하라. 반드시 먼저 파일 전체를 읽어라. tool-trigger, ToolCards를 import하고 state 추가. AI 응답 완료 후 checkToolTrigger 호출. triggerTool 함수로 API 호출. UI는 메시지 아래/입력 위에 배치. 기존 phase 전환 로직 절대 건드리지 마라. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 사다리 세션에 리서치/분석 도구 통합'."

  # ── 최종: 통합 빌드 + 푸시 ──
  run_task 5 "통합빌드푸시" "$COMMON cd ~/study/main/pullim/pullim && npx next build 실행. 빌드 실패 시 에러 수정하고 재빌드. 빌드 통과하면 cd ~/study/main/pullim && git push origin main."
}
