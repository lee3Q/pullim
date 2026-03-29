#!/bin/bash
# v3 나머지 12장 — 탭 열기 + 전송 + 복구
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$SCRIPT_DIR/../pullim/public/images/v3"
URL="https://u-hs.elice.io/ai-helpy-chat"

NAMES=(
  stargazer_level2 stargazer_level5
  crystal_magnify crystal_puzzle crystal_compass
  summary_adventure summary_strategy summary_stargazer
  bg_onboarding bg_achievement bg_settings
  marketing_summary_v2
)

PROMPTS=(
  "Cosmic illustration style, dark background, growing starlight glow, mobile app card size 4:3 ratio, no text. Star charts spread across a desk with patterns being traced by candlelight. Connections forming. Warm amber lines on indigo maps. Level 2: observing patterns."
  "Cosmic illustration style, dark background, warm dawn cosmic glow, mobile app card size 4:3 ratio, no text. Standing at the observatory dome opening, dawn breaking with the last bright star (Venus) visible. Clear direction found. Warm gold horizon against fading stars. Level 5: decision."
  "Soft illustration style, dark background (#12101a), warm analytical glow, square 1:1 ratio, no text. A magnifying glass hovering over a map, the area under the lens glowing brighter and revealing hidden details. Deep investigation feeling. Warm gold lens glow against cool blue map."
  "Soft illustration style, dark background (#12101a), interconnected glow, square 1:1 ratio, no text. Multiple floating puzzle pieces with edges glowing, slowly drifting toward each other as if magnetized. Connections forming feeling. Warm gold edges against deep purple space."
  "Soft illustration style, dark background (#12101a), decisive glow, square 1:1 ratio, no text. A compass rose with one direction glowing brighter than the others, settled and certain. Direction found feeling. Bright gold north against subtle silver other directions."
  "Soft illustration style, dark background (#12101a), magical glow, 16:9 landscape ratio, no text. A wide enchanted forest scene at golden hour with a path that has been clearly walked, footprints glowing faintly. A completed journey through the adventure world. Warm amber and deep green. Session summary card background."
  "Clean digital art, dark background (#12101a), ambient professional glow, 16:9 landscape ratio, no text. A wide modern office at sunrise, screens off, a completed strategy document on the desk, city awakening outside the window. A completed journey through the strategy world. Cool blue to warm morning. Session summary card background."
  "Cosmic illustration style, dark background (#12101a), dawn cosmic glow, 16:9 landscape ratio, no text. A wide observatory terrace at dawn, telescope resting, the last constellation fading as warm sunrise fills the sky. Stars and sun coexisting. A completed journey through the stargazer world. Deep indigo to warm gold. Session summary card background."
  "Soft illustration style, dark background (#12101a), warm welcoming glow, 9:16 vertical full screen ratio, no text. A winding path through three different landscapes merging seamlessly — garden flowers, forest trees, and city lights — leading toward a warm glowing doorway in the distance. First-time welcome and onboarding feeling. Inviting and safe."
  "Soft illustration style, dark background (#12101a), celebratory warm glow, square 1:1 ratio, no text. A treasure chest opening with warm golden light and sparkles flowing upward, small gems floating gently. Positive achievement moment. Something wonderful unlocked feeling. Gold and warm purple tones."
  "Soft illustration style, dark background (#12101a), calm ambient glow, 9:16 vertical full screen ratio, no text. A cozy study nook with a small desk, warm lamp, and a window showing a starry night. Personal and intimate. Your space feeling for profile and settings. Warm amber lamp against cool starry window."
  "Soft illustration style, dark background (#12101a), warm inviting glow, square 1:1 ratio, no text. A single glowing doorway standing alone in complete darkness, warm golden light spilling out invitingly through the open door. Simple but compelling come discover yourself feeling. Minimal composition. Gold and deep purple tones."
)

TOTAL=${#NAMES[@]}

echo ""
echo "🤖 v3 나머지 ${TOTAL}장 — 탭 열기 + 전송 + 복구"
echo ""

# ══ Phase 0: Chrome 탭 5개 열기 ══
echo "═══ Phase 0: Chrome 탭 열기 ═══"
osascript <<ASCRIPT
tell application "Google Chrome"
  activate
  -- 기존 탭 닫고 새로 열기
  tell front window
    set URL of active tab to "$URL"
    repeat 4 times
      make new tab with properties {URL:"$URL"}
    end repeat
  end tell
end tell
ASCRIPT
echo "   ✅ 5탭 열림 ($URL)"
echo "   ⏳ 10초 대기 (페이지 로드)..."
sleep 10

# ══ Phase 1: 전송 ══
echo ""
echo "═══ Phase 1: 프롬프트 전송 ═══"
echo ""

IDX=0
CYCLE=0
while [ "$IDX" -lt "$TOTAL" ]; do
  REMAINING=$((TOTAL - IDX))
  COUNT=5
  [ "$COUNT" -gt "$REMAINING" ] && COUNT=$REMAINING
  CYCLE=$((CYCLE + 1))

  echo "   사이클 ${CYCLE}: ${COUNT}개 (탭 1~${COUNT})"

  for i in $(seq 0 $((COUNT - 1))); do
    CUR=$((IDX + i))
    NAME="${NAMES[$CUR]}"
    PROMPT="${PROMPTS[$CUR]}"
    TAGGED="[${NAME}] ${PROMPT}"
    TAB=$((i + 1))

    echo -n "$TAGGED" | pbcopy
    osascript <<ASCRIPT
tell application "Google Chrome"
  activate
  tell front window
    set active tab index to $TAB
  end tell
end tell
delay 1.5
tell application "System Events"
  keystroke "v" using command down
  delay 0.8
  keystroke return
end tell
ASCRIPT
    echo "     탭${TAB}: ${NAME} ✓"
    sleep 2
  done

  IDX=$((IDX + COUNT))
  echo "   (${IDX}/${TOTAL})"
  if [ "$IDX" -lt "$TOTAL" ]; then
    echo "   ⏳ 60초 대기..."
    sleep 60
  fi
  echo ""
done

echo "✅ 전송 완료!"

# ══ Phase 2: 대기 ══
echo ""
echo "═══ Phase 2: 대기 ═══"
echo "   모든 탭 이미지 생성 완료 + 맨 아래 스크롤 후 Enter..."
read -r

# ══ Phase 3: 복구 ══
echo ""
echo "═══ Phase 3: 복구 ═══"

mkdir -p "$BASE_DIR"

# 12장: 사이클 패턴 5,5,2 → tab별 이미지 수
# 사이클1: tab1-5 (indices 0-4)
# 사이클2: tab1-5 (indices 5-9)
# 사이클3: tab1-2 (indices 10-11)
# tab1: 0,5,10 / tab2: 1,6,11 / tab3: 2,7 / tab4: 3,8 / tab5: 4,9
TAB_MAP_1="0 5 10"
TAB_MAP_2="1 6 11"
TAB_MAP_3="2 7"
TAB_MAP_4="3 8"
TAB_MAP_5="4 9"

SAVED=0 FAILED=0
TMP_DIR=$(mktemp -d)
trap "rm -rf $TMP_DIR" EXIT

# 각 탭에서 URL 추출
for TAB in 1 2 3 4 5; do
  osascript -e "tell application \"Google Chrome\" to tell front window to set active tab index to $TAB"
  sleep 0.5
  RAW=$(osascript -e 'tell application "Google Chrome" to set r to execute front window'\''s active tab javascript "(function(){var imgs=document.querySelectorAll('"'"'img'"'"');var u=[];for(var i=0;i<imgs.length;i++){var img=imgs[i];if(!img.src||img.src.indexOf('"'"'data:'"'"')===0)continue;if(img.naturalWidth>=400&&img.naturalHeight>=400)u.push(img.src);}return u.join('"'"'###'"'"');})();"' 2>/dev/null || echo "")
  echo "$RAW" | tr '###' '\n' | grep -v '^$' > "$TMP_DIR/tab${TAB}.txt"
  C=$(wc -l < "$TMP_DIR/tab${TAB}.txt" | tr -d ' ')
  echo "   탭${TAB}: ${C}장"
done

# 매핑: tab1=[0,5,10] tab2=[1,6,11] tab3=[2,7] tab4=[3,8] tab5=[4,9]
echo ""
for PAIR in "1:0:5:10" "2:1:6:11" "3:2:7" "4:3:8" "5:4:9"; do
  TAB=$(echo "$PAIR" | cut -d: -f1)
  INDICES=$(echo "$PAIR" | cut -d: -f2-)
  IMG_IDX=0
  for GIDX in $(echo "$INDICES" | tr ':' ' '); do
    NAME="${NAMES[$GIDX]}"
    LINE=$((IMG_IDX + 1))
    URL=$(sed -n "${LINE}p" "$TMP_DIR/tab${TAB}.txt")
    if [ -n "$URL" ]; then
      curl -sL "$URL" -o "$BASE_DIR/${NAME}.png" 2>/dev/null
      if [ -s "$BASE_DIR/${NAME}.png" ]; then
        echo "   ✅ ${NAME}.png (탭${TAB}[$IMG_IDX])"
        SAVED=$((SAVED + 1))
      else
        echo "   ❌ ${NAME} 실패"; rm -f "$BASE_DIR/${NAME}.png"
        FAILED=$((FAILED + 1))
      fi
    else
      echo "   ⚠️  ${NAME} — 탭${TAB} 이미지 부족"
      FAILED=$((FAILED + 1))
    fi
    IMG_IDX=$((IMG_IDX + 1))
  done
done

echo ""
echo "════════════════════════════"
echo "✅ 저장: ${SAVED}장  |  ❌ 실패: ${FAILED}장  |  전체: ${TOTAL}장"
echo "════════════════════════════"
