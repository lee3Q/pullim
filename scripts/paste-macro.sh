#!/bin/bash
# 복붙 매크로 — 이미지 프롬프트 자동 전송 + 자동 저장
#
#   p               다음 프롬프트 전송 (기본: Chrome)
#   p arc/safari     다른 브라우저
#   ps              다운로드에서 최근 이미지 → 자동 저장
#   p watch         다운로드 폴더 감시 → 자동 저장 (Ctrl+C로 중지)
#   p status        진행 상황
#   p reset         처음부터 다시
#   p skip          현재 건너뛰기
#   p undo          직전 되돌리기 (전송/저장 구분)
#   p peek          다음 프롬프트 미리보기
#
# alias 설정 (.zshrc):
#   alias p='bash ~/study/main/pullim/scripts/paste-macro.sh'
#   alias ps='bash ~/study/main/pullim/scripts/paste-macro.sh save'

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPTS_FILE="$SCRIPT_DIR/prompts.txt"
SENT_FILE="$SCRIPT_DIR/.queue-sent"
SAVED_FILE="$SCRIPT_DIR/.queue-saved"
SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/personality"
DOWNLOADS_DIR="$HOME/Downloads"
PROCESSED_FILE="$SCRIPT_DIR/.queue-processed"

NAMES=(
  adventure_quiet-strategist adventure_empathic-deliberator adventure_analytical-explorer adventure_bold-designer
  adventure_free-healer adventure_warm-guardian adventure_intuitive-breaker adventure_sensory-adventurer
  garden_quiet-strategist garden_empathic-deliberator garden_analytical-explorer garden_bold-designer
  garden_free-healer garden_warm-guardian garden_intuitive-breaker garden_sensory-adventurer
  strategy_quiet-strategist strategy_empathic-deliberator strategy_analytical-explorer strategy_bold-designer
  strategy_free-healer strategy_warm-guardian strategy_intuitive-breaker strategy_sensory-adventurer
)
TOTAL=${#NAMES[@]}

get_chrome_image_url() {
osascript <<'ASCRIPT'
tell application "Google Chrome"
set imgUrl to execute front window's active tab javascript "
(function() {
var imgs = document.querySelectorAll('img');
var found = '';
for (var i = imgs.length - 1; i >= 0; i--) {
  if (imgs[i].src && imgs[i].naturalWidth > 200 && imgs[i].src.indexOf('data:') !== 0) {
    found = imgs[i].src; break;
  }
}
return found;
})();
"
return imgUrl
end tell
ASCRIPT
}

theme_label() {
  case "$1" in
    garden_*)    echo "🌙 달빛정원" ;;
    adventure_*) echo "⚔️  모험가" ;;
    strategy_*)  echo "📊 전략실" ;;
  esac
}

get_sent()  { [ -f "$SENT_FILE" ]  && cat "$SENT_FILE"  || echo 0; }
get_saved() { [ -f "$SAVED_FILE" ] && cat "$SAVED_FILE" || echo 0; }
set_sent()  { echo "$1" > "$SENT_FILE"; }
set_saved() { echo "$1" > "$SAVED_FILE"; }

# 이전 progress 파일 마이그레이션
if [ -f "$SCRIPT_DIR/.queue-progress" ] && [ ! -f "$SENT_FILE" ]; then
  cp "$SCRIPT_DIR/.queue-progress" "$SENT_FILE"
  cp "$SCRIPT_DIR/.queue-progress" "$SAVED_FILE"
fi

get_prompt() {
  grep -v '^---$' "$PROMPTS_FILE" | sed -n "$((${1} + 1))p"
}

paste_to_browser() {
  local app
  case "${1:-chrome}" in
    chrome)  app="Google Chrome" ;;
    arc)     app="Arc" ;;
    safari)  app="Safari" ;;
    *)       echo "❌ 지원: chrome, arc, safari"; exit 1 ;;
  esac
  osascript <<EOF
tell application "$app" to activate
delay 0.7
tell application "System Events"
  keystroke "v" using command down
  delay 0.5
  keystroke return
end tell
EOF
}

# 다운로드 폴더에서 최근 이미지 찾기
find_latest_image() {
  local since="${1:-5}"  # N분 이내
  find "$DOWNLOADS_DIR" -maxdepth 1 \( -name "*.png" -o -name "*.webp" -o -name "*.jpg" -o -name "*.jpeg" \) -mmin -"$since" -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1
}

# 아직 처리 안 된 새 이미지 찾기 (watch용)
find_new_image() {
  local candidates
  candidates=$(find "$DOWNLOADS_DIR" -maxdepth 1 \( -name "*.png" -o -name "*.webp" -o -name "*.jpg" -o -name "*.jpeg" \) -mmin -60 -print0 2>/dev/null | xargs -0 ls -tr 2>/dev/null)
  [ -z "$candidates" ] && return

  local processed=""
  [ -f "$PROCESSED_FILE" ] && processed=$(cat "$PROCESSED_FILE")

  while IFS= read -r f; do
    local bn
    bn=$(basename "$f")
    if [ -z "$processed" ] || ! echo "$processed" | grep -qF "$bn"; then
      echo "$f"
      return 0
    fi
  done <<< "$candidates"
}

do_save_image() {
  local image_path="$1"
  local saved
  saved=$(get_saved)

  if [ "$saved" -ge "$TOTAL" ]; then
    echo "🎉 전부 저장 완료!"; return 1
  fi

  local name="${NAMES[$saved]}"
  local ext="${image_path##*.}"
  local dest="$SAVE_DIR/${name}.${ext}"

  mkdir -p "$SAVE_DIR"
  mv "$image_path" "$dest"
  set_saved $((saved + 1))

  local theme
  theme=$(theme_label "$name")
  echo "✅ ${theme} ${name}.${ext} 저장! ($((saved + 1))/$TOTAL)"
}

show_status() {
  local sent saved
  sent=$(get_sent)
  saved=$(get_saved)
  echo ""
  echo "📊 전송: $sent / $TOTAL  |  저장: $saved / $TOTAL"
  echo ""

  local current_theme=""
  for i in "${!NAMES[@]}"; do
    local name="${NAMES[$i]}"
    local theme
    theme=$(theme_label "$name")

    if [ "$theme" != "$current_theme" ]; then
      current_theme="$theme"
      echo "  $theme"
    fi

    if [ "$i" -lt "$saved" ]; then
      echo "    ✅ $name"
    elif [ "$i" -lt "$sent" ]; then
      echo "    ⏳ $name (전송됨, 저장 대기)"
    elif [ "$i" -eq "$sent" ]; then
      echo "    👉 $name ← 다음 전송"
    else
      echo "    ⬜ $name"
    fi
  done

  if [ "$saved" -ge "$TOTAL" ]; then
    echo ""
    echo "🎉 전부 완료!"
  fi
  echo ""
}

# ── 메인 ──

CMD="${1:-}"

case "$CMD" in
  status)
    show_status
    exit 0
    ;;
  reset)
    set_sent 0
    set_saved 0
    > "$PROCESSED_FILE" 2>/dev/null || true
    echo "🔄 리셋. 처음부터."
    exit 0
    ;;
  skip)
    IDX=$(get_sent)
    if [ "$IDX" -ge "$TOTAL" ]; then
      echo "✅ 전부 완료."; exit 0
    fi
    set_sent $((IDX + 1))
    set_saved $(($(get_saved) + 1))
    echo "⏭️  ${NAMES[$IDX]} 건너뜀."
    exit 0
    ;;
  undo)
    SENT=$(get_sent)
    SAVED=$(get_saved)
    if [ "$SENT" -le 0 ]; then
      echo "⚠️  되돌릴 게 없음."; exit 0
    fi
    if [ "$SENT" -gt "$SAVED" ]; then
      set_sent $((SENT - 1))
      echo "↩️  전송 되돌림. 다음 전송: ${NAMES[$((SENT - 1))]}"
    else
      set_sent $((SENT - 1))
      set_saved $((SAVED - 1))
      echo "↩️  전송+저장 되돌림. 다음: ${NAMES[$((SENT - 1))]}"
    fi
    exit 0
    ;;
  goto)
    TARGET="${2:-}"
    if [ -z "$TARGET" ]; then
      echo "사용법: p goto N  (예: p goto 3 → garden_3부터)"
      echo "        p goto adventure_1 → 모험가 처음부터"
      exit 1
    fi
    # 숫자면 인덱스, 이름이면 검색
    if [[ "$TARGET" =~ ^[0-9]+$ ]]; then
      IDX=$((TARGET - 1))
    else
      IDX=-1
      for i in "${!NAMES[@]}"; do
        if [ "${NAMES[$i]}" = "$TARGET" ]; then
          IDX=$i; break
        fi
      done
    fi
    if [ "$IDX" -lt 0 ] || [ "$IDX" -ge "$TOTAL" ]; then
      echo "❌ 잘못된 대상: $TARGET (1~$TOTAL 또는 이름)"
      exit 1
    fi
    set_sent "$IDX"
    set_saved "$IDX"
    echo "🎯 ${NAMES[$IDX]}부터 다시 시작 (#$((IDX + 1))/$TOTAL)"
    exit 0
    ;;
  dl)
    SAVED=$(get_saved)
    SENT=$(get_sent)
    if [ "$SAVED" -ge "$SENT" ]; then
      echo "⚠️  저장할 게 없음. p로 전송 먼저!"; exit 1
    fi
    NAME="${NAMES[$SAVED]}"
    THEME=$(theme_label "$NAME")

    # Chrome에서 최신 생성 이미지 URL 추출
    IMG_URL=$(get_chrome_image_url)

    if [ -z "$IMG_URL" ] || [ "$IMG_URL" = "missing value" ]; then
      echo "❌ Chrome에서 이미지 못 찾음. 이미지 생성 완료됐는지 확인!"
      exit 1
    fi

    mkdir -p "$SAVE_DIR"
    curl -sL "$IMG_URL" -o "$SAVE_DIR/${NAME}.png"

    if [ -s "$SAVE_DIR/${NAME}.png" ]; then
      set_saved $((SAVED + 1))
      echo "✅ $THEME  ${NAME}.png 저장! ($((SAVED + 1))/$TOTAL)"
    else
      rm -f "$SAVE_DIR/${NAME}.png"
      echo "❌ 다운로드 실패. URL: ${IMG_URL:0:80}..."
      exit 1
    fi
    exit 0
    ;;
  peek)
    IDX=$(get_sent)
    if [ "$IDX" -ge "$TOTAL" ]; then
      echo "✅ 전부 완료."; exit 0
    fi
    echo ""
    echo "👀 다음 (#$((IDX + 1))/$TOTAL): $(theme_label "${NAMES[$IDX]}")  ${NAMES[$IDX]}"
    echo ""
    get_prompt "$IDX"
    echo ""
    exit 0
    ;;
  save)
    SAVED=$(get_saved)
    if [ "$SAVED" -ge "$(get_sent)" ]; then
      echo "⚠️  저장할 게 없음. 먼저 p로 전송!"; exit 1
    fi
    LATEST=$(find_latest_image 10)
    if [ -z "$LATEST" ]; then
      echo "❌ 다운로드 폴더에 최근 이미지 없음. 이미지 다운로드 먼저!"
      exit 1
    fi
    do_save_image "$LATEST"
    basename "$LATEST" >> "$PROCESSED_FILE"
    exit 0
    ;;
  watch)
    echo ""
    echo "👀 다운로드 폴더 감시 중... (Ctrl+C로 중지)"
    echo "   이미지 다운로드하면 자동 저장됨"
    echo ""
    trap 'echo ""; echo "감시 종료."; exit 0' INT
    while true; do
      SAVED=$(get_saved)
      if [ "$SAVED" -ge "$TOTAL" ]; then
        echo "🎉 33장 전부 저장 완료!"
        exit 0
      fi
      LATEST=$(find_new_image)
      if [ -n "$LATEST" ]; then
        # 다운로드 완료 대기 (파일 크기 안정화)
        sleep 1
        SIZE1=$(stat -f%z "$LATEST" 2>/dev/null || echo 0)
        sleep 1
        SIZE2=$(stat -f%z "$LATEST" 2>/dev/null || echo 0)
        if [ "$SIZE1" = "$SIZE2" ] && [ "$SIZE1" != "0" ]; then
          do_save_image "$LATEST"
          basename "$LATEST" >> "$PROCESSED_FILE"
        fi
      fi
      sleep 2
    done
    ;;
  help|-h|--help)
    sed -n '2,16p' "$0"
    exit 0
    ;;
esac

# 기본: 다음 프롬프트 전송
BROWSER="${CMD:-chrome}"
IDX=$(get_sent)

if [ "$IDX" -ge "$TOTAL" ]; then
  echo "🎉 전부 전송 완료! ($TOTAL/$TOTAL)"
  echo "   남은 저장: $((TOTAL - $(get_saved)))개"
  exit 0
fi

PROMPT=$(get_prompt "$IDX")
NAME="${NAMES[$IDX]}"
THEME=$(theme_label "$NAME")

if [ -z "$PROMPT" ]; then
  echo "❌ 프롬프트 읽기 실패 (인덱스: $IDX)"; exit 1
fi

echo -n "$PROMPT" | pbcopy
paste_to_browser "$BROWSER"
set_sent $((IDX + 1))

echo ""
echo "📋 전송! ($((IDX + 1))/$TOTAL)"
echo "   $THEME  $NAME"
echo ""
if [ $((IDX + 1)) -lt "$TOTAL" ]; then
  NEXT="${NAMES[$((IDX + 1))]}"
  echo "   다음: $(theme_label "$NEXT")  $NEXT"
  echo ""
fi
