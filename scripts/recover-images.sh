#!/bin/bash
# 이미지 복구 스크립트 v2 — 배치 경계 고려한 정확한 탭→파일명 매핑
#
# 사용법: bash scripts/recover-images.sh
#
# p1 호출 시퀀스를 시뮬레이션하여 각 탭의 N번째 이미지가
# 어떤 글로벌 인덱스에 해당하는지 정확히 계산

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$SCRIPT_DIR/../pullim/public"

# ── 전체 82장의 이름 (글로벌 순서) ──
GLOBAL_NAMES=(
  # Batch 1: OG 카드 (25)
  og_main
  og_adventure_quiet-strategist og_adventure_empathic-deliberator og_adventure_analytical-explorer og_adventure_bold-designer
  og_adventure_free-healer og_adventure_warm-guardian og_adventure_intuitive-breaker og_adventure_sensory-adventurer
  og_garden_quiet-strategist og_garden_empathic-deliberator og_garden_analytical-explorer og_garden_bold-designer
  og_garden_free-healer og_garden_warm-guardian og_garden_intuitive-breaker og_garden_sensory-adventurer
  og_strategy_quiet-strategist og_strategy_empathic-deliberator og_strategy_analytical-explorer og_strategy_bold-designer
  og_strategy_free-healer og_strategy_warm-guardian og_strategy_intuitive-breaker og_strategy_sensory-adventurer
  # Batch 2: 천문대 파악 (11)
  stargazer_1 stargazer_2 stargazer_3 stargazer_4 stargazer_5
  stargazer_6 stargazer_7 stargazer_8 stargazer_9 stargazer_10
  stargazer_outro
  # Batch 3: 천문대 캐릭터 (8)
  stargazer_quiet-strategist stargazer_empathic-deliberator stargazer_analytical-explorer stargazer_bold-designer
  stargazer_free-healer stargazer_warm-guardian stargazer_intuitive-breaker stargazer_sensory-adventurer
  # Batch 4: 홈 카드 (4)
  home_card_garden home_card_adventure home_card_strategy home_card_stargazer
  # Batch 5: 세션 배경 (9)
  adventure-conclude-bg adventure-research-bg strategy-conclude-bg
  stargazer-enter-bg stargazer-listen-bg stargazer-research-bg
  stargazer-crystal-bg stargazer-conclude-bg stargazer-avatar
  # Batch 6: 레벨 일러스트 (15)
  adventure_level1 adventure_level2 adventure_level3 adventure_level4 adventure_level5
  garden_level1 garden_level2 garden_level3 garden_level4 garden_level5
  strategy_level1 strategy_level2 strategy_level3 strategy_level4 strategy_level5
  # Batch 7: 마케팅 (5)
  marketing_intro_1 marketing_intro_2 marketing_intro_3
  marketing_banner marketing_summary
  # Batch 8: 아이콘 (5)
  icon_v2_knot icon_v2_brush icon_v2_moon icon_v2_spiral icon_v2_venn
)

TOTAL=${#GLOBAL_NAMES[@]}

# 글로벌 인덱스 → 저장 경로 매핑
get_save_dir() {
  local idx=$1
  if [ "$idx" -lt 25 ]; then echo "$BASE_DIR/images/og"
  elif [ "$idx" -lt 36 ]; then echo "$BASE_DIR/assets/discovery"
  elif [ "$idx" -lt 44 ]; then echo "$BASE_DIR/images/personality"
  elif [ "$idx" -lt 48 ]; then echo "$BASE_DIR/images/home"
  elif [ "$idx" -lt 57 ]; then echo "$BASE_DIR/assets"
  elif [ "$idx" -lt 72 ]; then echo "$BASE_DIR/images/levels"
  elif [ "$idx" -lt 77 ]; then echo "$BASE_DIR/images/marketing"
  else echo "$BASE_DIR/icons"
  fi
}

# ── p1 호출 시퀀스 시뮬레이션 ──
# 배치 크기: 25, 11, 8, 4, 9, 15, 5, 5
# 각 p1 호출은 최대 5개, 배치 남은 수가 5 미만이면 그만큼만
BATCH_SIZES=(25 11 8 4 9 15 5 5)

# 결과: TAB_MAPPING[tab][idx] = global_index
# TAB1_GLOBALS, TAB2_GLOBALS, ... 배열로 저장
TAB1_GLOBALS=()
TAB2_GLOBALS=()
TAB3_GLOBALS=()
TAB4_GLOBALS=()
TAB5_GLOBALS=()

GLOBAL_IDX=0
for BSIZE in "${BATCH_SIZES[@]}"; do
  BATCH_SENT=0
  while [ "$BATCH_SENT" -lt "$BSIZE" ]; do
    REMAINING=$((BSIZE - BATCH_SENT))
    COUNT=5
    [ "$COUNT" -gt "$REMAINING" ] && COUNT=$REMAINING

    # 이번 p1 호출에서 탭 1~COUNT에 전송
    for T in $(seq 1 "$COUNT"); do
      case $T in
        1) TAB1_GLOBALS+=("$GLOBAL_IDX") ;;
        2) TAB2_GLOBALS+=("$GLOBAL_IDX") ;;
        3) TAB3_GLOBALS+=("$GLOBAL_IDX") ;;
        4) TAB4_GLOBALS+=("$GLOBAL_IDX") ;;
        5) TAB5_GLOBALS+=("$GLOBAL_IDX") ;;
      esac
      GLOBAL_IDX=$((GLOBAL_IDX + 1))
    done
    BATCH_SENT=$((BATCH_SENT + COUNT))
  done
done

echo ""
echo "📊 탭별 이미지 수 (시뮬레이션):"
echo "   탭1: ${#TAB1_GLOBALS[@]}장"
echo "   탭2: ${#TAB2_GLOBALS[@]}장"
echo "   탭3: ${#TAB3_GLOBALS[@]}장"
echo "   탭4: ${#TAB4_GLOBALS[@]}장"
echo "   탭5: ${#TAB5_GLOBALS[@]}장"
echo "   합계: $((${#TAB1_GLOBALS[@]} + ${#TAB2_GLOBALS[@]} + ${#TAB3_GLOBALS[@]} + ${#TAB4_GLOBALS[@]} + ${#TAB5_GLOBALS[@]}))장"
echo ""

# ── Chrome 탭에서 모든 대형 이미지 URL 추출 ──
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

# ── 메인 ──

echo "🔄 이미지 복구 v2 — 배치 경계 보정 매핑"
echo ""

# 1. 각 탭에서 이미지 URL 추출
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

for TAB in 1 2 3 4 5; do
  echo -n "   탭 $TAB 스캔 중..."
  RAW=$(get_all_images_from_tab "$TAB" 2>/dev/null || echo "")
  if [ -z "$RAW" ] || [ "$RAW" = "missing value" ]; then
    echo " ❌ 이미지 없음"
    touch "$TMP_DIR/tab${TAB}.txt"
    continue
  fi
  echo "$RAW" | tr '###' '\n' | grep -v '^$' > "$TMP_DIR/tab${TAB}.txt"
  COUNT=$(wc -l < "$TMP_DIR/tab${TAB}.txt" | tr -d ' ')
  echo " ✅ ${COUNT}장 발견"
done

echo ""

# 2. 탭별 URL 수 확인
TAB_URL_COUNTS=()
for TAB in 1 2 3 4 5; do
  C=$(wc -l < "$TMP_DIR/tab${TAB}.txt" | tr -d ' ')
  TAB_URL_COUNTS+=("$C")
done

echo "   브라우저: 탭1=${TAB_URL_COUNTS[0]}, 탭2=${TAB_URL_COUNTS[1]}, 탭3=${TAB_URL_COUNTS[2]}, 탭4=${TAB_URL_COUNTS[3]}, 탭5=${TAB_URL_COUNTS[4]}"
echo "   시뮬레이션: 탭1=${#TAB1_GLOBALS[@]}, 탭2=${#TAB2_GLOBALS[@]}, 탭3=${#TAB3_GLOBALS[@]}, 탭4=${#TAB4_GLOBALS[@]}, 탭5=${#TAB5_GLOBALS[@]}"
echo ""

# 3. 정확한 매핑으로 다운로드
echo "📥 다운로드 시작 (배치 경계 보정 매핑)..."
echo ""

SAVED=0
FAILED=0

# 탭 파일에서 N번째(1-indexed) URL 읽기
get_url_from_tab() {
  local tab=$1 line=$2
  sed -n "${line}p" "$TMP_DIR/tab${tab}.txt"
}

download_tab() {
  local tab_num=$1
  shift
  local globals=("$@")
  local url_count=${TAB_URL_COUNTS[$((tab_num - 1))]}
  local global_count=${#globals[@]}
  local count=$global_count
  [ "$count" -gt "$url_count" ] && count=$url_count

  for i in $(seq 0 $((count - 1))); do
    local gidx=${globals[$i]}
    local url
    url=$(get_url_from_tab "$tab_num" "$((i + 1))")
    local name="${GLOBAL_NAMES[$gidx]}"
    local dir
    dir=$(get_save_dir "$gidx")

    mkdir -p "$dir"
    curl -sL "$url" -o "$dir/${name}.png" 2>/dev/null

    if [ -s "$dir/${name}.png" ]; then
      echo "   ✅ #$((gidx+1)) ${name}.png (탭${tab_num}[$i])"
      SAVED=$((SAVED + 1))
    else
      echo "   ❌ #$((gidx+1)) ${name} 다운로드 실패"
      rm -f "$dir/${name}.png"
      FAILED=$((FAILED + 1))
    fi
  done

  # URL 부족한 경우
  if [ "$url_count" -lt "$global_count" ]; then
    for i in $(seq "$url_count" $((global_count - 1))); do
      local gidx=${globals[$i]}
      local name="${GLOBAL_NAMES[$gidx]}"
      echo "   ⚠️  #$((gidx+1)) ${name} — 탭${tab_num} 이미지 부족 (${url_count}/${global_count})"
      FAILED=$((FAILED + 1))
    done
  fi
}

echo "── 탭 1 (${#TAB1_GLOBALS[@]}장) ──"
download_tab 1 "${TAB1_GLOBALS[@]}"
echo ""
echo "── 탭 2 (${#TAB2_GLOBALS[@]}장) ──"
download_tab 2 "${TAB2_GLOBALS[@]}"
echo ""
echo "── 탭 3 (${#TAB3_GLOBALS[@]}장) ──"
download_tab 3 "${TAB3_GLOBALS[@]}"
echo ""
echo "── 탭 4 (${#TAB4_GLOBALS[@]}장) ──"
download_tab 4 "${TAB4_GLOBALS[@]}"
echo ""
echo "── 탭 5 (${#TAB5_GLOBALS[@]}장) ──"
download_tab 5 "${TAB5_GLOBALS[@]}"

echo ""
echo "════════════════════════════"
echo "✅ 저장: ${SAVED}장  |  ❌ 실패: ${FAILED}장  |  전체: ${TOTAL}장"
echo "════════════════════════════"
echo ""

if [ "$FAILED" -gt 0 ]; then
  echo "⚠️  실패한 이미지는 재생성 필요"
fi
