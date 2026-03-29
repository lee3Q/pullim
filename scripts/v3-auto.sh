#!/bin/bash
# v3 이미지 전자동 — 39장 전송 → 대기 → 복구
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPTS_FILE="$SCRIPT_DIR/prompts.txt"
BASE_DIR="$SCRIPT_DIR/../pullim/public"

NAMES=(
  # 달빛정원 추가 파악 (5)
  garden_11 garden_12 garden_13 garden_14 garden_15
  # 모험가숲 추가 파악 (5)
  adventure_11 adventure_12 adventure_13 adventure_14 adventure_15
  # 전략실 추가 파악 (5)
  strategy_11 strategy_12 strategy_13 strategy_14 strategy_15
  # 에러/로딩 (5)
  ui_loading ui_reconnect ui_session_end ui_waiting ui_preparing
  # 천문대 레벨 (5)
  stargazer_level1 stargazer_level2 stargazer_level3 stargazer_level4 stargazer_level5
  # 크리스탈/분석 (5)
  crystal_prism crystal_magnify crystal_mirror crystal_puzzle crystal_compass
  # 세션 요약 배경 (4)
  summary_journal summary_adventure summary_garden summary_strategy
  # 천문대 세션 요약 (1)
  summary_stargazer
  # 온보딩/결제/설정 (3)
  bg_onboarding bg_achievement bg_settings
  # marketing_summary 재생성 (1)
  marketing_summary_v2
)

# 글로벌 인덱스 → 저장 경로
get_save_dir() {
  local idx=$1
  if [ "$idx" -lt 15 ]; then echo "$BASE_DIR/assets/discovery"
  elif [ "$idx" -lt 20 ]; then echo "$BASE_DIR/images/ui"
  elif [ "$idx" -lt 25 ]; then echo "$BASE_DIR/images/levels"
  elif [ "$idx" -lt 30 ]; then echo "$BASE_DIR/images/crystals"
  elif [ "$idx" -lt 34 ]; then echo "$BASE_DIR/images/summary"
  elif [ "$idx" -lt 35 ]; then echo "$BASE_DIR/images/summary"
  elif [ "$idx" -lt 38 ]; then echo "$BASE_DIR/images/ui"
  else echo "$BASE_DIR/images/marketing"
  fi
}

TOTAL=${#NAMES[@]}

get_prompt() {
  local idx=$1
  awk -v n="$idx" 'BEGIN{c=0} /^---$/{c++; next} c==n{print; found=1} c>n{exit} END{if(!found) exit 1}' "$PROMPTS_FILE"
}

get_all_images_from_tab() {
  local tab_num=$1
  osascript <<ASCRIPT
tell application "Google Chrome"
  tell front window
    set active tab index to $tab_num
  end tell
  delay 0.5
  set imgUrls to execute front window's active tab javascript "
(function() {
  var imgs = document.querySelectorAll('img');
  var urls = [];
  for (var i = 0; i < imgs.length; i++) {
    var img = imgs[i];
    if (!img.src || img.src.indexOf('data:') === 0) continue;
    if (img.naturalWidth >= 400 && img.naturalHeight >= 400) {
      urls.push(img.src);
    }
  }
  return urls.join('###');
})();
"
  return imgUrls
end tell
ASCRIPT
}

echo ""
echo "🤖 v3 전자동 — ${TOTAL}장"
echo ""

# ══ Phase 1: 전송 ══
echo "═══ Phase 1: 프롬프트 전송 ═══"
echo ""

START="${1:-0}"  # 시작 인덱스 (기본 0, 인자로 변경 가능)
IDX=$START
CYCLE=0
echo "   시작 인덱스: $IDX (이전 ${IDX}장 건너뜀)"
echo ""
while [ "$IDX" -lt "$TOTAL" ]; do
  REMAINING=$((TOTAL - IDX))
  COUNT=5
  [ "$COUNT" -gt "$REMAINING" ] && COUNT=$REMAINING
  CYCLE=$((CYCLE + 1))

  echo "   사이클 ${CYCLE}: ${COUNT}개 전송 (탭 1~${COUNT})"

  # paste-macro.sh의 배치/큐를 임시로 v3용으로 설정
  echo "1" > "$SCRIPT_DIR/.queue-batch"
  echo "$IDX" > "$SCRIPT_DIR/.queue-sent"
  echo "$IDX" > "$SCRIPT_DIR/.queue-saved"

  # 기존 p1 명령 호출 (검증된 AppleScript 사용)
  bash "$SCRIPT_DIR/paste-macro.sh" p1

  IDX=$((IDX + COUNT))
  echo "   (${IDX}/${TOTAL} 전송됨)"
  echo ""
  if [ "$IDX" -lt "$TOTAL" ]; then
    echo "   ⏳ 60초 대기..."
    sleep 60
  fi
done

echo "✅ 전송 완료! (${TOTAL}장)"

# ══ Phase 2: 대기 ══
echo ""
echo "═══ Phase 2: 이미지 생성 대기 ═══"
echo ""
echo "   모든 탭에서 이미지 생성 완료될 때까지 기다려주세요."
echo "   각 탭 맨 아래까지 스크롤해서 이미지 다 나왔는지 확인!"
echo ""
echo "   준비되면 Enter..."
read -r

# ══ Phase 3: 복구 ══
echo ""
echo "═══ Phase 3: 이미지 복구 ═══"
echo ""

# 탭별 시뮬레이션
TAB1=() TAB2=() TAB3=() TAB4=() TAB5=()
G_IDX=0
while [ "$G_IDX" -lt "$TOTAL" ]; do
  REM=$((TOTAL - G_IDX))
  CNT=5
  [ "$CNT" -gt "$REM" ] && CNT=$REM
  for T in $(seq 1 "$CNT"); do
    case $T in
      1) TAB1+=("$G_IDX") ;; 2) TAB2+=("$G_IDX") ;; 3) TAB3+=("$G_IDX") ;;
      4) TAB4+=("$G_IDX") ;; 5) TAB5+=("$G_IDX") ;;
    esac
    G_IDX=$((G_IDX + 1))
  done
done

echo "   탭별 시뮬: 탭1=${#TAB1[@]}, 탭2=${#TAB2[@]}, 탭3=${#TAB3[@]}, 탭4=${#TAB4[@]}, 탭5=${#TAB5[@]}"

# URL 추출
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

for TAB in 1 2 3 4 5; do
  echo -n "   탭 $TAB 스캔..."
  RAW=$(get_all_images_from_tab "$TAB" 2>/dev/null || echo "")
  if [ -z "$RAW" ] || [ "$RAW" = "missing value" ]; then
    echo " ❌"; touch "$TMP_DIR/tab${TAB}.txt"; continue
  fi
  echo "$RAW" | tr '###' '\n' | grep -v '^$' > "$TMP_DIR/tab${TAB}.txt"
  C=$(wc -l < "$TMP_DIR/tab${TAB}.txt" | tr -d ' ')
  echo " ✅ ${C}장"
done

echo ""

# 다운로드
SAVED=0 FAILED=0

get_url() { sed -n "${2}p" "$TMP_DIR/tab${1}.txt"; }
get_tab_count() { wc -l < "$TMP_DIR/tab${1}.txt" | tr -d ' '; }

download_tab() {
  local tab=$1; shift; local globals=("$@")
  local url_count; url_count=$(get_tab_count "$tab")
  local count=${#globals[@]}
  [ "$count" -gt "$url_count" ] && count=$url_count

  for i in $(seq 0 $((count - 1))); do
    local gidx=${globals[$i]}
    local url; url=$(get_url "$tab" "$((i + 1))")
    local name="${NAMES[$gidx]}"
    local dir; dir=$(get_save_dir "$gidx")
    mkdir -p "$dir"
    curl -sL "$url" -o "$dir/${name}.png" 2>/dev/null
    if [ -s "$dir/${name}.png" ]; then
      echo "   ✅ #$((gidx+1)) ${name}.png (탭${tab}[$i])"
      SAVED=$((SAVED + 1))
    else
      echo "   ❌ #$((gidx+1)) ${name}"; rm -f "$dir/${name}.png"; FAILED=$((FAILED + 1))
    fi
  done

  if [ "$url_count" -lt "${#globals[@]}" ]; then
    for i in $(seq "$url_count" $((${#globals[@]} - 1))); do
      local gidx=${globals[$i]}
      echo "   ⚠️  #$((gidx+1)) ${NAMES[$gidx]} — 탭${tab} 이미지 부족"
      FAILED=$((FAILED + 1))
    done
  fi
}

echo "📥 다운로드..."
echo ""
download_tab 1 "${TAB1[@]}"
download_tab 2 "${TAB2[@]}"
download_tab 3 "${TAB3[@]}"
download_tab 4 "${TAB4[@]}"
download_tab 5 "${TAB5[@]}"

echo ""
echo "════════════════════════════"
echo "✅ 저장: ${SAVED}장  |  ❌ 실패: ${FAILED}장  |  전체: ${TOTAL}장"
echo "════════════════════════════"
