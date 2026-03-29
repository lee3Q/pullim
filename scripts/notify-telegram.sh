#!/bin/bash
# Telegram 알림 전송
# 사용: bash scripts/notify-telegram.sh "메시지"
# 설정: .env.notify 에 TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 저장

SCRIPT_DIR="$(dirname "$0")"
ENV_FILE="$SCRIPT_DIR/../.env.notify"

if [[ -f "$ENV_FILE" ]]; then
  source "$ENV_FILE"
fi

if [[ -z "$TELEGRAM_BOT_TOKEN" || -z "$TELEGRAM_CHAT_ID" ]]; then
  echo "[notify] TELEGRAM_BOT_TOKEN 또는 TELEGRAM_CHAT_ID 미설정. .env.notify 확인."
  exit 1
fi

MSG="${1:-알림}"

curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  -d chat_id="$TELEGRAM_CHAT_ID" \
  --data-urlencode "text=$MSG" > /dev/null 2>&1

echo "[notify] Telegram 전송 완료"
