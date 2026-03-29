#!/bin/bash
# HTML에서 이미지 순서 추출 → prompts-v4.txt 파일명과 매칭 → 복사
set -euo pipefail

HTML_FILE="/Users/sanggyulee/Downloads/AI Helpy Chat.html"
SRC_DIR="/Users/sanggyulee/Downloads/AI Helpy Chat_files"
PROMPTS="/Users/sanggyulee/study/main/pullim/scripts/prompts-v4.txt"
OUT_DIR="/Users/sanggyulee/study/main/pullim/pullim/public/images/v4/mapped"
mkdir -p "$OUT_DIR"

# 1. HTML에서 이미지 파일명 순서 추출 (로고/UI 제외)
grep -oE 'src="./AI Helpy Chat_files/[a-f0-9]+\.(png|jpg|webp)"' "$HTML_FILE" \
  | sed 's|src="./AI Helpy Chat_files/||;s|"||' \
  > /tmp/html_images_order.txt

# 2. prompts-v4.txt에서 타겟 파일명 순서 추출
grep "^#" "$PROMPTS" | sed 's/^# //' > /tmp/prompt_names_order.txt

HTML_COUNT=$(wc -l < /tmp/html_images_order.txt)
PROMPT_COUNT=$(wc -l < /tmp/prompt_names_order.txt)

echo "HTML 이미지: ${HTML_COUNT}장"
echo "프롬프트: ${PROMPT_COUNT}장"
echo ""

# 3. 순서대로 매칭 + 복사
matched=0
missing=0
i=1
while IFS= read -r target_name; do
  if [[ $i -le $HTML_COUNT ]]; then
    src_file=$(sed -n "${i}p" /tmp/html_images_order.txt)
    if [[ -f "$SRC_DIR/$src_file" ]]; then
      cp "$SRC_DIR/$src_file" "$OUT_DIR/$target_name"
      echo "[OK] $i: $src_file → $target_name"
      matched=$((matched + 1))
    else
      echo "[MISS] $i: $src_file 없음 → $target_name (빠짐)"
      missing=$((missing + 1))
    fi
  else
    echo "[SKIP] $i: HTML 이미지 부족 → $target_name (토큰 소진)"
    missing=$((missing + 1))
  fi
  i=$((i + 1))
done < /tmp/prompt_names_order.txt

echo ""
echo "======================================"
echo "매핑 완료: ${matched}장 성공, ${missing}장 누락"
echo "출력: $OUT_DIR/"
echo "======================================"
