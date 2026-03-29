#!/bin/bash
# 아침 리포트 자동 생성 — claude -p로 생성 후 텔레그램 전송
#
# 사용: bash ~/study/main/pullim/scripts/morning-report.sh
# launchd: 매일 08:00 자동 실행

set -euo pipefail

PROJECT_ROOT="$HOME/study/main/pullim"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
STATE_DIR="$PROJECT_ROOT/.state"
TODAY=$(date '+%Y-%m-%d')
REPORT_FILE="$STATE_DIR/daily/${TODAY}_morning.md"

cd "$PROJECT_ROOT"

# 이미 생성된 리포트 있으면 스킵
if [[ -f "$REPORT_FILE" ]]; then
  echo "[morning] 이미 존재: $REPORT_FILE"
  # 텔레그램 전송만
  if [[ -f "$SCRIPTS_DIR/notify-telegram.sh" ]]; then
    CONTENT=$(head -30 "$REPORT_FILE")
    bash "$SCRIPTS_DIR/notify-telegram.sh" "☀ 아침 리포트 (기존)

$CONTENT"
  fi
  exit 0
fi

# claude -p로 리포트 생성
echo "[morning] 리포트 생성 중..."

PROMPT="다음 파일들을 읽고 아침 리포트를 생성해서 $REPORT_FILE 에 저장해.

읽을 파일:
- .state/queue.md
- .state/ceo-board.md
- .state/projects/ 내 active 프로젝트 파일들

리포트 포맷은 .state/routines.md의 '아침 리포트' 섹션 참조.
Level 1 (한눈에) + Level 2 (프로젝트별) 만 생성. Level 3은 생략.
오늘 날짜: $TODAY"

claude -p --model sonnet --dangerously-skip-permissions "$PROMPT" > /tmp/pullim-morning.log 2>&1
RESULT=$?

if [[ $RESULT -eq 0 ]] && [[ -f "$REPORT_FILE" ]]; then
  echo "[morning] 리포트 생성 완료: $REPORT_FILE"

  # 텔레그램 전송
  if [[ -f "$SCRIPTS_DIR/notify-telegram.sh" ]]; then
    # Level 1만 추출해서 전송
    LEVEL1=$(sed -n '/## Level 1/,/## Level 2/p' "$REPORT_FILE" | head -10)
    bash "$SCRIPTS_DIR/notify-telegram.sh" "☀ 아침 리포트 — $TODAY

$LEVEL1

전체: claude code에서 /pullim"
  fi
else
  echo "[morning] 리포트 생성 실패 (code: $RESULT)"
  if [[ -f "$SCRIPTS_DIR/notify-telegram.sh" ]]; then
    bash "$SCRIPTS_DIR/notify-telegram.sh" "⚠ 아침 리포트 생성 실패 ($TODAY)
로그: /tmp/pullim-morning.log"
  fi
  exit 1
fi
