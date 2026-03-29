# 밤배치 tasks 파일 예시
# 사용: caffeinate -s bash ~/study/main/pullim/scripts/night-batch.sh ~/study/main/pullim/scripts/batch-tasks/example.sh

# 하네스 파일 (없으면 빈 문자열)
HARNESS_FILE="$PROJECT_ROOT/.state/batch-harness-2026-03-28-night.md"

# 선택: 타임아웃 오버라이드
# TASK_TIMEOUT=2400  # 40분

# tasks() 함수 안에 run_task 호출을 나열
# $COMMON 변수: 엔진이 자동 빌드 (핸드오프+config+프로젝트+하네스 읽기 지시)
tasks() {
  run_task 1 "스크롤바 다크" \
    "$COMMON 하네스의 Task 1만 실행하라. 체크포인트까지 완료. 다른 Task 금지."

  run_task 2 "태그 깨짐" \
    "$COMMON 하네스의 Task 2만 실행하라. Step 2-0 재현부터 시작. 체크포인트까지 완료. 다른 Task 금지."
}
