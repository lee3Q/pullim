#!/bin/bash
# batch_claude.sh v2 — 밤샘 배치 자동화 (2026-03-20 개선)
#
# 실행: cd ~/study/main/pullim && caffeinate -i nohup bash scripts/batch_claude.sh > scripts/nohup.out 2>&1 &
# 모니터: tail -f scripts/batch.log
# 진행률: ls scripts/output/*_final.md 2>/dev/null | wc -l
#
# v1 문제: 무한 재시도, 0바이트 출력, 경쟁 실행, 모니터 무력
# v2 개선: 엄격한 재시도(3회), 서킷브레이커, JSON 출력, 에러 진단, 2패스 폴백
# v2.1 교차검증 반영: null 리터럴 처리, 영구 실패 추적, tmp 정리, lockfile atomic

set -uo pipefail

# === 설정 ===
PROJ_DIR="/Users/sanggyulee/study/main/pullim"
TASK_DIR="$PROJ_DIR/scripts/tasks"
OUT_DIR="$PROJ_DIR/scripts/output"
ERR_DIR="$PROJ_DIR/scripts/errors"
LOG="$PROJ_DIR/scripts/batch.log"
LOCKFILE="$PROJ_DIR/scripts/.batch.lock"
CLAUDE="/Users/sanggyulee/.local/bin/claude"

MODEL="${BATCH_MODEL:-sonnet}"
MAX_RETRIES=3             # 패스당 최대 재시도
RATE_LIMIT_WAIT=300       # 레이트리밋 시 5분 대기
RETRY_WAIT=60             # 일반 실패 시 1분 대기
COOLDOWN=30               # 작업 간 30초 쿨다운
CIRCUIT_THRESHOLD=3       # N연속 실패 시 서킷브레이커
CIRCUIT_WAIT=1800         # 서킷브레이커 30분 냉각
SKIP_PASS2="${SKIP_PASS2:-false}"  # 2패스 전체 스킵 옵션
SKIPFILE="$PROJ_DIR/scripts/.permafail"  # 영구 실패 작업 목록

mkdir -p "$OUT_DIR" "$ERR_DIR"
touch "$SKIPFILE"
cd "$PROJ_DIR"

# === 중복 실행 방지 (atomic) ===
if [[ -f "$LOCKFILE" ]]; then
  existing_pid=$(cat "$LOCKFILE" 2>/dev/null)
  if [[ -n "$existing_pid" ]] && kill -0 "$existing_pid" 2>/dev/null; then
    echo "[ERROR] 이미 실행 중 (PID $existing_pid). 종료."
    echo "[ERROR] 강제 시작: rm $LOCKFILE 후 재실행"
    exit 1
  fi
  echo "[WARN] 이전 lockfile 제거 (PID $existing_pid 죽음)"
  rm -f "$LOCKFILE"
fi
if ! (set -C; echo $$ > "$LOCKFILE") 2>/dev/null; then
  echo "[ERROR] lockfile 생성 실패 (경쟁 조건). 재시도."
  exit 1
fi
trap 'rm -f "$LOCKFILE"; log "🛑 배치 종료 (PID $$)"' EXIT

# === 로깅 ===
log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }

# === Claude 1회 실행 ===
run_claude_once() {
  local input_file="$1"
  local extra="$2"
  local output_file="$3"
  local mode="$4"
  local tmp_json
  tmp_json=$(mktemp)
  trap 'rm -f "$tmp_json"' RETURN

  local -a claude_args=(-p --output-format json --model "$MODEL" --max-turns 10 --dangerously-skip-permissions)

  if [[ -n "$extra" ]]; then
    { cat "$input_file"; printf '\n\n---\n%s' "$extra"; } | \
      "$CLAUDE" "${claude_args[@]}" > "$tmp_json" 2>/dev/null
  else
    cat "$input_file" | \
      "$CLAUDE" "${claude_args[@]}" > "$tmp_json" 2>/dev/null
  fi

  local exit_code=$?

  # JSON 파싱 — result 추출 (null 리터럴 방어)
  local result
  result=$(jq -r '.[-1].result // empty' "$tmp_json" 2>/dev/null)
  [[ "$result" == "null" ]] && result=""

  if [[ -n "$result" && ${#result} -gt 10 ]]; then
    echo "$result" > "$output_file"
    local bytes
    bytes=$(wc -c < "$output_file" | tr -d ' ')
    echo "OK:${bytes}"
    return 0
  fi

  # === 실패 분류 ===
  local err_type="unknown"

  # 레이트리밋 (API)
  if jq -e '.[] | select(.subtype=="api_retry")' "$tmp_json" > /dev/null 2>&1; then
    err_type="rate_limit_api"
  # 레이트리밋 (구독)
  elif jq -e '.[] | select(.type=="rate_limit_event")' "$tmp_json" > /dev/null 2>&1; then
    err_type="rate_limit_sub"
  # 과부하
  elif jq -e '.[] | select(.subtype=="overloaded")' "$tmp_json" > /dev/null 2>&1; then
    err_type="overloaded"
  # exit code 비정상
  elif [[ $exit_code -ne 0 ]]; then
    err_type="exit_${exit_code}"
  # result가 너무 짧거나 빈 문자열
  elif [[ -n "$result" ]]; then
    err_type="short_result"
  else
    err_type="empty_result"
  fi

  # 에러 JSON 저장 (디버깅용) — tmp_json은 trap RETURN으로 자동 정리
  local err_name
  err_name=$(basename "$output_file" .md)
  cp "$tmp_json" "$ERR_DIR/${err_name}_$(date '+%H%M%S').json"

  echo "FAIL:${err_type}"
  return 1
}

# === 재시도 래퍼 ===
run_with_retry() {
  local input_file="$1"
  local extra="$2"
  local output_file="$3"
  local mode="$4"
  local task_name="$5"

  local attempt=0
  while (( attempt < MAX_RETRIES )); do
    (( attempt++ ))

    local result
    result=$(run_claude_once "$input_file" "$extra" "$output_file" "$mode")
    local rc=$?

    if [[ $rc -eq 0 ]]; then
      local bytes="${result#OK:}"
      log "    [${attempt}/${MAX_RETRIES}] OK ${bytes}bytes"
      return 0
    fi

    local err_type="${result#FAIL:}"
    local wait_time=$RETRY_WAIT

    # 레이트리밋/과부하 → 더 오래 대기
    if [[ "$err_type" == rate_limit_* || "$err_type" == "overloaded" ]]; then
      wait_time=$RATE_LIMIT_WAIT
      log "    [${attempt}/${MAX_RETRIES}] ${err_type} → ${wait_time}초 대기"
    else
      log "    [${attempt}/${MAX_RETRIES}] ${err_type} → ${wait_time}초 대기 (에러: $ERR_DIR/)"
    fi

    if (( attempt < MAX_RETRIES )); then
      sleep "$wait_time"
    fi
  done

  log "    ❌ ${MAX_RETRIES}회 실패 → 스킵"
  return 1
}

# === 코드 작업 판별 ===
is_code_task() {
  local name="$1"
  echo "$name" | grep -qE '코드|구현|빌드'
}

# === 메인 ===
total=$(ls "$TASK_DIR"/*.md 2>/dev/null | wc -l | tr -d ' ')
done_count=$(ls "$OUT_DIR"/*_final.md 2>/dev/null | wc -l | tr -d ' ')

log "========================================"
log "🔥 배치 시작 v2"
log "  전체: ${total}, 완료: ${done_count}, 남은: $((total - done_count))"
log "  모델: $MODEL, 재시도: ${MAX_RETRIES}회, 서킷: ${CIRCUIT_THRESHOLD}연속"
log "  2패스: $(if [[ "$SKIP_PASS2" == "true" ]]; then echo "OFF"; else echo "ON (코드작업 제외)"; fi)"
log "========================================"

failed=0
succeeded=$done_count
consecutive_fails=0

for f in "$TASK_DIR"/*.md; do
  b=$(basename "$f" .md)

  # 이미 완료
  if [[ -f "$OUT_DIR/${b}_final.md" ]]; then
    log "⏭️  $b (이미 완료)"
    continue
  fi

  # 영구 실패 목록에 있으면 스킵 (모니터 재시작 시 무한 반복 방지)
  if grep -qF "$b" "$SKIPFILE" 2>/dev/null; then
    log "⛔ $b (영구 실패 — 스킵)"
    continue
  fi

  # 서킷브레이커
  if (( consecutive_fails >= CIRCUIT_THRESHOLD )); then
    log "🔴 ${consecutive_fails}연속 실패 — 서킷브레이커. ${CIRCUIT_WAIT}초 냉각"
    sleep "$CIRCUIT_WAIT"
    consecutive_fails=0
    log "🟢 냉각 완료. 재개."
  fi

  # 코드 작업 여부
  local_mode="simple"
  if is_code_task "$b"; then
    local_mode="code"
  fi

  # === Pass 1 ===
  log "🚀 $b [Pass 1] ($local_mode)"
  if [[ -f "$OUT_DIR/${b}_pass1.md" ]] && [[ -s "$OUT_DIR/${b}_pass1.md" ]]; then
    log "    (1패스 존재 — 스킵)"
  else
    if ! run_with_retry "$f" "" "$OUT_DIR/${b}_pass1.md" "$local_mode" "$b"; then
      (( failed++ ))
      (( consecutive_fails++ ))
      echo "$b" >> "$SKIPFILE"  # 영구 실패 기록 → 재시작 시 스킵
      log "❌ $b 실패 (영구 스킵 등록) → 다음 작업"
      continue
    fi
  fi

  # === Pass 2 ===
  if [[ "$SKIP_PASS2" == "true" ]] || [[ "$local_mode" == "code" ]]; then
    # 2패스 스킵 — 1패스를 final로
    cp "$OUT_DIR/${b}_pass1.md" "$OUT_DIR/${b}_final.md"
    log "🎉 $b 완료 (1패스만)"
  else
    sleep "$COOLDOWN"
    log "🚀 $b [Pass 2]"
    if ! run_with_retry "$OUT_DIR/${b}_pass1.md" \
      "위 결과를 검토하고 빠진 부분을 보완하여 개선된 최종 버전을 출력해줘." \
      "$OUT_DIR/${b}_final.md" "$local_mode" "$b"; then
      # 2패스 실패 → 1패스 채택 (블로킹 아님)
      cp "$OUT_DIR/${b}_pass1.md" "$OUT_DIR/${b}_final.md"
      log "⚠️  $b — 2패스 실패, 1패스 채택"
    else
      log "🎉 $b 완료 (2패스)"
    fi
  fi

  (( succeeded++ ))
  consecutive_fails=0

  sleep "$COOLDOWN"
done

# === 최종 리포트 ===
final_count=$(ls "$OUT_DIR"/*_final.md 2>/dev/null | wc -l | tr -d ' ')
log "========================================"
log "🏁 배치 완료!"
log "  성공: ${final_count}/${total}"
log "  실패: ${failed}"
log "  결과: $OUT_DIR/*_final.md"
if [[ -d "$ERR_DIR" ]] && ls "$ERR_DIR"/*.json > /dev/null 2>&1; then
  err_count=$(ls "$ERR_DIR"/*.json 2>/dev/null | wc -l | tr -d ' ')
  log "  에러 로그: $ERR_DIR/ (${err_count}개)"
fi
log "========================================"
