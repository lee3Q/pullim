#!/bin/bash
# 프롬프트 큐: 실행할 때마다 첫 번째 프롬프트를 클립보드에 복사하고 파일에서 제거
# 사용법: ./scripts/prompt-queue.sh (또는 alias pq='./scripts/prompt-queue.sh')

QUEUE_FILE="${1:-scripts/prompts.txt}"

if [ ! -f "$QUEUE_FILE" ]; then
  echo "❌ 파일 없음: $QUEUE_FILE"
  exit 1
fi

# 첫 번째 프롬프트 추출 (--- 구분자 기준)
PROMPT=$(awk '/^---$/{if(found) exit; found=1; next} found{print} !found{print; if(!/^---$/) exit}' "$QUEUE_FILE" | head -1)

if [ -z "$PROMPT" ]; then
  # --- 구분자 없으면 첫 줄 사용
  PROMPT=$(head -1 "$QUEUE_FILE")
fi

if [ -z "$PROMPT" ] || [ "$(wc -l < "$QUEUE_FILE" | tr -d ' ')" = "0" ]; then
  echo "✅ 큐 비었음! 전부 완료."
  exit 0
fi

# 클립보드에 복사
echo -n "$PROMPT" | pbcopy

# 파일에서 첫 프롬프트 제거 (--- 구분자까지 또는 첫 줄)
if grep -q '^---$' "$QUEUE_FILE"; then
  # --- 다음줄부터 끝까지 저장
  awk 'BEGIN{skip=1} /^---$/{if(skip){skip=0; next}} !skip{print}' "$QUEUE_FILE" > "$QUEUE_FILE.tmp"
else
  tail -n +2 "$QUEUE_FILE" > "$QUEUE_FILE.tmp"
fi
mv "$QUEUE_FILE.tmp" "$QUEUE_FILE"

# 남은 개수
REMAINING=$(grep -c '^---$' "$QUEUE_FILE" 2>/dev/null || echo 0)
if [ "$REMAINING" = "0" ]; then
  REMAINING=$(wc -l < "$QUEUE_FILE" | tr -d ' ')
fi

echo "📋 복사됨! (남은 프롬프트: $REMAINING)"
echo "   ${PROMPT:0:60}..."
