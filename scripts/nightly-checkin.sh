#!/bin/bash
# 22시 자동 체크인 — 텔레그램 인박스 확인 + 처리
# launchd: com.pullim.nightly-checkin

set -e

PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
INBOX="$PROJECT_ROOT/.state/telegram-inbox.md"
ENV_FILE="$PROJECT_ROOT/.env.notify"

# .env.notify 로드
if [ -f "$ENV_FILE" ]; then
  source "$ENV_FILE"
fi

notify() {
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="$TELEGRAM_CHAT_ID" \
      -d parse_mode=Markdown \
      -d text="$1" > /dev/null 2>&1
  fi
}

# 인박스 없거나 비어있으면
if [ ! -f "$INBOX" ] || [ "$(wc -l < "$INBOX")" -le 3 ]; then
  notify "🌙 22시 체크인: 새 메시지 없음. 좋은 밤!"
  exit 0
fi

# 인박스 내용 읽기
INBOX_CONTENT=$(cat "$INBOX")

# Claude에게 처리 요청
RESPONSE=$(claude -p --model sonnet "
너는 풀림 프로젝트의 AI 어시스턴트다. 대표가 텔레그램으로 보낸 메시지를 확인하고 처리해야 한다.

프로젝트 루트: $PROJECT_ROOT

## 대표 메시지 (텔레그램 인박스)
$INBOX_CONTENT

## 해야 할 것
1. 메시지를 읽고 분류해:
   - 피드백/수정 요청 → queue.md에 추가
   - 질문 → 답변 준비
   - 메모/아이디어 → 해당 프로젝트 파일에 기록
2. 처리 결과를 3줄 이내로 요약해.
3. 처리 완료 후 인박스 파일은 비워(헤더만 남기기).

요약만 출력해. 파일 수정은 직접 해.
" 2>/dev/null || echo "Claude 호출 실패")

# 인박스 비우기 (헤더만 남기기)
echo '# 텔레그램 인박스

> 대표가 텔레그램으로 보낸 메시지. 22시 자동 확인.' > "$INBOX"

# 결과 텔레그램 전송
notify "🌙 *22시 체크인 완료*

$RESPONSE"

echo "[nightly-checkin] 완료: $(date)"
