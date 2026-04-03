#!/bin/bash
# 밤배치 — 2026-04-03 (UI버그수정 + SupabaseAuth)
# 사용: caffeinate -s bash ~/study/main/pullim/scripts/night-batch.sh ~/study/main/pullim/scripts/batch-tasks/2026-04-03-night.sh

HARNESS_A="$PROJECT_ROOT/.state/harnesses/2026-04-03_A_UI버그수정.md"
HARNESS_B="$PROJECT_ROOT/.state/harnesses/2026-04-03_B_SupabaseAuth.md"
TASK_TIMEOUT=2400  # 40분

tasks() {
  # ═══ A. UI 버그 전수 수정 ═══

  run_task 1 "StaleClosureTypescript" \
    "$COMMON 먼저 $HARNESS_A 를 읽어라. Task 1(Stale Closure 스캔+수정)과 Task 4(TypeScript 타입 불일치)를 실행하라. LadderSession.tsx 집중. 빌드 확인: cd ~/study/main/pullim/pullim && npx next build. 빌드 통과 후 git add -A && git commit -m 'fix: stale closure 패턴 + TypeScript 타입 불일치 수정'."

  run_task 2 "이미지경로+기타버그" \
    "$COMMON 먼저 $HARNESS_A 를 읽어라. Task 2(조건부 렌더링), Task 3(이미지 경로), Task 5(기타: 타이머누수+useMemo deps)를 실행하라. 빌드 확인: cd ~/study/main/pullim/pullim && npx next build. 빌드 통과 후 git add -A && git commit -m 'fix: 이미지 경로 fallback + 타이머 누수 + 조건부 렌더링 엣지케이스'."

  run_task 3 "UI빌드배포" \
    "$COMMON cd ~/study/main/pullim/pullim && npx next build 실행. 빌드 실패 시 에러만 수정하고 재빌드. 성공 시 cd ~/study/main/pullim && git push origin main."

  # ═══ B. Supabase Auth + 세션 저장 ═══

  run_task 4 "SupabaseAuth함수+훅" \
    "$COMMON 먼저 $HARNESS_B 를 읽어라. Task 1(Auth 함수 4개 추가)과 Task 2(useAuth 훅 생성)를 실행하라. src/lib/supabase/client.ts 와 src/hooks/useAuth.ts 작업. 기존 getSupabase() 시그니처 절대 건드리지 마라. 빌드 확인 후 git add -A && git commit -m 'feat: Supabase Auth 함수 + useAuth 훅'."

  run_task 5 "AuthModal+홈연결" \
    "$COMMON 먼저 $HARNESS_B 를 읽어라. Task 3(AuthModal 모달 생성)을 실행하라. src/components/AuthModal.tsx 생성. 홈(page.tsx) 헤더에 로그인 버튼 추가. RPG 테마 스타일 유지. 빌드 확인 후 git add -A && git commit -m 'feat: Auth 로그인 모달 + 홈 헤더 연결'."

  run_task 6 "세션저장API+LadderSession" \
    "$COMMON 먼저 $HARNESS_B 를 읽어라. Task 4(session-save API route 생성)와 Task 5(SQL 마이그레이션 파일 생성)를 실행하라. LadderSession.tsx에서 세션 종료 시 /api/session-save 호출 추가. Supabase 없으면 localStorage 폴백 유지. 빌드 확인 후 git add -A && git commit -m 'feat: 세션 완료 시 Supabase 저장 + SQL 마이그레이션 파일'."

  run_task 7 "최종빌드배포" \
    "$COMMON cd ~/study/main/pullim/pullim && npx next build 실행. 빌드 실패 시 에러만 수정하고 재빌드. 성공 시 cd ~/study/main/pullim && git push origin main."
}
