#!/bin/bash
# 밤배치 태스크 — 2026-04-01 (통합: 자동매칭 + 광고 + 사다리-도구)
# 순차 실행, 태스크별 독립 세션 (의존성 없음)
# 모델: Sonnet (claude -p 기본)

TASK_TIMEOUT=2400  # 40분
MAX_RATE_LIMIT_RETRIES=3

HARNESS_AM="$PROJECT_ROOT/scripts/harness-auto-matching.md"
HARNESS_AD="$PROJECT_ROOT/scripts/harness-ad-system.md"
HARNESS_LT="$PROJECT_ROOT/scripts/harness-ladder-tools.md"

tasks() {
  # ═══ 1. 자동매칭 (3 Task) ═══

  run_task 1 "자동매칭-추천로직" "$COMMON 먼저 $HARNESS_AM 을 읽어라. Task 1만 실행하라. getRecommendedIndex()를 프로필 axis 기반 키워드 매칭으로 구현하라. 반드시 빌드 확인(cd ~/study/main/pullim/pullim && npx next build). 빌드 통과하면 git add -A && git commit -m 'feat: 자동매칭 추천 로직 구현'."

  run_task 2 "자동매칭-테마추천" "$COMMON 먼저 $HARNESS_AM 을 읽어라. Task 2만 실행하라. getRecommendedTheme() 함수를 추가하라. 테마-프로필 매핑 점수 계산. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 테마 자동 추천 함수 추가'."

  run_task 3 "자동매칭-홈UI" "$COMMON 먼저 $HARNESS_AM 을 읽어라. Task 3만 실행하라. 홈(page.tsx)에서 프로필 기반 추천 테마에 배지 표시. showRecommendations 설정 연동. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 홈 화면 테마 자동 추천 배지'."

  # ═══ 2. 광고 시스템 (2 Task) ═══

  run_task 4 "광고-컴포넌트생성" "$COMMON 먼저 $HARNESS_AD 을 읽어라. Task 1만 실행하라. AdInterstitial.tsx 컴포넌트와 useAdGate.ts 훅을 생성하라. 판타지 다크 스타일 유지. 3초 카운트다운. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 광고 인터스티셜 컴포넌트 + 게이트 훅'."

  run_task 5 "광고-세션연결" "$COMMON 먼저 $HARNESS_AD 을 읽어라. Task 2만 실행하라. LadderSession.tsx에 광고 게이트 연결. 세션 진입/종료 시 AdInterstitial 표시. Phase 타입에 ad-start/ad-end 추가. 기존 흐름 깨지 않게 주의. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 세션 진입/종료 광고 게이트 연결'."

  # ═══ 3. 사다리-도구 연결 (4 Task) ═══

  run_task 6 "도구트리거로직" "$COMMON 먼저 $HARNESS_LT 을 읽어라. Task 1만 실행하라. pullim/src/lib/session/tool-trigger.ts 를 생성하라. checkToolTrigger() + extractTopicSummary() 구현. 먼저 behind-the-scenes.ts와 ladder-types.ts를 읽고 타입을 맞춰라. 반드시 빌드 확인(cd ~/study/main/pullim/pullim && npx next build). 빌드 통과하면 git add -A && git commit -m 'feat: 사다리 도구 트리거 감지 로직'."

  run_task 7 "리서치분석API" "$COMMON 먼저 $HARNESS_LT 을 읽어라. Task 2만 실행하라. pullim/src/app/api/ladder/research/route.ts 와 pullim/src/app/api/ladder/analyze/route.ts 를 생성하라. 기존 ultimate/research와 ultimate/analyze를 먼저 읽고 패턴을 따라라. isDemoMode일 때 데모 데이터 반환 필수. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 사다리용 리서치/분석 API 래퍼'."

  run_task 8 "도구결과UI" "$COMMON 먼저 $HARNESS_LT 을 읽어라. Task 3만 실행하라. pullim/src/components/session/ToolCards.tsx 를 생성하라. ResearchCards + AnalysisView 컴포넌트. 기존 LadderSession.tsx를 먼저 읽고 판타지 다크 스타일을 따라라. DataCard 타입은 types-ultimate.ts에서 import. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 리서치/분석 결과 표시 UI 컴포넌트'."

  run_task 9 "세션통합연결" "$COMMON 먼저 $HARNESS_LT 을 읽어라. Task 4만 실행하라. pullim/src/components/session/LadderSession.tsx 를 수정하라. 반드시 먼저 파일 전체를 읽어라. tool-trigger, ToolCards를 import하고 state 추가. AI 응답 완료 후 checkToolTrigger 호출. triggerTool 함수로 API 호출. UI는 메시지 아래/입력 위에 배치. 기존 phase 전환 로직 절대 건드리지 마라. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 사다리 세션에 리서치/분석 도구 통합'."

  # ═══ 최종: 통합 빌드 + 푸시 ═══
  run_task 10 "통합빌드푸시" "$COMMON cd ~/study/main/pullim/pullim && npx next build 실행. 빌드 실패 시 에러 수정하고 재빌드. 빌드 통과하면 cd ~/study/main/pullim && git push origin main."
}
