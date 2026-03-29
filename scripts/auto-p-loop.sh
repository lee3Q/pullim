#!/bin/bash
# p auto 루프 — prompts-v4.txt 기반 이미지 자동 전송 + 일괄 저장
#
# 사용:
#   bash ~/study/main/pullim/scripts/auto-p-loop.sh send [간격초]  — 프롬프트 전송만
#   bash ~/study/main/pullim/scripts/auto-p-loop.sh save           — 스크롤+일괄 저장
#   bash ~/study/main/pullim/scripts/auto-p-loop.sh all [간격초]   — 전송→대기→저장
#
# 전제: 브라우저에 이미지 생성 도구 탭이 활성(맨 앞)이어야 함
# 중단: Ctrl+C

set -euo pipefail

SCRIPTS_DIR="$(cd "$(dirname "$0")" && pwd)"
PROMPTS_FILE="$SCRIPTS_DIR/prompts-v4.txt"
MODE="${1:-all}"
INTERVAL="${2:-60}"

send_prompts() {
  local interval=$1
  local sent=0
  local total=$(awk '/^---$/{n++} END{print n+1}' "$PROMPTS_FILE" 2>/dev/null || echo 0)

  echo "======================================"
  echo "프롬프트 전송 시작 (${total}장, 간격 ${interval}초)"
  echo "======================================"

  local prompt=""
  local index=0

  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ "$line" == "---" ]]; then
      index=$((index + 1))
      if [[ -n "$prompt" ]]; then
        echo "[${index}/${total}] 전송..."
        echo -n "$prompt" | pbcopy
        osascript -e '
          tell application "Google Chrome" to activate
          delay 0.5
          tell application "System Events"
            keystroke "v" using command down
            delay 0.5
            keystroke return
          end tell
        '
        sent=$index
        echo "[${index}/${total}] OK. ${interval}초 대기..."
        sleep "$interval"
      fi
      prompt=""
    else
      prompt="${prompt:+$prompt
}$line"
    fi
  done < "$PROMPTS_FILE"

  # 마지막 프롬프트
  if [[ -n "$prompt" ]]; then
    index=$((index + 1))
    echo "[${index}/${total}] 마지막 전송..."
    echo -n "$prompt" | pbcopy
    osascript -e '
      tell application "Google Chrome" to activate
      delay 0.5
      tell application "System Events"
        keystroke "v" using command down
        delay 0.5
        keystroke return
      end tell
    '
  fi

  echo "======================================"
  echo "전송 완료: ${total}장"
  echo "======================================"
}

save_all_images() {
  echo "======================================"
  echo "일괄 저장 시작 — 스크롤 후 이미지 저장"
  echo "======================================"

  # 1. 페이지 맨 위로
  osascript -e '
    tell application "System Events"
      key code 116 using command down
    end tell
  '
  sleep 2

  # 2. 맨 아래까지 천천히 스크롤 (이미지 로딩 위해)
  echo "스크롤 중 (이미지 로딩 대기)..."
  for i in $(seq 1 50); do
    osascript -e '
      tell application "System Events"
        key code 121
      end tell
    '
    sleep 1
  done

  # 3. 다시 맨 위로
  osascript -e '
    tell application "System Events"
      key code 116 using command down
    end tell
  '
  sleep 2

  # 4. 전체 페이지 저장 (Cmd+S)
  echo "페이지 저장 (Cmd+S)..."
  osascript -e '
    tell application "System Events"
      keystroke "s" using command down
    end tell
  '
  sleep 3

  # Enter로 저장 확인
  osascript -e '
    tell application "System Events"
      keystroke return
    end tell
  '

  echo "======================================"
  echo "저장 완료. ~/Downloads 에서 이미지 확인."
  echo "======================================"
}

# 메인
if [[ ! -f "$PROMPTS_FILE" ]]; then
  echo "[오류] $PROMPTS_FILE 없음. 배치 Task 1이 먼저 완료되어야 함."
  exit 1
fi

case "$MODE" in
  send)
    send_prompts "$INTERVAL"
    ;;
  save)
    save_all_images
    ;;
  all)
    send_prompts "$INTERVAL"
    echo ""
    echo "마지막 이미지 생성 대기 (${INTERVAL}초)..."
    sleep "$INTERVAL"
    save_all_images
    ;;
  *)
    echo "사용: $0 {send|save|all} [간격초]"
    exit 1
    ;;
esac
