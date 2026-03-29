# 낮배치 — 2026-03-29 (어제 밤배치 실패분 Task 2~6)
# 실행: caffeinate -s bash ~/study/main/pullim/scripts/night-batch.sh ~/study/main/pullim/scripts/batch-tasks/2026-03-29-day.sh

HARNESS_FILE="$PROJECT_ROOT/.state/batch-harness-2026-03-28-night.md"
TASK_TIMEOUT=1800  # 30분

tasks() {
  run_task 2 "태그 깨짐" \
    "$COMMON 하네스의 Task 2(<태그> 깨짐 수정)만 실행하라. Step 2-0 재현부터 시작. 체크포인트 2까지 완료하라. 다른 Task는 하지 마라."

  run_task 3 "E2E 테스트" \
    "$COMMON 하네스의 Task 3(4테마 E2E 테스트 + 즉시 수정)만 실행하라. 라운드 1~3 전부 돌려라. 체크포인트 3까지 완료하라. 다른 Task는 하지 마라."

  run_task 4 "텍스트 게임형" \
    "$COMMON 하네스의 Task 4(세션 UI 구조 파악 + 텍스트 게임형 강화)만 실행하라. Step 4-0부터 4-3까지 순서대로. 체크포인트 4까지 완료하라. 다른 Task는 하지 마라."

  run_task 5 "UI 디테일" \
    "$COMMON 하네스의 Task 5(UI 디테일 추가 수정)만 실행하라. 5-1부터 5-6까지 전부. 체크포인트 5까지 완료하라. 다른 Task는 하지 마라."

  run_task 6 "배포" \
    "$COMMON 하네스의 Task 6(최종 빌드 + 배포 + 프로덕션 검증 + 핸드오프)만 실행하라. Step 6-1부터 6-4까지. 핸드오프를 반드시 작성하라. 다른 Task는 하지 마라."
}
