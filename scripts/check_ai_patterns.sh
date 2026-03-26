#!/bin/bash
# ICC 사업계획서 AI 패턴 검출기
# 사용법: ./scripts/check_ai_patterns.sh <파일경로>
# 종료코드: 0=통과, 1=AI 패턴 발견

FILE="$1"
if [ -z "$FILE" ] || [ ! -f "$FILE" ]; then
  echo "FAIL: 파일을 지정하세요. 사용법: $0 <파일경로>"
  exit 1
fi

FAIL=0
ISSUES=""

# === 1. em dash 검출 (0개여야 통과) ===
EM_COUNT=$(grep -c '—' "$FILE" 2>/dev/null || echo 0)
if [ "$EM_COUNT" -gt 0 ]; then
  ISSUES="${ISSUES}\n[FAIL] em dash ${EM_COUNT}개 발견. 전부 제거 필요."
  FAIL=1
fi

# === 2. AI 과장 수사 검출 ===
AI_WORDS="극대화|완벽한 시너지|강력하고|혁신적인|획기적|차별화된 가치|고객 중심의|선도적|압도적|독보적|유례없는|전례 없는|탁월한|뛰어난 역량|최적의|최고 수준|핵심 경쟁력을 확보|미래를 선도|새로운 패러다임|게임 체인저"
AI_HITS=$(grep -cE "$AI_WORDS" "$FILE" 2>/dev/null || echo 0)
if [ "$AI_HITS" -gt 0 ]; then
  ISSUES="${ISSUES}\n[FAIL] AI 과장 수사 ${AI_HITS}건:"
  MATCHED=$(grep -nE "$AI_WORDS" "$FILE" 2>/dev/null)
  ISSUES="${ISSUES}\n${MATCHED}"
  FAIL=1
fi

# === 3. 내부 용어 검출 ===
INTERNAL="v1|v2|v3|v4|끝판왕|엔드게임"
INT_HITS=$(grep -cE "$INTERNAL" "$FILE" 2>/dev/null | head -1 || echo 0)
if [ "$INT_HITS" -gt 0 ]; then
  ISSUES="${ISSUES}\n[FAIL] 내부 용어 ${INT_HITS}건:"
  MATCHED=$(grep -nE "$INTERNAL" "$FILE" 2>/dev/null)
  ISSUES="${ISSUES}\n${MATCHED}"
  FAIL=1
fi

# === 4. 동일 문장 패턴 반복 검출 (같은 접두사로 시작하는 줄이 3개 이상) ===
REPEAT=$(awk '{prefix=substr($0,1,10)} prefix!="" && length($0)>5 && seen[prefix]++ == 2 {print NR": "$0" (패턴 3회 반복)"}' "$FILE" 2>/dev/null || true)
if [ -n "$REPEAT" ]; then
  ISSUES="${ISSUES}\n[WARN] 동일 패턴 반복 의심:"
  ISSUES="${ISSUES}\n${REPEAT}"
fi

# === 5. 공허한 종결 표현 검출 ===
EMPTY_END="이를 통해|따라서.*중요합니다|~를 달성할 것입니다|~에 기여할 것입니다|~를 실현할 것입니다|~를 추구합니다"
EMPTY_HITS=$(grep -cE "$EMPTY_END" "$FILE" 2>/dev/null || echo 0)
if [ "$EMPTY_HITS" -gt 0 ]; then
  ISSUES="${ISSUES}\n[FAIL] 공허한 종결 표현 ${EMPTY_HITS}건:"
  MATCHED=$(grep -nE "$EMPTY_END" "$FILE" 2>/dev/null)
  ISSUES="${ISSUES}\n${MATCHED}"
  FAIL=1
fi

# === 6. 근거 없는 주장 검출 ===
NO_EVIDENCE="전 세계에.*확인되지 않|유례를 찾기 어렵|전무하다|독보적 위치|시장을 장악|압도적 우위"
NE_HITS=$(grep -cE "$NO_EVIDENCE" "$FILE" 2>/dev/null || echo 0)
if [ "$NE_HITS" -gt 0 ]; then
  ISSUES="${ISSUES}\n[FAIL] 근거 없는 주장 ${NE_HITS}건:"
  MATCHED=$(grep -nE "$NO_EVIDENCE" "$FILE" 2>/dev/null)
  ISSUES="${ISSUES}\n${MATCHED}"
  FAIL=1
fi

# === 결과 출력 ===
echo "================================"
echo "AI 패턴 검출 결과: $FILE"
echo "================================"
if [ "$FAIL" -eq 0 ]; then
  echo "PASS: AI 패턴 미발견"
else
  echo "FAIL: 아래 항목 수정 필요"
  echo -e "$ISSUES"
fi
echo "================================"
exit $FAIL
