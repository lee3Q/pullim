#!/bin/bash
# monitor.sh v2 — 배치 감시 + 무한루프 감지 + 자동 재시작
#
# 실행: caffeinate -i nohup bash scripts/monitor.sh > scripts/monitor_nohup.out 2>&1 &

PROJ_DIR="/Users/sanggyulee/study/main/pullim"
LOG="$PROJ_DIR/scripts/monitor.log"
BATCH_LOG="$PROJ_DIR/scripts/batch.log"
OUT_DIR="$PROJ_DIR/scripts/output"
TASK_DIR="$PROJ_DIR/scripts/tasks"
LOCKFILE="$PROJ_DIR/scripts/.batch.lock"
INTERVAL=1800  # 30분

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

# 마지막 체크 시 진행률 저장
LAST_DONE_COUNT=-1
STALL_COUNT=0
STALL_THRESHOLD=3  # 30분×3=1.5시간 진행 없으면 문제

check_status() {
  local total
  total=$(ls "$TASK_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
  local done_count
  done_count=$(ls "$OUT_DIR"/*_final.md 2>/dev/null | wc -l | tr -d ' ')
  local last_log
  last_log=$(tail -1 "$BATCH_LOG" 2>/dev/null)

  # 배치 프로세스 확인
  local batch_alive=0
  if [[ -f "$LOCKFILE" ]]; then
    local pid
    pid=$(cat "$LOCKFILE")
    if kill -0 "$pid" 2>/dev/null; then
      batch_alive=1
    fi
  fi

  log "📊 완료: ${done_count}/${total} | 프로세스: $(if [[ $batch_alive -eq 1 ]]; then echo "실행중(PID $(cat "$LOCKFILE"))"; else echo "없음"; fi)"
  log "📝 마지막: $last_log"

  # 전부 완료
  if [[ "$done_count" -ge "$total" ]] && [[ "$total" -gt 0 ]]; then
    log "🎉 전체 완료! 모니터 종료."
    return 1
  fi

  # 진행률 체크 (무한루프 감지)
  if [[ "$done_count" -eq "$LAST_DONE_COUNT" ]]; then
    (( STALL_COUNT++ ))
    if (( STALL_COUNT >= STALL_THRESHOLD )); then
      log "🚨 ${STALL_COUNT}회 연속 진행 없음 (${done_count}/${total}). 배치가 막힘."
      if [[ $batch_alive -eq 1 ]]; then
        local pid
        pid=$(cat "$LOCKFILE")
        log "🔪 막힌 배치 종료 (PID $pid) 후 재시작..."
        kill "$pid" 2>/dev/null
        sleep 5
        kill -9 "$pid" 2>/dev/null
        rm -f "$LOCKFILE"
        sleep 10
        restart_batch
      else
        restart_batch
      fi
      STALL_COUNT=0
    else
      log "⚠️  진행 없음 (${STALL_COUNT}/${STALL_THRESHOLD})"
    fi
  else
    STALL_COUNT=0
    log "✅ 진행 중 (+$((done_count - LAST_DONE_COUNT))개)"
  fi

  LAST_DONE_COUNT=$done_count

  # 프로세스 죽었으면 재시작
  if [[ $batch_alive -eq 0 ]] && [[ "$done_count" -lt "$total" ]]; then
    log "🚨 배치 프로세스 없음. 재시작."
    restart_batch
  fi

  return 0
}

restart_batch() {
  cd "$PROJ_DIR"
  rm -f "$LOCKFILE"
  caffeinate -i nohup bash scripts/batch_claude.sh >> scripts/nohup.out 2>&1 &
  log "  ✅ 배치 재시작 (PID $!)"
}

# === 메인 ===
log "========================================"
log "🔍 모니터 시작 v2 (${INTERVAL}초 간격, 무한루프 감지)"
log "========================================"

while true; do
  check_status
  [[ $? -eq 1 ]] && break
  sleep "$INTERVAL"
done

log "🏁 모니터 종료"
