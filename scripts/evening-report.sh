#!/bin/bash
# 밤 리포트 자동 생성 — claude -p로 생성 후 텔레그램 전송
#
# 사용: bash ~/study/main/pullim/scripts/evening-report.sh
# launchd: 매일 22:00 자동 실행

set -euo pipefail

PROJECT_ROOT="$HOME/study/main/pullim"
SCRIPTS_DIR="$PROJECT_ROOT/scripts"
STATE_DIR="$PROJECT_ROOT/.state"
TODAY=$(date '+%Y-%m-%d')
REPORT_FILE="$STATE_DIR/daily/${TODAY}_evening.md"

cd "$PROJECT_ROOT"

# 이미 생성된 리포트 있으면 스킵
if [[ -f "$REPORT_FILE" ]]; then
  echo "[evening] 이미 존재: $REPORT_FILE"
  if [[ -f "$SCRIPTS_DIR/notify-telegram.sh" ]]; then
    CONTENT=$(head -30 "$REPORT_FILE")
    bash "$SCRIPTS_DIR/notify-telegram.sh" "🌙 밤 리포트 (기존)

$CONTENT"
  fi
  exit 0
fi

# claude -p로 리포트 생성
echo "[evening] 리포트 생성 중..."

PROMPT="다음 파일들을 읽고 밤 리포트를 생성해서 $REPORT_FILE 에 저장해.

읽을 파일:
- .state/queue.md
- .state/ceo-board.md
- .state/projects/ 내 active 프로젝트 파일들
- .state/daily/${TODAY}_morning.md (아침 리포트, 있으면)
- .state/handoffs/ 에서 오늘 날짜 핸드오프 (있으면)

리포트 포맷은 .state/routines.md의 '밤 리포트' 섹션 참조.
오늘 한 일은 git log --since='${TODAY}T00:00' --oneline 으로 확인.
오늘 날짜: $TODAY

또한 리포트를 $REPORT_FILE 에 저장한 뒤, queue.md + projects/ 에서 다음 우선순위 작업 1개를 선택하여
$STATE_DIR/harnesses/${TODAY}_자동초안.md 에 하네스 초안을 별도로 저장해.
하네스 초안 형식:
# 하네스: [작업명]
## 목표
[한 줄 설명]
## 작업 항목
- 구체적인 실행 단계 (3~5개)
## 완료 기준 (AC)
- [ ] 검증 가능한 조건"

claude -p --model sonnet --dangerously-skip-permissions "$PROMPT" > /tmp/pullim-evening.log 2>&1
RESULT=$?

if [[ $RESULT -eq 0 ]] && [[ -f "$REPORT_FILE" ]]; then
  echo "[evening] 리포트 생성 완료: $REPORT_FILE"

  if [[ -f "$SCRIPTS_DIR/notify-telegram.sh" ]]; then
    LEVEL1=$(sed -n '/## Level 1/,/## Level 2/p' "$REPORT_FILE" | head -10)
    bash "$SCRIPTS_DIR/notify-telegram.sh" "🌙 밤 리포트 — $TODAY

$LEVEL1

전체: claude code에서 /pullim"
  fi
else
  echo "[evening] 리포트 생성 실패 (code: $RESULT)"
  if [[ -f "$SCRIPTS_DIR/notify-telegram.sh" ]]; then
    bash "$SCRIPTS_DIR/notify-telegram.sh" "⚠ 밤 리포트 생성 실패 ($TODAY)
로그: /tmp/pullim-evening.log"
  fi
  exit 1
fi
