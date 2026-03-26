#!/bin/bash
# 3그룹 병렬 배치 원클릭 시작
# 사용: cd ~/study/main/pullim && bash scripts/start-batch-parallel.sh
#
# 그룹 A: 성능/인프라 (이미지, 폰트, SW, SEO, lint)
# 그룹 B: 기능 (유형결과 체인 + 콘텐츠)
# 그룹 C: 디자인/UX (판타지톤, 색상, 접근성, 에러UI)

set -e
cd "$(dirname "$0")/.."
PROJ_DIR=$(pwd)

echo "========================================"
echo "풀림 밤샘 배치 — 3그룹 병렬"
echo "========================================"

# Branch 격리
BRANCH_NAME="overnight/$(date '+%Y%m%d')"
CURRENT_BRANCH=$(git branch --show-current)
if [[ "$CURRENT_BRANCH" != "$BRANCH_NAME" ]]; then
  git stash --include-untracked -m "batch-stash-$(date '+%Y%m%d_%H%M')" 2>/dev/null || true
  git checkout -B "$BRANCH_NAME" 2>/dev/null
  git stash pop 2>/dev/null || true
  echo "✅ 브랜치: $BRANCH_NAME"
fi

# 이전 로그 백업
for g in a b c; do
  [[ -f "scripts/batch_${g}.log" ]] && mv "scripts/batch_${g}.log" "scripts/batch_${g}_$(date '+%m%d_%H%M').log"
done

# 이전 영구 실패 초기화
rm -f scripts/.permafail

# 그룹별 output 디렉토리 생성
mkdir -p scripts/output_a scripts/output_b scripts/output_c
mkdir -p scripts/errors_a scripts/errors_b scripts/errors_c

echo ""
echo "그룹 A: $(ls scripts/tasks_a/*.md 2>/dev/null | wc -l | tr -d ' ')개 (성능/인프라)"
echo "그룹 B: $(ls scripts/tasks_b/*.md 2>/dev/null | wc -l | tr -d ' ')개 (기능/콘텐츠)"
echo "그룹 C: $(ls scripts/tasks_c/*.md 2>/dev/null | wc -l | tr -d ' ')개 (디자인/UX)"
echo ""

# 그룹 A 시작
BATCH_GROUP=a BATCH_TASK_DIR="$PROJ_DIR/scripts/tasks_a" \
  caffeinate -dis nohup bash scripts/batch_claude.sh > scripts/nohup_a.out 2>&1 &
PID_A=$!
echo "✅ 그룹 A 시작 (PID $PID_A)"

sleep 5  # API 레이트리밋 방지

# 그룹 B 시작
BATCH_GROUP=b BATCH_TASK_DIR="$PROJ_DIR/scripts/tasks_b" \
  caffeinate -dis nohup bash scripts/batch_claude.sh > scripts/nohup_b.out 2>&1 &
PID_B=$!
echo "✅ 그룹 B 시작 (PID $PID_B)"

sleep 5

# 그룹 C 시작
BATCH_GROUP=c BATCH_TASK_DIR="$PROJ_DIR/scripts/tasks_c" \
  caffeinate -dis nohup bash scripts/batch_claude.sh > scripts/nohup_c.out 2>&1 &
PID_C=$!
echo "✅ 그룹 C 시작 (PID $PID_C)"

echo ""
echo "========================================"
echo "모니터링:"
echo "  tail -f scripts/batch_a.log   # 그룹 A (성능)"
echo "  tail -f scripts/batch_b.log   # 그룹 B (기능)"
echo "  tail -f scripts/batch_c.log   # 그룹 C (디자인)"
echo ""
echo "진행률:"
echo "  ls scripts/output_a/*_final.md 2>/dev/null | wc -l  # A"
echo "  ls scripts/output_b/*_final.md 2>/dev/null | wc -l  # B"
echo "  ls scripts/output_c/*_final.md 2>/dev/null | wc -l  # C"
echo ""
echo "전체 종료 확인:"
echo "  ps aux | grep batch_claude | grep -v grep"
echo "========================================"
echo ""
echo "이제 자도 됩니다 😴"
