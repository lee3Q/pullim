#!/bin/bash
# 밤배치 태스크 — 2026-04-01 (자동매칭 + 광고시스템)
# 순차 실행. 세션 리밋(30분) 대응: 태스크별 독립 실행 + 실패 시 재시도.

TASK_TIMEOUT=1800  # 30분 (세션 리밋에 맞춤)
MAX_RATE_LIMIT_RETRIES=3

# 하네스 2개를 태스크별로 분리 실행
HARNESS_AM="$PROJECT_ROOT/scripts/harness-auto-matching.md"
HARNESS_AD="$PROJECT_ROOT/scripts/harness-ad-system.md"

tasks() {
  # ── 하네스 1: 자동 매칭 (3 Task) ──
  run_task 1 "자동매칭-추천로직" "$COMMON 먼저 $HARNESS_AM 을 읽어라. Task 1만 실행하라. getRecommendedIndex()를 프로필 axis 기반 키워드 매칭으로 구현하라. 반드시 빌드 확인(cd ~/study/main/pullim/pullim && npx next build). 빌드 통과하면 git add -A && git commit -m 'feat: 자동매칭 추천 로직 구현'."

  run_task 2 "자동매칭-테마추천" "$COMMON 먼저 $HARNESS_AM 을 읽어라. Task 2만 실행하라. getRecommendedTheme() 함수를 추가하라. 테마-프로필 매핑 점수 계산. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 테마 자동 추천 함수 추가'."

  run_task 3 "자동매칭-홈UI" "$COMMON 먼저 $HARNESS_AM 을 읽어라. Task 3만 실행하라. 홈(page.tsx)에서 프로필 기반 추천 테마에 배지 표시. showRecommendations 설정 연동. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 홈 화면 테마 자동 추천 배지'."

  # ── 하네스 2: 광고 시스템 (2 Task) ──
  run_task 4 "광고-컴포넌트생성" "$COMMON 먼저 $HARNESS_AD 을 읽어라. Task 1만 실행하라. AdInterstitial.tsx 컴포넌트와 useAdGate.ts 훅을 생성하라. 판타지 다크 스타일 유지. 3초 카운트다운. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 광고 인터스티셜 컴포넌트 + 게이트 훅'."

  run_task 5 "광고-세션연결" "$COMMON 먼저 $HARNESS_AD 을 읽어라. Task 2만 실행하라. LadderSession.tsx에 광고 게이트 연결. 세션 진입/종료 시 AdInterstitial 표시. Phase 타입에 ad-start/ad-end 추가. 기존 흐름 깨지 않게 주의. 반드시 빌드 확인. 빌드 통과하면 git add -A && git commit -m 'feat: 세션 진입/종료 광고 게이트 연결'."

  # ── 최종: 통합 빌드 + 푸시 ──
  run_task 6 "통합빌드푸시" "$COMMON cd ~/study/main/pullim/pullim && npx next build 실행. 빌드 실패 시 에러 수정. 빌드 통과하면 cd ~/study/main/pullim && git push origin main. 실패한 것이 있으면 그것만 수정하고 다시 빌드+커밋+푸시."
}
