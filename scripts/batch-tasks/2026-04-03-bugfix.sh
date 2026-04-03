# 버그 수정 배치 — API 테스트 전 사전 정리
# 사용: caffeinate -s bash ~/study/main/pullim/scripts/night-batch.sh ~/study/main/pullim/scripts/batch-tasks/2026-04-03-bugfix.sh

HARNESS_FILE="$PROJECT_ROOT/.state/batch-harness-2026-04-03-bugfix.md"
TASK_TIMEOUT=1800  # 30분

tasks() {
  run_task 1 "Hooks규칙위반" \
    "$COMMON 하네스의 Task 1만 실행하라. 5개 테마 페이지의 React Hooks 규칙 위반 수정. 체크포인트까지 완료. 다른 Task 금지."

  run_task 2 "SSE연결끊김" \
    "$COMMON 하네스의 Task 2만 실행하라. listen route의 SSE abort 처리. 체크포인트까지 완료. 다른 Task 금지."

  run_task 3 "입력검증" \
    "$COMMON 하네스의 Task 3만 실행하라. behind-thought 입력 검증. 체크포인트까지 완료. 다른 Task 금지."

  run_task 4 "SSE파서+가드" \
    "$COMMON 하네스의 Task 4만 실행하라. LadderSession SSE 버퍼링 + AbortController. 체크포인트까지 완료. 다른 Task 금지."

  run_task 5 "종말+치트+태그" \
    "$COMMON 하네스의 Task 5만 실행하라. 종말 persona + cheatCount + WRAP_SUGGEST. 체크포인트까지 완료. 다른 Task 금지."

  run_task 6 "나머지HIGH" \
    "$COMMON 하네스의 Task 6만 실행하라. session-summary try-catch + messages 검증 + OG 폴백. 체크포인트까지 완료. 다른 Task 금지."
}
