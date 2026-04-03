#!/bin/bash
# BGM 교체 후 검증 + 커밋 + 푸시 스크립트
# 사용법: BGM 4곡을 pullim/public/assets/에 넣은 후 실행
#   ww ~/study/main/pullim/scripts/batch-tasks/bgm-deploy.sh

set -e
cd ~/study/main/pullim

echo "=== BGM 파일 검증 ==="
FAIL=0
for f in stargazer-bgm.mp3 stargazer-bgm-2.mp3 apocalypse-bgm.mp3 apocalypse-bgm-2.mp3; do
  filepath="pullim/public/assets/$f"
  if [ ! -f "$filepath" ]; then
    echo "FAIL: $filepath 없음"
    FAIL=1
    continue
  fi
  size=$(wc -c < "$filepath" | tr -d ' ')
  if [ "$size" -lt 100000 ]; then
    echo "FAIL: $f = ${size} bytes (placeholder 의심, 100KB 미만)"
    FAIL=1
  else
    echo "OK: $f ($(( size / 1024 ))KB)"
  fi
done

if [ "$FAIL" -eq 1 ]; then
  echo ""
  echo "❌ BGM 파일이 부족하거나 placeholder입니다."
  echo "Suno/Udio에서 생성 후 아래 경로에 저장하세요:"
  echo "  ~/study/main/pullim/pullim/public/assets/stargazer-bgm.mp3"
  echo "  ~/study/main/pullim/pullim/public/assets/stargazer-bgm-2.mp3"
  echo "  ~/study/main/pullim/pullim/public/assets/apocalypse-bgm.mp3"
  echo "  ~/study/main/pullim/pullim/public/assets/apocalypse-bgm-2.mp3"
  exit 1
fi

echo ""
echo "=== 빌드 검증 ==="
cd pullim
npx next build 2>&1 | tail -5
cd ..

echo ""
echo "=== 커밋 + 푸시 ==="
git add pullim/public/assets/stargazer-bgm.mp3 \
       pullim/public/assets/stargazer-bgm-2.mp3 \
       pullim/public/assets/apocalypse-bgm.mp3 \
       pullim/public/assets/apocalypse-bgm-2.mp3 \
       pullim/src/lib/themes/index.ts
git commit -m "feat: 천문대/종말 실제 BGM 교체 + 종말 2번 트랙 추가

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
git push origin main

echo ""
echo "✅ 완료. Vercel 자동 배포 트리거됨."
