#!/bin/bash
# 배치 감시견 — 배치가 죽으면 재실행
# 사용: caffeinate -dis nohup bash scripts/watchdog.sh > scripts/watchdog.out 2>&1 &

PROJ_DIR="/Users/sanggyulee/study/main/pullim"
LOG="$PROJ_DIR/scripts/watchdog.log"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

log "🐕 감시견 시작"

while true; do
  # 배치 프로세스 살아있는지 확인
  if pgrep -f "start-batch-sequential" > /dev/null 2>&1; then
    sleep 60
  else
    # 배치 완료 여부 확인 (로그에 "전체 배치 완료" 있으면 정상 종료)
    if grep -q "전체 배치 완료" "$PROJ_DIR/scripts/batch_sequential.log" 2>/dev/null; then
      log "✅ 배치 정상 완료. 감시견 종료."
      exit 0
    fi

    log "⚠️ 배치 죽음 감지. 재실행..."
    cd "$PROJ_DIR"
    caffeinate -dis nohup bash scripts/start-batch-sequential.sh > scripts/nohup_seq.out 2>&1 &
    log "🔄 재실행 완료 (PID $!)"
    sleep 120  # 재실행 후 2분 대기
  fi
done
