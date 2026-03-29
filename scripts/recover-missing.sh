#!/bin/bash
# 누락 2장 복구 — 탭2 마지막 + 탭5 마지막
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BASE_DIR="$SCRIPT_DIR/../pullim/public"

get_last_image_from_tab() {
  local tab_num=$1
  osascript <<ASCRIPT
tell application "Google Chrome"
  tell front window
    set active tab index to $tab_num
  end tell
  delay 0.5
  set imgUrls to execute front window's active tab javascript "
(function() {
  var imgs = document.querySelectorAll('img');
  var urls = [];
  for (var i = 0; i < imgs.length; i++) {
    var img = imgs[i];
    if (!img.src || img.src.indexOf('data:') === 0) continue;
    if (img.naturalWidth >= 300 && img.naturalHeight >= 300) {
      urls.push(img.src);
    }
  }
  return urls.length + '|||' + (urls.length > 0 ? urls[urls.length-1] : '');
})();
"
  return imgUrls
end tell
ASCRIPT
}

echo ""
echo "🔍 누락 이미지 복구 — 탭2, 탭5 마지막 이미지"
echo "   (먼저 탭2, 탭5 맨 아래까지 스크롤해주세요!)"
echo ""

# 탭 2 마지막 → icon_v2_brush
echo -n "   탭 2 스캔 중..."
RESULT2=$(get_last_image_from_tab 2 2>/dev/null || echo "0|||")
COUNT2=$(echo "$RESULT2" | awk -F'\\|\\|\\|' '{print $1}')
URL2=$(echo "$RESULT2" | sed 's/.*|||//')
echo " ${COUNT2}장 발견"

if [ -n "$URL2" ] && [ "$URL2" != "" ]; then
  curl -sL "$URL2" -o "$BASE_DIR/icons/icon_v2_brush.png" 2>/dev/null
  if [ -s "$BASE_DIR/icons/icon_v2_brush.png" ]; then
    echo "   ✅ icon_v2_brush.png 저장!"
  else
    echo "   ❌ icon_v2_brush 다운로드 실패"
  fi
else
  echo "   ❌ 이미지 URL 추출 실패"
fi

# 탭 5 마지막 → icon_v2_venn
echo -n "   탭 5 스캔 중..."
RESULT5=$(get_last_image_from_tab 5 2>/dev/null || echo "0|||")
COUNT5=$(echo "$RESULT5" | awk -F'\\|\\|\\|' '{print $1}')
URL5=$(echo "$RESULT5" | sed 's/.*|||//')
echo " ${COUNT5}장 발견"

if [ -n "$URL5" ] && [ "$URL5" != "" ]; then
  curl -sL "$URL5" -o "$BASE_DIR/icons/icon_v2_venn.png" 2>/dev/null
  if [ -s "$BASE_DIR/icons/icon_v2_venn.png" ]; then
    echo "   ✅ icon_v2_venn.png 저장!"
  else
    echo "   ❌ icon_v2_venn 다운로드 실패"
  fi
else
  echo "   ❌ 이미지 URL 추출 실패"
fi

echo ""
echo "완료!"
