#!/bin/bash
# 밤배치 — 2026-04-04 (GLM 플레이라이트 실험 + SupabaseAuth)
# Playwright + Chromium 설치 완료 (2026-04-04 세션 중 설치)
# 사용: caffeinate -s bash ~/study/main/pullim/scripts/night-batch.sh ~/study/main/pullim/scripts/batch-tasks/2026-04-04-night.sh

HARNESS_B="$PROJECT_ROOT/.state/harnesses/2026-04-03_B_SupabaseAuth.md"
HARNESS_C="$PROJECT_ROOT/.state/harnesses/2026-04-04_C_GLM플레이라이트.md"
TASK_TIMEOUT=2400  # 40분

tasks() {
  # ═══ C. GLM 플레이라이트 UI 실험 ═══

  run_task 1 "GLM사다리테스트스크립트" \
    "$COMMON 먼저 $HARNESS_C 를 읽어라. Task 2(테스트 스크립트 작성)를 실행하라. playwright.config.ts 와 tests/e2e/ladder-glm.spec.ts 생성. 실제 DOM 구조 확인 필수: ~/study/main/pullim/pullim/src/components/session/LadderSession.tsx 를 읽고 선택지 버튼 클래스명/구조 파악 후 셀렉터 반영. 스크린샷 폴더 ~/study/main/pullim/tests/screenshots/ 생성."

  run_task 2 "GLM테스트실행+리포트" \
    "$COMMON 먼저 $HARNESS_C 를 읽어라. Task 3(테스트 실행 + 리포트 생성)을 실행하라. cd ~/study/main/pullim/pullim && npx playwright test tests/e2e/ladder-glm.spec.ts --reporter=list 2>&1 | tee ../../tests/glm-test-result.txt. 결과를 읽고 ~/study/main/pullim/tests/glm-테스트-결과.md 생성 (테마별 PASS/FAIL, 선택지 렌더링 여부, 에러 메시지). 커밋: cd ~/study/main/pullim && git add -A && git commit -m 'test: GLM-5 플레이라이트 사다리 세션 UI 실험 결과' && git push origin main."

  # ═══ B. Supabase Auth + 세션 저장 ═══

  run_task 3 "SupabaseAuth함수+훅" \
    "$COMMON 먼저 $HARNESS_B 를 읽어라. Task 1(Auth 함수 4개 추가)과 Task 2(useAuth 훅 생성)를 실행하라. src/lib/supabase/client.ts 와 src/hooks/useAuth.ts 작업. 기존 getSupabase() 시그니처 절대 건드리지 마라. 빌드 확인 후 git add -A && git commit -m 'feat: Supabase Auth 함수 + useAuth 훅'."

  run_task 4 "AuthModal+홈연결" \
    "$COMMON 먼저 $HARNESS_B 를 읽어라. Task 3(AuthModal 모달 생성)을 실행하라. src/components/AuthModal.tsx 생성. 홈(page.tsx) 헤더에 로그인 버튼 추가. RPG 테마 스타일 유지. 빌드 확인 후 git add -A && git commit -m 'feat: Auth 로그인 모달 + 홈 헤더 연결'."

  run_task 5 "세션저장API+LadderSession" \
    "$COMMON 먼저 $HARNESS_B 를 읽어라. Task 4(session-save API route 생성)와 Task 5(SQL 마이그레이션 파일 생성)를 실행하라. LadderSession.tsx에서 세션 종료 시 /api/session-save 호출 추가. Supabase 없으면 localStorage 폴백 유지. 빌드 확인 후 git add -A && git commit -m 'feat: 세션 완료 시 Supabase 저장 + SQL 마이그레이션 파일'."

  run_task 6 "최종빌드배포" \
    "$COMMON cd ~/study/main/pullim/pullim && npx next build 실행. 빌드 실패 시 에러만 수정하고 재빌드. 성공 시 cd ~/study/main/pullim && git push origin main."
}
