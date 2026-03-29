#!/bin/bash
# 아포칼립스 전체 파이프라인 — 프롬프트→이미지생성→매핑→테스트 원스톱
# 사용: caffeinate -s bash ~/study/main/pullim/scripts/run-apocalypse-all.sh [시작단계]
#   시작단계: 1(전체), 2(이미지부터), 3(매핑부터) — 기본값 1
# 전제: 브라우저에 이미지 생성 도구 탭 열어두기

set -uo pipefail

SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPTS_DIR/.." && pwd)"
LOG_DIR="/tmp/pullim-apocalypse"
mkdir -p "$LOG_DIR"
START_STAGE="${1:-1}"

log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG_DIR/pipeline.log"; }

if [[ "$START_STAGE" -le 1 ]]; then
  log "========== 1단계: 프롬프트 100장 생성 =========="
  bash "$SCRIPTS_DIR/night-batch.sh" "$SCRIPTS_DIR/batch-tasks/apocalypse-prompts.sh" 2>&1 | tee "$LOG_DIR/stage1.log"
fi

if [[ ! -f "$SCRIPTS_DIR/prompts-v4.txt" ]]; then
  log "[실패] prompts-v4.txt 없음. 1단계부터 실행 필요."
  exit 1
fi

PROMPT_COUNT=$(grep -c "^---$" "$SCRIPTS_DIR/prompts-v4.txt" 2>/dev/null || echo 0)
log "프롬프트 ${PROMPT_COUNT}개 준비됨"

if [[ "$START_STAGE" -le 2 ]]; then
  log "========== 2단계: p auto 이미지 생성 =========="
  log "브라우저 탭에서 이미지 생성 시작..."
  bash "$SCRIPTS_DIR/auto-p-loop.sh" all 60 2>&1 | tee "$LOG_DIR/stage2.log"
fi

if [[ "$START_STAGE" -le 3 ]]; then
  log "========== 3단계: 매핑 + 정합성 + 테스트 =========="
  bash "$SCRIPTS_DIR/night-batch.sh" "$SCRIPTS_DIR/batch-tasks/apocalypse-mapping.sh" 2>&1 | tee "$LOG_DIR/stage3.log"
fi

log "========== 완료 =========="
log "로그: $LOG_DIR/"
log "결과 확인: cat $LOG_DIR/pipeline.log"

# 텔레그램 알림
if [[ -f "$SCRIPTS_DIR/notify-telegram.sh" ]]; then
  bash "$SCRIPTS_DIR/notify-telegram.sh" "☄️ 아포칼립스 파이프라인 완료
프롬프트: ${PROMPT_COUNT}장
로그: /tmp/pullim-apocalypse/"
fi
