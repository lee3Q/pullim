#!/usr/bin/env zsh
# 회초리팀 통합 실행 스크립트
# GLM이 데이터 수집/형식 검사 → 결과를 ~/study/main/창업/사전/회초리_결과/ 에 저장
# zsh로 실행해야 gclaude 함수 사용 가능

source ~/.zshrc 2>/dev/null

BASE="$HOME/study/main/창업/사전"
TEAM="$HOME/study/main/창업/팀"
RESULT_DIR="$BASE/회초리_결과"
TODAY=$(date +%Y-%m-%d)

mkdir -p "$RESULT_DIR"

echo "========================================="
echo "회초리팀 실행 — $TODAY"
echo "========================================="

# ─────────────────────────────────────────────
# 공통 함수: 하네스에서 프롬프트 추출 + 데이터 주입 + GLM 실행
# ─────────────────────────────────────────────
run_check() {
  local name="$1"
  local harness="$2"
  local data="$3"
  local outfile="$RESULT_DIR/${name}.md"

  # 하네스 파일에서 ``` 블록 추출
  TEMPLATE=$(awk '/^```$/{count++; if(count==1){found=1; next} if(count==2){exit}} found{print}' "$harness")

  if [ -z "$TEMPLATE" ]; then
    echo "⚠️  $name: 프롬프트 추출 실패 — 하네스 파일 확인 필요"
    return 1
  fi

  # 데이터가 있으면 프롬프트 끝에 추가
  if [ -n "$data" ]; then
    FULL_PROMPT="$TEMPLATE

$data"
  else
    FULL_PROMPT="$TEMPLATE"
  fi

  TMPFILE=$(mktemp /tmp/회초리_${name}.XXXXXX)
  printf '%s' "$FULL_PROMPT" > "$TMPFILE"

  echo "▶ $name 실행 중..."
  gclaude -p "$(cat "$TMPFILE")" > "$outfile"
  STATUS=$?
  rm -f "$TMPFILE"

  if [ $STATUS -eq 0 ]; then
    echo "  ✅ 완료: $outfile"
  else
    echo "  ❌ 실패 (exit $STATUS)"
  fi
}

# ─────────────────────────────────────────────
# 체크 1: 파일 구조 정합성
# (파일 목록 동적 생성 — node_modules/아카이브/GLM하네스 제외)
# ─────────────────────────────────────────────
echo ""
echo "[1/6] 파일 구조 정합성"
FILE_LIST=$(find "$HOME/study/main/창업" \( -name "*.md" -o -name "*.yaml" \) \
  | grep -v "\.git" \
  | grep -v "/아카이브/" \
  | grep -v "/archive" \
  | grep -v "/회초리_결과/" \
  | grep -v "/사전/GLM_" \
  | grep -v "/pullim/node_modules/" \
  | grep -v "/pullim/\.next/" \
  | sort \
  | sed "s|$HOME/study/main/창업/||")
run_check "1_파일구조" "$BASE/GLM_파일정리_하네스.md" "$FILE_LIST"

# ─────────────────────────────────────────────
# 체크 2: 세션 맥락 최신화
# ─────────────────────────────────────────────
echo ""
echo "[2/6] 세션 맥락 최신화"
SESSION_DATA=$(head -3 "$HOME/study/main/창업/세션_맥락.md")
run_check "2_세션맥락" "$BASE/GLM_세션맥락_하네스.md" "오늘 날짜: $TODAY

세션_맥락.md 상단:
$SESSION_DATA"

# ─────────────────────────────────────────────
# 체크 3: 회의록 누락
# ─────────────────────────────────────────────
echo ""
echo "[3/6] 회의록 누락"
MEETINGS=$(ls "$TEAM/회의록/" 2>/dev/null | sort)
run_check "3_회의록" "$BASE/GLM_회의록_하네스.md" "오늘 날짜: $TODAY

회의록 파일 목록 (오름차순):
$MEETINGS"

# ─────────────────────────────────────────────
# 체크 4: team_state.yaml 필드 완성도 (Python 직접 처리 — GLM 불필요)
# ─────────────────────────────────────────────
echo ""
echo "[4/6] team_state.yaml 완성도"
python3 - <<'PYEOF' > "$RESULT_DIR/4_팀상태.md"
import re, sys
from pathlib import Path

yaml_path = Path.home() / "study/main/창업/팀/team_state.yaml"
text = yaml_path.read_text()

# 필수 필드 존재 확인
required = ["last_meeting", "next_action", "decisions_pending", "current_sprint"]
print("필수 필드 존재 여부:")
print("| 필드 | 존재 |")
print("|------|------|")
for f in required:
    exists = "Y" if re.search(rf"^{f}:", text, re.MULTILINE) else "N"
    print(f"| {f} | {exists} |")

# 빈 값 필드 탐지
print()
print("빈/미정 필드:")
empty_patterns = [r':\s*""', r':\s*null', r':\s*~', r':\s*\[\]', r':\s*(미작성|미정|없음|TBD)']
empties = []
for i, line in enumerate(text.splitlines(), 1):
    for pat in empty_patterns:
        if re.search(pat, line):
            key = line.split(":")[0].strip()
            empties.append(f"| {key} (line {i}) | {line.strip()} |")

if empties:
    print("| 필드 | 현재 값 |")
    print("|------|---------|")
    for e in empties:
        print(e)
else:
    print("빈 필드 없음")

# current_task 38차 이전 여부 경고
print()
old_tasks = re.findall(r'current_task:.*\[3[0-8]차\].*', text)
if old_tasks:
    print("⚠️ 구버전 current_task (38차 이전) 잔존:")
    for t in old_tasks:
        print(f"  - {t.strip()[:80]}")
else:
    print("✅ current_task 최신화 확인 (38차 이전 항목 없음)")
PYEOF
echo "  ✅ 완료: $RESULT_DIR/4_팀상태.md"

# ─────────────────────────────────────────────
# 체크 5: 사전 업데이트 주기
# ─────────────────────────────────────────────
echo ""
echo "[5/6] 사전 업데이트 주기"
INDEX_DATA=$(cat "$BASE/INDEX.md" 2>/dev/null)
run_check "5_사전주기" "$BASE/GLM_사전주기_하네스.md" "오늘 날짜: $TODAY

INDEX.md 내용:
$INDEX_DATA"

# ─────────────────────────────────────────────
# 체크 6: 판단필요 잔여 항목 (grep 직접 처리 — GLM 불필요)
# ─────────────────────────────────────────────
echo ""
echo "[6/6] 판단필요 잔여 항목"
{
  PARIAL=$(grep "| Y |" "$RESULT_DIR/1_파일구조.md" 2>/dev/null)
  if [ -z "$PARIAL" ]; then
    echo "판단필요 항목 없음 (또는 1_파일구조 결과 없음)"
  else
    COUNT=$(echo "$PARIAL" | wc -l | tr -d ' ')
    echo "| 파일명 | 현재 위치 | 분류 | 판단필요_이유 |"
    echo "|--------|----------|------|-------------|"
    echo "$PARIAL" | awk -F'|' '{print "| "$2" | "$3" | "$4" | "$6" |"}'
    echo ""
    echo "총 ${COUNT}건"
  fi
} > "$RESULT_DIR/6_판단필요.md"
echo "  ✅ 완료: $RESULT_DIR/6_판단필요.md"

# ─────────────────────────────────────────────
# 완료
# ─────────────────────────────────────────────
echo ""
echo "========================================="
echo "GLM 실행 완료. 결과: $RESULT_DIR/"
echo "다음 단계: Claude가 결과 읽고 판단 → /회초리 판단"
echo "========================================="
