#!/bin/bash
# 3그룹 순차 배치 (CC 교차검증 결과 반영)
# A→커밋→B→커밋→C→커밋→최종빌드
#
# 사용: cd ~/study/main/pullim && bash scripts/start-batch-sequential.sh

set -o pipefail
cd "$(dirname "$0")/.."
PROJ_DIR=$(pwd)
CLAUDE="/Users/sanggyulee/.local/bin/claude"

echo "========================================"
echo "풀림 밤샘 배치 — 3그룹 순차 (안전 모드)"
echo "========================================"

# Branch 격리
BRANCH_NAME="overnight/$(date '+%Y%m%d')"
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]]; then
  git stash --include-untracked -m "batch-stash-$(date '+%Y%m%d_%H%M')" 2>/dev/null || true
  git checkout -B "$BRANCH_NAME" 2>/dev/null
  git stash pop 2>/dev/null || true
  echo "✅ 브랜치: $BRANCH_NAME"
else
  echo "✅ 브랜치: $BRANCH_NAME (이미 존재)"
fi

# 배치 시작 전 스냅샷
git add -A && git commit -m "chore: 배치 시작 전 스냅샷 $(date '+%H:%M')" 2>/dev/null || true
echo "✅ 시작 전 스냅샷 커밋"

# 로그
LOG="$PROJ_DIR/scripts/batch_sequential.log"
log() { echo "[$(date '+%H:%M:%S')] $*" | tee -a "$LOG"; }
> "$LOG"

# 영구 실패 초기화
rm -f scripts/.permafail

run_group() {
  local group_name="$1"
  local task_dir="$2"
  local total=$(ls "$task_dir"/*.md 2>/dev/null | wc -l | tr -d ' ')

  log "======== 그룹 $group_name 시작 ($total개) ========"

  local succeeded=0
  local failed=0

  for f in "$task_dir"/*.md; do
    [ -f "$f" ] || continue
    local b=$(basename "$f" .md)

    log "🚀 $b"

    local tmp_json=$(mktemp)
    local result

    cat "$f" | "$CLAUDE" -p --output-format json --model sonnet --max-turns 15 --dangerously-skip-permissions > "$tmp_json" 2>/dev/null
    result=$(jq -r '.[-1].result // empty' "$tmp_json" 2>/dev/null)
    [[ "$result" == "null" ]] && result=""

    if [[ -n "$result" && ${#result} -gt 10 ]]; then
      log "  ✅ $b 완료 (${#result} chars)"
      (( succeeded++ ))
    else
      log "  ❌ $b 실패"
      (( failed++ ))
    fi

    rm -f "$tmp_json"
    sleep 10  # 쿨다운
  done

  log "======== 그룹 $group_name 완료 (성공: $succeeded, 실패: $failed) ========"

  # 그룹 완료 후 빌드 테스트
  log "🔨 빌드 테스트..."
  cd "$PROJ_DIR/pullim"
  if npm run build > /dev/null 2>&1; then
    log "  ✅ 빌드 통과"
  else
    log "  ❌ 빌드 실패 — 이전 커밋으로 복구 가능"
  fi
  cd "$PROJ_DIR"

  # 체크포인트 커밋
  git add -A && git commit -m "batch: 그룹 $group_name 완료 ($(date '+%H:%M'))" 2>/dev/null || true
  log "📌 체크포인트 커밋 완료"
}

# === 순차 실행 ===
run_group "A (성능/인프라)" "$PROJ_DIR/scripts/tasks_a"
run_group "B (기능/콘텐츠)" "$PROJ_DIR/scripts/tasks_b"
run_group "C (디자인/UX)" "$PROJ_DIR/scripts/tasks_c"

# === 최종 리포트 ===
log "========================================"
log "🏁 전체 배치 완료!"
log "  브랜치: $BRANCH_NAME"
log "  로그: $LOG"
log "========================================"

# 배치 결과 파일
BATCH_RESULT="$PROJ_DIR/.state/daily/$(date '+%Y-%m-%d')_batch.md"
mkdir -p "$PROJ_DIR/.state/daily"
{
  echo "# 밤 배치 결과 — $(date '+%Y-%m-%d %H:%M')"
  echo ""
  echo "## 순차 3그룹 (CC 교차검증 반영)"
  echo "브랜치: $BRANCH_NAME"
  echo ""
  echo "### 로그 요약"
  grep -E '(✅|❌|완료|시작)' "$LOG"
} > "$BATCH_RESULT"
