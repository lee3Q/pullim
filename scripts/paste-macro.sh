#!/bin/bash
# 복붙 매크로 v2 — 이미지 프롬프트 자동 전송 + 자동 저장
#
#   p               다음 프롬프트 전송 (기본: Chrome)
#   p arc/safari     다른 브라우저
#   ps              다운로드에서 최근 이미지 → 자동 저장
#   p dl            Chrome에서 이미지 URL 직접 다운로드+저장
#   p watch         다운로드 폴더 감시 → 자동 저장 (Ctrl+C로 중지)
#   p status        진행 상황
#   p reset         처음부터 다시
#   p skip          현재 건너뛰기
#   p undo          직전 되돌리기 (전송/저장 구분)
#   p peek          다음 프롬프트 미리보기
#   p goto N        특정 번호/이름으로 이동
#   p review        저장된 이미지 목록 + 프롬프트 대조 출력
#   p check N       특정 번호의 이미지 열기 + 프롬프트 표시
#   p force         lockstep 경고 무시하고 다음 전송
#   p batch N       현재 배치를 N번으로 전환 (NAMES/SAVE_DIR 자동 변경)
#
# alias 설정 (.zshrc):
#   alias p='bash ~/study/main/pullim/scripts/paste-macro.sh'
#   alias ps='bash ~/study/main/pullim/scripts/paste-macro.sh save'

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPTS_FILE="$SCRIPT_DIR/prompts.txt"
SENT_FILE="$SCRIPT_DIR/.queue-sent"
SAVED_FILE="$SCRIPT_DIR/.queue-saved"
DOWNLOADS_DIR="$HOME/Downloads"
PROCESSED_FILE="$SCRIPT_DIR/.queue-processed"
MANIFEST_FILE="$SCRIPT_DIR/.queue-manifest.md"
BATCH_FILE="$SCRIPT_DIR/.queue-batch"

# ── 배치 설정 ──
# 현재 배치 번호 읽기 (기본: 1)
get_batch() { [ -f "$BATCH_FILE" ] && cat "$BATCH_FILE" || echo 1; }

load_batch_config() {
  local batch
  batch=$(get_batch)
  case "$batch" in
    1) # OG 소셜 공유 카드
      SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/og"
      NAMES=(
        og_main
        og_adventure_quiet-strategist og_adventure_empathic-deliberator og_adventure_analytical-explorer og_adventure_bold-designer
        og_adventure_free-healer og_adventure_warm-guardian og_adventure_intuitive-breaker og_adventure_sensory-adventurer
        og_garden_quiet-strategist og_garden_empathic-deliberator og_garden_analytical-explorer og_garden_bold-designer
        og_garden_free-healer og_garden_warm-guardian og_garden_intuitive-breaker og_garden_sensory-adventurer
        og_strategy_quiet-strategist og_strategy_empathic-deliberator og_strategy_analytical-explorer og_strategy_bold-designer
        og_strategy_free-healer og_strategy_warm-guardian og_strategy_intuitive-breaker og_strategy_sensory-adventurer
      )
      BATCH_LABEL="Batch 1: OG 공유 카드"
      PROMPT_OFFSET=0
      ;;
    2) # 천문대 파악 장면
      SAVE_DIR="$SCRIPT_DIR/../pullim/public/assets/discovery"
      NAMES=(
        stargazer_1 stargazer_2 stargazer_3 stargazer_4 stargazer_5
        stargazer_6 stargazer_7 stargazer_8 stargazer_9 stargazer_10
        stargazer_outro
      )
      BATCH_LABEL="Batch 2: 천문대 파악 장면"
      PROMPT_OFFSET=25
      ;;
    3) # 천문대 캐릭터
      SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/personality"
      NAMES=(
        stargazer_quiet-strategist stargazer_empathic-deliberator stargazer_analytical-explorer stargazer_bold-designer
        stargazer_free-healer stargazer_warm-guardian stargazer_intuitive-breaker stargazer_sensory-adventurer
      )
      BATCH_LABEL="Batch 3: 천문대 캐릭터"
      PROMPT_OFFSET=36
      ;;
    4) # 홈 테마 카드
      SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/home"
      NAMES=(
        home_card_garden home_card_adventure home_card_strategy home_card_stargazer
      )
      BATCH_LABEL="Batch 4: 홈 테마 카드"
      PROMPT_OFFSET=44
      ;;
    5) # 세션 배경 보강
      SAVE_DIR="$SCRIPT_DIR/../pullim/public/assets"
      NAMES=(
        adventure-conclude-bg adventure-research-bg strategy-conclude-bg
        stargazer-enter-bg stargazer-listen-bg stargazer-research-bg
        stargazer-crystal-bg stargazer-conclude-bg stargazer-avatar
      )
      BATCH_LABEL="Batch 5: 세션 배경"
      PROMPT_OFFSET=48
      ;;
    6) # 레벨 일러스트
      SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/levels"
      NAMES=(
        adventure_level1 adventure_level2 adventure_level3 adventure_level4 adventure_level5
        garden_level1 garden_level2 garden_level3 garden_level4 garden_level5
        strategy_level1 strategy_level2 strategy_level3 strategy_level4 strategy_level5
      )
      BATCH_LABEL="Batch 6: 레벨 일러스트"
      PROMPT_OFFSET=57
      ;;
    7) # 마케팅
      SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/marketing"
      NAMES=(
        marketing_intro_1 marketing_intro_2 marketing_intro_3
        marketing_banner marketing_summary
      )
      BATCH_LABEL="Batch 7: 마케팅"
      PROMPT_OFFSET=72
      ;;
    8) # 앱 아이콘
      SAVE_DIR="$SCRIPT_DIR/../pullim/public/icons"
      NAMES=(
        icon_v2_knot icon_v2_brush icon_v2_moon icon_v2_spiral icon_v2_venn
      )
      BATCH_LABEL="Batch 8: 앱 아이콘"
      PROMPT_OFFSET=77
      ;;
    9) # v3 나머지 (12장)
      SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/v3"
      NAMES=(
        stargazer_level2 stargazer_level5
        crystal_magnify crystal_puzzle crystal_compass
        summary_adventure summary_strategy summary_stargazer
        bg_onboarding bg_achievement bg_settings
        marketing_summary_v2
      )
      BATCH_LABEL="Batch 9: v3 나머지"
      PROMPT_OFFSET=0
      ;;
    10) # 아포칼립스 누락 + 랜딩 (13장)
      SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/v4"
      NAMES=(
        home_card_apocalypse
        apocalypse-session-enter-bg apocalypse-listen-bg apocalypse-research-bg
        apocalypse-conclude-bg apocalypse-complete-bg apocalypse-avatar apocalypse-enter-bg
        landing_1 landing_2 landing_3 landing_4 landing_5
      )
      BATCH_LABEL="Batch 10: 아포칼립스 누락 + 랜딩"
      PROMPT_OFFSET=0
      ;;
    *)
      echo "❌ 배치 $batch 없음 (1~10)"; exit 1 ;;
  esac
  TOTAL=${#NAMES[@]}
}

load_batch_config

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

get_chrome_image_url() {
osascript <<'ASCRIPT'
tell application "Google Chrome"
set imgUrl to execute front window's active tab javascript "
(function() {
var imgs = document.querySelectorAll('img');
var best = '';
var bestArea = 0;
for (var i = 0; i < imgs.length; i++) {
  var img = imgs[i];
  if (!img.src || img.src.indexOf('data:') === 0) continue;
  var area = img.naturalWidth * img.naturalHeight;
  if (area > bestArea && img.naturalWidth >= 400 && img.naturalHeight >= 400) {
    bestArea = area;
    best = img.src;
  }
}
return best;
})();
"
return imgUrl
end tell
ASCRIPT
}

theme_label() {
  case "$1" in
    og_main)         echo "🖼️  OG 메인" ;;
    og_adventure_*)  echo "⚔️  OG 모험" ;;
    og_garden_*)     echo "🌙 OG 정원" ;;
    og_strategy_*)   echo "📊 OG 전략" ;;
    stargazer_[0-9]*|stargazer_outro) echo "🔭 천문대 장면" ;;
    stargazer_*)     echo "🔭 천문대 캐릭터" ;;
    home_card_*)     echo "🏠 홈 카드" ;;
    adventure-*|adventure_level*) echo "⚔️  모험" ;;
    garden-*|garden_level*)       echo "🌙 정원" ;;
    strategy-*|strategy_level*)   echo "📊 전략" ;;
    marketing_*)     echo "📣 마케팅" ;;
    icon_*)          echo "📱 아이콘" ;;
    *)               echo "📦" ;;
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
  local global_idx=$(( PROMPT_OFFSET + ${1} ))
  # prompts.txt에서 ---로 구분된 N번째 프롬프트 추출
  awk -v n="$global_idx" 'BEGIN{c=0} /^---$/{c++; next} c==n{print; found=1} c>n{exit} END{if(!found) exit 1}' "$PROMPTS_FILE"
}

get_prompt_preview() {
  local prompt
  prompt=$(get_prompt "$1" 2>/dev/null || echo "(프롬프트 없음)")
  echo "${prompt:0:80}..."
}

# ── 매니페스트 로그 ──
log_manifest() {
  local name="$1" prompt_preview="$2" file_path="$3"
  local timestamp
  timestamp=$(date '+%Y-%m-%d %H:%M')
  if [ ! -f "$MANIFEST_FILE" ]; then
    echo "# Image-Prompt Manifest" > "$MANIFEST_FILE"
    echo "" >> "$MANIFEST_FILE"
    echo "| # | 시각 | 파일명 | 프롬프트 (80자) | 경로 |" >> "$MANIFEST_FILE"
    echo "|---|------|--------|----------------|------|" >> "$MANIFEST_FILE"
  fi
  local saved
  saved=$(get_saved)
  echo "| $saved | $timestamp | $name | ${prompt_preview:0:60} | $file_path |" >> "$MANIFEST_FILE"
}

# ── Lockstep 경고 (차단 아님) ──
check_lockstep() {
  local sent saved
  sent=$(get_sent)
  saved=$(get_saved)
  local gap=$((sent - saved))
  if [ "$gap" -ge 3 ]; then
    echo "   ⚠️  미저장 ${gap}개 — 순서 밀릴 수 있음! (ps/p dl/p watch로 저장)"
  fi
  return 0
}

# ── 저장 시 확인 출력 ──
do_save_image() {
  local image_path="$1"
  local saved
  saved=$(get_saved)

  if [ "$saved" -ge "$TOTAL" ]; then
    echo "🎉 이 배치 전부 저장 완료!"; return 1
  fi

  local name="${NAMES[$saved]}"
  local ext="${image_path##*.}"
  local dest="$SAVE_DIR/${name}.${ext}"

  mkdir -p "$SAVE_DIR"
  mv "$image_path" "$dest"

  # 프롬프트 미리보기
  local prompt_preview
  prompt_preview=$(get_prompt_preview "$saved")

  set_saved $((saved + 1))

  local theme
  theme=$(theme_label "$name")

  echo ""
  echo "✅ 저장 완료! ($((saved + 1))/$TOTAL)"
  echo "   $theme  ${name}.${ext}"
  echo "   📋 프롬프트: $prompt_preview"
  echo "   📂 경로: $dest"
  echo ""

  # 매니페스트 로그
  log_manifest "$name" "$prompt_preview" "$dest"

  # 다음 안내
  if [ $((saved + 1)) -lt "$TOTAL" ]; then
    local next="${NAMES[$((saved + 1))]}"
    echo "   다음 저장 대기: $(theme_label "$next")  $next"
  else
    echo "   🎉 이 배치 완료! 다음 배치: p batch $(($(get_batch) + 1))"
  fi
  echo ""
}

show_status() {
  local sent saved batch
  sent=$(get_sent)
  saved=$(get_saved)
  batch=$(get_batch)
  echo ""
  echo "📊 [$BATCH_LABEL] 전송: $sent/$TOTAL  |  저장: $saved/$TOTAL"
  echo ""

  for i in "${!NAMES[@]}"; do
    local name="${NAMES[$i]}"
    local theme
    theme=$(theme_label "$name")

    if [ "$i" -lt "$saved" ]; then
      echo "    ✅ $name"
    elif [ "$i" -lt "$sent" ]; then
      echo "    ⏳ $name (전송됨, 저장 대기)"
    elif [ "$i" -eq "$sent" ]; then
      echo "    👉 $name ← 다음"
    else
      echo "    ⬜ $name"
    fi
  done

  if [ "$saved" -ge "$TOTAL" ]; then
    echo ""
    local next_batch=$((batch + 1))
    if [ "$next_batch" -le 9 ]; then
      echo "🎉 배치 $batch 완료! 다음: p batch $next_batch"
    else
      echo "🎉 전체 완료!"
    fi
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
  batch)
    NEW_BATCH="${2:-}"
    if [ -z "$NEW_BATCH" ] || [ "$NEW_BATCH" -lt 1 ] || [ "$NEW_BATCH" -gt 9 ]; then
      echo ""
      echo "배치 목록:"
      echo "  1: OG 공유 카드 (25장)"
      echo "  2: 천문대 파악 장면 (11장)"
      echo "  3: 천문대 캐릭터 (8장)"
      echo "  4: 홈 테마 카드 (4장)"
      echo "  5: 세션 배경 (9장)"
      echo "  6: 레벨 일러스트 (15장)"
      echo "  7: 마케팅 (5장)"
      echo "  8: 앱 아이콘 (5장)"
      echo "  9: v3 전체 (39장)"
      echo ""
      echo "현재: Batch $(get_batch)"
      echo "사용법: p batch N"
      exit 0
    fi
    echo "$NEW_BATCH" > "$BATCH_FILE"
    set_sent 0
    set_saved 0
    > "$PROCESSED_FILE" 2>/dev/null || true
    load_batch_config
    mkdir -p "$SAVE_DIR"
    echo "🔄 $BATCH_LABEL (${TOTAL}장) — 시작!"
    echo "   저장 경로: $SAVE_DIR"
    exit 0
    ;;
  p1|send5)
    # 5개 프롬프트를 Chrome 탭 1~5에 순서대로 전송
    TABS="${2:-5}"
    IDX=$(get_sent)
    REMAINING=$((TOTAL - IDX))
    COUNT=$TABS
    [ "$COUNT" -gt "$REMAINING" ] && COUNT=$REMAINING
    if [ "$COUNT" -le 0 ]; then
      echo "🎉 전부 전송 완료!"; exit 0
    fi
    echo ""
    echo "📋 ${COUNT}개 전송 시작 (탭 1~${COUNT}) [$BATCH_LABEL]"
    echo ""
    for i in $(seq 0 $((COUNT - 1))); do
      CUR=$((IDX + i))
      NAME="${NAMES[$CUR]}"
      PROMPT=$(get_prompt "$CUR")
      TAGGED_PROMPT="[${NAME}] ${PROMPT}"
      TAB_NUM=$((i + 1))
      # 클립보드에 복사
      echo -n "$TAGGED_PROMPT" | pbcopy
      # Chrome 탭 전환 + 붙여넣기 + 전송
      osascript <<ASCRIPT
tell application "Google Chrome"
  activate
  tell front window
    set active tab index to $TAB_NUM
  end tell
end tell
delay 0.5
tell application "System Events"
  keystroke "v" using command down
  delay 0.3
  keystroke return
end tell
ASCRIPT
      THEME=$(theme_label "$NAME")
      echo "   탭${TAB_NUM}: $THEME  $NAME ✓"
      sleep 0.5
    done
    set_sent $((IDX + COUNT))
    echo ""
    echo "✅ ${COUNT}개 전송 완료! ($((IDX + COUNT))/$TOTAL)"
    echo "   → 이미지 생성 기다린 후: p grab${TABS}"
    echo ""
    exit 0
    ;;
  p2|grab5)
    # Chrome 탭 1~5에서 이미지를 순서대로 다운로드+저장
    TABS="${2:-5}"
    SAVED=$(get_saved)
    SENT=$(get_sent)
    UNSAVED=$((SENT - SAVED))
    COUNT=$TABS
    [ "$COUNT" -gt "$UNSAVED" ] && COUNT=$UNSAVED
    if [ "$COUNT" -le 0 ]; then
      echo "⚠️  저장할 게 없음. p send5로 먼저 전송!"; exit 1
    fi
    mkdir -p "$SAVE_DIR"
    echo ""
    echo "📥 ${COUNT}개 저장 시작 (탭 1~${COUNT}) [$BATCH_LABEL]"
    echo ""
    for i in $(seq 0 $((COUNT - 1))); do
      CUR=$((SAVED + i))
      NAME="${NAMES[$CUR]}"
      TAB_NUM=$((i + 1))
      # Chrome 탭 전환
      osascript <<ASCRIPT
tell application "Google Chrome"
  tell front window
    set active tab index to $TAB_NUM
  end tell
end tell
ASCRIPT
      sleep 0.3
      # 이미지 URL 추출
      IMG_URL=$(get_chrome_image_url)
      if [ -z "$IMG_URL" ] || [ "$IMG_URL" = "missing value" ]; then
        echo "   탭${TAB_NUM}: ❌ $NAME — 이미지 못 찾음 (아직 생성 중?)"
        continue
      fi
      curl -sL "$IMG_URL" -o "$SAVE_DIR/${NAME}.png"
      if [ -s "$SAVE_DIR/${NAME}.png" ]; then
        PROMPT_PREVIEW=$(get_prompt_preview "$CUR")
        THEME=$(theme_label "$NAME")
        echo "   탭${TAB_NUM}: ✅ $THEME  ${NAME}.png"
        echo "          📋 $PROMPT_PREVIEW"
        log_manifest "$NAME" "$PROMPT_PREVIEW" "$SAVE_DIR/${NAME}.png"
      else
        rm -f "$SAVE_DIR/${NAME}.png"
        echo "   탭${TAB_NUM}: ❌ $NAME — 다운로드 실패"
      fi
    done
    # 성공한 만큼 saved 업데이트
    ACTUAL_SAVED=0
    for i in $(seq 0 $((COUNT - 1))); do
      CUR=$((SAVED + i))
      NAME="${NAMES[$CUR]}"
      if [ -f "$SAVE_DIR/${NAME}.png" ]; then
        ACTUAL_SAVED=$((ACTUAL_SAVED + 1))
      else
        break  # 중간에 실패하면 거기서 멈춤 (순서 보장)
      fi
    done
    set_saved $((SAVED + ACTUAL_SAVED))
    echo ""
    echo "✅ ${ACTUAL_SAVED}/${COUNT}개 저장 완료! (전체: $((SAVED + ACTUAL_SAVED))/$TOTAL)"
    if [ $((SAVED + ACTUAL_SAVED)) -lt "$TOTAL" ]; then
      echo "   → 다음: p send5"
    else
      echo "   🎉 이 배치 완료! 다음: p batch $(($(get_batch) + 1))"
    fi
    echo ""
    exit 0
    ;;
  auto)
    # 전자동 v2: 전송 전부 먼저 → 완료 확인 → 한 번에 복구
    # Phase 1: 모든 프롬프트를 5탭에 빠르게 전송 (이미지 생성 안 기다림)
    # Phase 2: 사용자가 생성 완료 확인 후 Enter
    # Phase 3: recover-images.sh로 한 번에 저장
    WAIT="${2:-60}"  # p1 간 대기 (기본 60초, 이미지 생성 시간)
    echo ""
    echo "🤖 전자동 모드 v2 — 전송 먼저, 저장은 마지막에"
    echo "   Ctrl+C로 중지"
    echo ""

    # Phase 1: 전송
    echo "═══ Phase 1: 프롬프트 전송 ═══"
    echo ""
    TOTAL_SENT=0
    while true; do
      load_batch_config
      SENT=$(get_sent)
      if [ "$SENT" -ge "$TOTAL" ]; then
        CUR_BATCH=$(get_batch)
        NEXT_BATCH=$((CUR_BATCH + 1))
        if [ "$NEXT_BATCH" -gt 9 ]; then
          echo ""
          echo "✅ 전체 전송 완료! (총 ${TOTAL_SENT}장)"
          break
        fi
        echo ""
        echo "🎉 $BATCH_LABEL 전송 완료 → 다음 배치"
        echo "$NEXT_BATCH" > "$BATCH_FILE"
        set_sent 0
        set_saved 0
        > "$PROCESSED_FILE" 2>/dev/null || true
        load_batch_config
        mkdir -p "$SAVE_DIR"
        echo "🔄 $BATCH_LABEL (${TOTAL}장)"
        continue
      fi
      bash "$0" p1
      SENT_THIS=$(( $(get_sent) - SENT ))
      TOTAL_SENT=$((TOTAL_SENT + SENT_THIS))
      echo "   (${TOTAL_SENT}장 전송됨)"
      echo ""
      sleep "$WAIT"
    done

    # Phase 2: 대기
    echo ""
    echo "═══ Phase 2: 이미지 생성 대기 ═══"
    echo ""
    echo "   모든 탭에서 이미지 생성이 완료될 때까지 기다려주세요."
    echo "   각 탭 맨 아래까지 스크롤해서 이미지가 다 나왔는지 확인."
    echo ""
    echo "   준비되면 Enter 누르세요..."
    read -r

    # Phase 3: 복구
    echo ""
    echo "═══ Phase 3: 이미지 복구 ═══"
    echo ""
    bash "$SCRIPT_DIR/recover-images.sh"

    echo ""
    echo "🎉 전자동 완료!"
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
      # 매니페스트에서 마지막 줄 제거
      if [ -f "$MANIFEST_FILE" ]; then
        sed -i '' '$ d' "$MANIFEST_FILE"
      fi
      echo "↩️  전송+저장 되돌림. 다음: ${NAMES[$((SENT - 1))]}"
    fi
    exit 0
    ;;
  goto)
    TARGET="${2:-}"
    if [ -z "$TARGET" ]; then
      echo "사용법: p goto N  (예: p goto 3)"
      echo "        p goto stargazer_1"
      exit 1
    fi
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

    IMG_URL=$(get_chrome_image_url)

    if [ -z "$IMG_URL" ] || [ "$IMG_URL" = "missing value" ]; then
      echo "❌ Chrome에서 이미지 못 찾음. 이미지 생성 완료됐는지 확인!"
      exit 1
    fi

    mkdir -p "$SAVE_DIR"
    curl -sL "$IMG_URL" -o "$SAVE_DIR/${NAME}.png"

    if [ -s "$SAVE_DIR/${NAME}.png" ]; then
      PROMPT_PREVIEW=$(get_prompt_preview "$SAVED")
      set_saved $((SAVED + 1))
      echo ""
      echo "✅ $THEME  ${NAME}.png 저장! ($((SAVED + 1))/$TOTAL)"
      echo "   📋 프롬프트: $PROMPT_PREVIEW"
      echo "   📂 경로: $SAVE_DIR/${NAME}.png"
      log_manifest "$NAME" "$PROMPT_PREVIEW" "$SAVE_DIR/${NAME}.png"

      if [ $((SAVED + 1)) -lt "$TOTAL" ]; then
        NEXT_NAME="${NAMES[$((SAVED + 1))]}"
        echo "   다음: $(theme_label "$NEXT_NAME")  $NEXT_NAME"
      fi
      echo ""
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
  review)
    echo ""
    echo "📋 [$BATCH_LABEL] 저장 리뷰"
    echo ""
    SAVED=$(get_saved)
    for i in "${!NAMES[@]}"; do
      if [ "$i" -ge "$SAVED" ]; then break; fi
      local name="${NAMES[$i]}"
      local theme
      theme=$(theme_label "$name")
      # 저장된 파일 찾기
      local file
      file=$(ls "$SAVE_DIR/${name}".* 2>/dev/null | head -1)
      if [ -n "$file" ]; then
        local prompt_preview
        prompt_preview=$(get_prompt_preview "$i")
        echo "  #$((i+1)) ✅ $theme  $name"
        echo "       📋 $prompt_preview"
        echo ""
      else
        echo "  #$((i+1)) ❌ $theme  $name (파일 없음!)"
        echo ""
      fi
    done
    if [ "$SAVED" -eq 0 ]; then
      echo "  (저장된 이미지 없음)"
    fi
    echo ""
    echo "💡 특정 이미지 열기: p check N"
    echo ""
    exit 0
    ;;
  check)
    TARGET="${2:-}"
    if [ -z "$TARGET" ]; then
      echo "사용법: p check N (예: p check 3)"; exit 1
    fi
    IDX=$((TARGET - 1))
    if [ "$IDX" -lt 0 ] || [ "$IDX" -ge "$TOTAL" ]; then
      echo "❌ 범위 밖: $TARGET (1~$TOTAL)"; exit 1
    fi
    NAME="${NAMES[$IDX]}"
    THEME=$(theme_label "$NAME")
    FILE=$(ls "$SAVE_DIR/${NAME}".* 2>/dev/null | head -1)
    echo ""
    echo "🔍 #$((IDX+1)) $THEME  $NAME"
    echo ""
    echo "📋 프롬프트:"
    get_prompt "$IDX"
    echo ""
    if [ -n "$FILE" ]; then
      echo "📂 파일: $FILE"
      open "$FILE" 2>/dev/null || echo "(열기 실패)"
    else
      echo "❌ 파일 없음"
    fi
    echo ""
    exit 0
    ;;
  save)
    SAVED=$(get_saved)
    if [ "$SAVED" -ge "$(get_sent)" ]; then
      echo "⚠️  저장할 게 없음. 먼저 p로 전송!"; exit 1
    fi
    LATEST=$(find "$DOWNLOADS_DIR" -maxdepth 1 \( -name "*.png" -o -name "*.webp" -o -name "*.jpg" -o -name "*.jpeg" \) -mmin -10 -print0 2>/dev/null | xargs -0 ls -t 2>/dev/null | head -1)
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
    echo "👀 [$BATCH_LABEL] 다운로드 폴더 감시 중... (Ctrl+C로 중지)"
    echo "   이미지 다운로드하면 자동 저장됨"
    echo ""
    trap 'echo ""; echo "감시 종료."; exit 0' INT
    while true; do
      SAVED=$(get_saved)
      if [ "$SAVED" -ge "$TOTAL" ]; then
        echo "🎉 $BATCH_LABEL 전부 저장 완료!"
        exit 0
      fi

      # 아직 처리 안 된 새 이미지 찾기
      CANDIDATES=$(find "$DOWNLOADS_DIR" -maxdepth 1 \( -name "*.png" -o -name "*.webp" -o -name "*.jpg" -o -name "*.jpeg" \) -mmin -60 -print0 2>/dev/null | xargs -0 ls -tr 2>/dev/null || true)
      LATEST=""
      PROCESSED=""
      [ -f "$PROCESSED_FILE" ] && PROCESSED=$(cat "$PROCESSED_FILE")

      while IFS= read -r f; do
        [ -z "$f" ] && continue
        BN=$(basename "$f")
        if [ -z "$PROCESSED" ] || ! echo "$PROCESSED" | grep -qF "$BN"; then
          LATEST="$f"
          break
        fi
      done <<< "$CANDIDATES"

      if [ -n "$LATEST" ]; then
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
  force)
    # Lockstep 무시하고 전송
    BROWSER="chrome"
    IDX=$(get_sent)
    if [ "$IDX" -ge "$TOTAL" ]; then
      echo "🎉 전부 전송 완료!"; exit 0
    fi
    PROMPT=$(get_prompt "$IDX")
    NAME="${NAMES[$IDX]}"
    THEME=$(theme_label "$NAME")
    if [ -z "$PROMPT" ]; then
      echo "❌ 프롬프트 읽기 실패 (인덱스: $IDX)"; exit 1
    fi
    TAGGED_PROMPT="[${NAME}] ${PROMPT}"
    echo -n "$TAGGED_PROMPT" | pbcopy
    paste_to_browser "$BROWSER"
    set_sent $((IDX + 1))
    echo ""
    echo "📋 전송! ($((IDX + 1))/$TOTAL) [force]"
    echo "   $THEME  $NAME"
    echo ""
    exit 0
    ;;
  help|-h|--help)
    sed -n '2,20p' "$0"
    exit 0
    ;;
esac

# ── 기본: 다음 프롬프트 전송 (lockstep 체크) ──
BROWSER="${CMD:-chrome}"
IDX=$(get_sent)

if [ "$IDX" -ge "$TOTAL" ]; then
  echo ""
  echo "🎉 $BATCH_LABEL 전부 전송 완료! ($TOTAL/$TOTAL)"
  echo "   남은 저장: $((TOTAL - $(get_saved)))개"
  next_batch=$(($(get_batch) + 1))
  if [ "$next_batch" -le 9 ]; then
    echo "   다음 배치: p batch $next_batch"
  fi
  echo ""
  exit 0
fi

# Lockstep 체크: 이전 이미지 저장 안 됐으면 경고
if ! check_lockstep; then
  exit 1
fi

PROMPT=$(get_prompt "$IDX")
NAME="${NAMES[$IDX]}"
THEME=$(theme_label "$NAME")

if [ -z "$PROMPT" ]; then
  echo "❌ 프롬프트 읽기 실패 (인덱스: $IDX)"; exit 1
fi

# 프롬프트 앞에 파일명 태그 삽입 — 이미지 생성기 히스토리에서 추적 가능
TAGGED_PROMPT="[${NAME}] ${PROMPT}"
echo -n "$TAGGED_PROMPT" | pbcopy
paste_to_browser "$BROWSER"
set_sent $((IDX + 1))

echo ""
echo "📋 전송! ($((IDX + 1))/$TOTAL) [$BATCH_LABEL]"
echo "   $THEME  $NAME"
echo "   📋 프롬프트: $(echo "$PROMPT" | head -1 | cut -c1-60)..."
echo ""

# 저장 안내
echo "   → 이미지 생성 완료 후: ps (다운로드) 또는 p dl (Chrome 직접)"
echo ""

if [ $((IDX + 1)) -lt "$TOTAL" ]; then
  NEXT="${NAMES[$((IDX + 1))]}"
  echo "   다음: $(theme_label "$NEXT")  $NEXT"
  echo ""
fi
