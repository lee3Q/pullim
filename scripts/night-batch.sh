#!/bin/bash
# 밤배치 엔진 v4 — macOS 네이티브 타임아웃 + 워치독 + 리포트
#
# 사용법:
#   caffeinate -s bash ~/study/main/pullim/scripts/night-batch.sh <tasks-file>
#
# tasks-file 형식 (scripts/batch-tasks/ 에 생성):
#   HARNESS_FILE="$PROJECT_ROOT/.state/batch-harness-2026-03-29.md"
#   # TASK_TIMEOUT=2400  # 선택: 오버라이드
#   tasks() {
#     run_task 1 "스크롤바" "$COMMON 하네스의 Task 1만 실행하라."
#     run_task 2 "태그 깨짐" "$COMMON 하네스의 Task 2만 실행하라."
#   }
#
# 이전 실패 이력:
#   v1 (03-20): 7시간 무한 재시도
#   v2 (03-28): stdout 0바이트 블랙박스, macOS에 timeout 명령 없음
#   v3 (03-29): 저장만 되고 v2가 실행됨

set -uo pipefail

# ========== 설정 ==========
PROJECT_ROOT="$HOME/study/main/pullim"
WEBAPP_ROOT="$PROJECT_ROOT/pullim"
LOG_DIR="/tmp/pullim-batch"
TASK_TIMEOUT="${TASK_TIMEOUT:-1800}"           # 30분 기본
WATCHDOG_INTERVAL="${WATCHDOG_INTERVAL:-300}"  # 5분 기본
REPORT_FILE="$LOG_DIR/report.txt"
BATCH_START_TIME=$(date +%s)

cd "$PROJECT_ROOT"
mkdir -p "$LOG_DIR"

# ========== 유틸리티 ==========

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }
log() { echo "[$(timestamp)] $*" | tee -a "$LOG_DIR/engine.log"; }

# ========== macOS 네이티브 타임아웃 ==========
# 반환: 0=성공, 124=타임아웃, 125=워치독kill, 그 외=실패

run_with_timeout() {
  local timeout_sec=$1
  local logfile=$2
  shift 2

  "$@" > "$logfile" 2>&1 &
  local pid=$!
  log "  PID: $pid"

  # 워치독 — 로그 성장 멈추면 kill
  (
    local last_size=0
    local stall_count=0
    local max_stall=2  # 연속 2회(=10분) 무성장이면 kill
    while kill -0 $pid 2>/dev/null; do
      sleep $WATCHDOG_INTERVAL
      if [ -f "$logfile" ]; then
        local current_size
        current_size=$(wc -c < "$logfile" 2>/dev/null || echo 0)
        if [ "$current_size" = "$last_size" ]; then
          stall_count=$((stall_count + 1))
          if [ $stall_count -ge $max_stall ]; then
            echo "[WATCHDOG] 로그 $((WATCHDOG_INTERVAL * max_stall))초 동안 성장 없음 → kill PID $pid" >> "$logfile"
            kill $pid 2>/dev/null
            exit 125
          fi
        else
          stall_count=0
          last_size=$current_size
        fi
      fi
    done
  ) &
  local watchdog_pid=$!

  # 타임아웃 타이머
  (
    sleep $timeout_sec
    if kill -0 $pid 2>/dev/null; then
      echo "[TIMEOUT] ${timeout_sec}초 초과 → kill PID $pid" >> "$logfile"
      kill $pid 2>/dev/null
    fi
  ) &
  local timer_pid=$!

  wait $pid 2>/dev/null
  local exit_code=$?

  kill $timer_pid 2>/dev/null || true
  kill $watchdog_pid 2>/dev/null || true
  wait $timer_pid 2>/dev/null || true
  wait $watchdog_pid 2>/dev/null || true

  if [ $exit_code -eq 0 ]; then
    return 0
  elif grep -q "\[TIMEOUT\]" "$logfile" 2>/dev/null; then
    return 124
  elif grep -q "\[WATCHDOG\]" "$logfile" 2>/dev/null; then
    return 125
  else
    return 1
  fi
}

# ========== Task 실행기 ==========

declare -a TASK_RESULTS=()

run_task() {
  local task_num=$1
  local task_name=$2
  local prompt=$3
  local logfile="$LOG_DIR/task${task_num}.log"

  log ""
  log "========================================="
  log "Task ${task_num}: ${task_name}"
  log "  타임아웃: ${TASK_TIMEOUT}s / 워치독: ${WATCHDOG_INTERVAL}s"
  log "  로그: ${logfile}"
  log "========================================="

  > "$logfile"

  local start_time
  start_time=$(date +%s)

  run_with_timeout "$TASK_TIMEOUT" "$logfile" \
    claude -p --model sonnet --output-format stream-json --dangerously-skip-permissions "$prompt"
  local result=$?

  local end_time
  end_time=$(date +%s)
  local duration=$(( end_time - start_time ))
  local log_size
  log_size=$(wc -c < "$logfile" 2>/dev/null || echo 0)

  case $result in
    0)
      log "Task ${task_num} SUCCESS (${duration}s, ${log_size}B)"
      TASK_RESULTS+=("${task_num}|${task_name}|SUCCESS|${duration}s|${log_size}B")
      ;;
    124)
      log "Task ${task_num} TIMEOUT (${TASK_TIMEOUT}s limit)"
      TASK_RESULTS+=("${task_num}|${task_name}|TIMEOUT|${duration}s|${log_size}B")
      ;;
    125)
      log "Task ${task_num} WATCHDOG (log stalled)"
      TASK_RESULTS+=("${task_num}|${task_name}|WATCHDOG|${duration}s|${log_size}B")
      ;;
    *)
      log "Task ${task_num} FAIL exit=${result} (${duration}s)"
      TASK_RESULTS+=("${task_num}|${task_name}|FAIL(${result})|${duration}s|${log_size}B")
      ;;
  esac

  return 0  # 실패해도 다음 Task 계속
}

# ========== 리포트 ==========

generate_report() {
  local batch_end_time
  batch_end_time=$(date +%s)
  local total_duration=$(( batch_end_time - BATCH_START_TIME ))
  local total_min=$(( total_duration / 60 ))

  local success=0
  local fail=0

  {
    echo ""
    echo "==========================================="
    echo "밤배치 v4 리포트 — $(timestamp)"
    echo "총 소요: ${total_min}분"
    echo "==========================================="
    echo ""
    printf "%-4s %-20s %-12s %-8s %-10s\n" "#" "Task" "결과" "시간" "로그"
    echo "---- -------------------- ------------ -------- ----------"
    for r in "${TASK_RESULTS[@]}"; do
      IFS='|' read -r num name status dur size <<< "$r"
      printf "%-4s %-20s %-12s %-8s %-10s\n" "$num" "$name" "$status" "$dur" "$size"
      if [ "$status" = "SUCCESS" ]; then
        success=$((success + 1))
      else
        fail=$((fail + 1))
      fi
    done
    echo ""
    echo "성공: ${success} / 실패: ${fail} / 총: ${#TASK_RESULTS[@]}"
    echo "로그: $LOG_DIR/task[N].log"
    echo "==========================================="
  } | tee "$REPORT_FILE"

  # 텔레그램 알림
  if [ -f "$PROJECT_ROOT/.env.notify" ]; then
    # shellcheck disable=SC1091
    source "$PROJECT_ROOT/.env.notify"
    if [ -n "${TELEGRAM_BOT_TOKEN:-}" ] && [ -n "${TELEGRAM_CHAT_ID:-}" ]; then
      curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
        -d chat_id="${TELEGRAM_CHAT_ID}" \
        -d text="$(cat "$REPORT_FILE")" > /dev/null 2>&1 || true
      log "텔레그램 알림 전송"
    fi
  fi
}

# ========== 프리플라이트 ==========

preflight() {
  log "=== 프리플라이트 ==="
  local fail=0

  if ! command -v claude &>/dev/null; then
    log "FAIL: claude CLI 없음"
    fail=1
  else
    log "OK: claude CLI"
  fi

  if [ -n "${HARNESS_FILE:-}" ] && [ ! -f "$HARNESS_FILE" ]; then
    log "FAIL: 하네스 파일 없음: $HARNESS_FILE"
    fail=1
  elif [ -n "${HARNESS_FILE:-}" ]; then
    log "OK: 하네스 ($HARNESS_FILE)"
  fi

  # claude -p 동작 테스트 (훅 초기화 포함 90초)
  local test_log="$LOG_DIR/preflight-test.log"
  run_with_timeout 90 "$test_log" claude -p --model haiku --output-format stream-json --dangerously-skip-permissions "1+1="
  local test_result=$?
  if [ $test_result -eq 0 ]; then
    log "OK: claude -p 응답 확인"
  else
    log "FAIL: claude -p 응답 없음 (exit=$test_result)"
    fail=1
  fi

  if [ $fail -ne 0 ]; then
    log "프리플라이트 실패 — 배치 중단"
    exit 1
  fi
  log "=== 프리플라이트 통과 ==="
}

# ========== 메인 ==========

# --harness 모드: 하네스 파일을 직접 tasks 파일로 변환하여 실행
if [[ "${1:-}" == "--harness" ]]; then
  _HARNESS_PATH="${2:-}"
  if [[ -z "$_HARNESS_PATH" ]] || [[ ! -f "$_HARNESS_PATH" ]]; then
    echo "ERROR: --harness 모드: 파일 없음: ${_HARNESS_PATH:-}"
    exit 1
  fi
  _TMP_TASKS=$(mktemp /tmp/pullim-harness-XXXXXX.sh)
  cat > "$_TMP_TASKS" << EOFILE
HARNESS_FILE="$_HARNESS_PATH"
tasks() {
  run_task 1 "하네스실행" "\$COMMON 하네스 파일의 모든 작업 항목을 완료 기준(AC)에 맞춰 순서대로 실행하라."
}
EOFILE
  set -- "$_TMP_TASKS"
fi

TASKS_FILE="${1:-}"

if [ -z "$TASKS_FILE" ]; then
  cat << 'USAGE'
밤배치 엔진 v4

사용법:
  caffeinate -s bash ~/study/main/pullim/scripts/night-batch.sh <tasks-file>

tasks-file 형식:
  HARNESS_FILE="$PROJECT_ROOT/.state/batch-harness-XXX.md"
  tasks() {
    run_task 1 "이름" "$COMMON 하네스의 Task 1만 실행하라."
    run_task 2 "이름" "$COMMON 하네스의 Task 2만 실행하라."
  }

모니터링 (별도 터미널):
  tail -f /tmp/pullim-batch/task*.log
  tail -f /tmp/pullim-batch/engine.log
USAGE
  echo ""
  echo "기존 tasks 파일:"
  ls "$PROJECT_ROOT/scripts/batch-tasks/"*.sh 2>/dev/null || echo "  (없음)"
  exit 1
fi

if [ ! -f "$TASKS_FILE" ]; then
  echo "ERROR: tasks 파일 없음: $TASKS_FILE"
  exit 1
fi

# 1단계: tasks 파일에서 변수 + tasks() 함수 로드
HARNESS_FILE=""
# shellcheck disable=SC1090
source "$TASKS_FILE"

# 2단계: COMMON 빌드 (HARNESS_FILE 설정 후)
LATEST_HANDOFF=$(ls -t "$PROJECT_ROOT/.state/handoffs/"*.md 2>/dev/null | head -1)
COMMON="먼저 다음 파일을 읽어라: (1) ${LATEST_HANDOFF:-없음} (2) $PROJECT_ROOT/.state/project-config.md (3) $PROJECT_ROOT/.state/projects/풀림_핵심UX_설계.md"
if [ -n "$HARNESS_FILE" ]; then
  COMMON="$COMMON (4) $HARNESS_FILE 하네스의 '제약' 섹션을 반드시 지켜라."
fi
COMMON="$COMMON 웹앱 경로: $WEBAPP_ROOT/"

# 3단계: 프리플라이트
preflight

log ""
log "==========================================="
log "밤배치 v4 시작: $(timestamp)"
log "Tasks: $TASKS_FILE"
log "하네스: ${HARNESS_FILE:-없음}"
log "모니터: tail -f $LOG_DIR/task*.log"
log "==========================================="

# 4단계: tasks() 함수 실행
if type tasks &>/dev/null; then
  tasks
else
  log "ERROR: tasks 파일에 tasks() 함수가 없음"
  exit 1
fi

# 5단계: 리포트
generate_report
