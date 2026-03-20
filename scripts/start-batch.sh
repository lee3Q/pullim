#!/bin/bash
# 밤샘 배치 원클릭 시작
# 사용: cd ~/study/main/pullim && bash scripts/start-batch.sh
#
# 옵션:
#   BATCH_MODEL=opus bash scripts/start-batch.sh    # 모델 변경
#   SKIP_PASS2=true bash scripts/start-batch.sh     # 2패스 스킵 (빠르게)

set -e
cd "$(dirname "$0")/.."
PROJ_DIR=$(pwd)

echo "========================================"
echo "풀림 밤샘 배치 v2"
echo "========================================"

# 이전 실행 확인
LOCKFILE="$PROJ_DIR/scripts/.batch.lock"
if [[ -f "$LOCKFILE" ]]; then
  pid=$(cat "$LOCKFILE")
  if kill -0 "$pid" 2>/dev/null; then
    echo "⚠️  이미 실행 중 (PID $pid)"
    echo "종료하려면: kill $pid && rm $LOCKFILE"
    exit 1
  fi
  rm -f "$LOCKFILE"
fi

# 상태 요약
total=$(ls scripts/tasks/*.md 2>/dev/null | wc -l | tr -d ' ')
done=$(ls scripts/output/*_final.md 2>/dev/null | wc -l | tr -d ' ')
echo "작업: ${done}/${total} 완료, $((total - done))개 남음"
echo "모델: ${BATCH_MODEL:-sonnet}"
echo "2패스: $(if [[ "${SKIP_PASS2:-false}" == "true" ]]; then echo "OFF"; else echo "ON"; fi)"
echo ""

# 이전 로그 백업
if [[ -f scripts/batch.log ]]; then
  mv scripts/batch.log "scripts/batch_$(date '+%m%d_%H%M').log"
  echo "이전 로그 백업 완료"
fi
if [[ -f scripts/monitor.log ]]; then
  mv scripts/monitor.log "scripts/monitor_$(date '+%m%d_%H%M').log"
fi

# 이전 영구 실패 목록 초기화 (새 배치는 클린 스타트)
rm -f scripts/.permafail

# 배치 시작 (-dis: idle+display+system sleep 모두 방지)
caffeinate -dis nohup bash scripts/batch_claude.sh > scripts/nohup.out 2>&1 &
BATCH_PID=$!
echo "✅ 배치 시작 (PID $BATCH_PID)"

# 모니터 시작
sleep 2
caffeinate -dis nohup bash scripts/monitor.sh > scripts/monitor_nohup.out 2>&1 &
MON_PID=$!
echo "✅ 모니터 시작 (PID $MON_PID)"

echo ""
echo "========================================"
echo "모니터링 명령어:"
echo "  tail -f scripts/batch.log          # 실시간 로그"
echo "  ls scripts/output/*_final.md | wc -l  # 완료 수"
echo "  cat scripts/monitor.log            # 모니터 로그"
echo "  ps aux | grep batch_claude         # 프로세스 확인"
echo "========================================"
echo ""
echo "이제 자도 됩니다 😴"
