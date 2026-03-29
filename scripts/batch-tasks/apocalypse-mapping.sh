HARNESS_FILE="$PROJECT_ROOT/.state/handoffs/2026-03-29_handoff_7.md"
TASK_TIMEOUT=2400

tasks() {
  COMMON="프로젝트 루트: ~/study/main/pullim. 하네스: $HARNESS_FILE 읽어라."

  run_task 1 "이미지매핑" "$COMMON

p auto로 생성된 이미지들이 pullim/public/ 아래에 저장되어 있다.
Downloads 폴더(~/Downloads)에 최근 생성된 이미지가 있을 수 있으니 확인.

해야 할 일:
1. scripts/prompts-v4.txt의 파일명 주석을 읽어서 각 이미지가 어디에 들어가야 하는지 파악
2. ~/Downloads에서 최근 png/jpg 파일 목록 확인 (ls -lt ~/Downloads/*.{png,jpg} | head -120)
3. 이미지를 올바른 pullim/public/ 경로로 이동:
   - discovery 장면: pullim/public/assets/discovery/apocalypse_*.png
   - personality: pullim/public/images/personality/apocalypse_*.png
   - OG 카드: pullim/public/images/og/og_apocalypse_*.png, og_stargazer_*.png
   - levels: pullim/public/images/levels/apocalypse_level*.png
   - home: pullim/public/images/home/home_card_apocalypse.png
   - backgrounds: pullim/public/assets/apocalypse-*-bg.png
   - avatar: pullim/public/assets/apocalypse-avatar.png
   - enter-bg: pullim/public/assets/apocalypse-enter-bg.png
   - marketing: pullim/public/images/marketing/
   - appstore: pullim/public/images/appstore/
   - landing: pullim/public/images/landing/
   - UI: pullim/public/images/v4/
4. 필요한 디렉토리가 없으면 mkdir -p로 생성
5. story-scenes.ts의 APOCALYPSE_SCENES imagePath와 실제 파일이 매칭되는지 확인
6. 기존 테마(특히 stargazer 천문대)의 imagePath도 점검 — 파일 없는 경로 수정"

  run_task 2 "코드정합성" "$COMMON

pullim/src/lib/personalization/story-scenes.ts를 읽고:
1. 모든 imagePath가 pullim/public/ 아래 실제 파일을 가리키는지 확인
2. 안 맞는 것 수정
3. themes/index.ts의 assets (bg, avatar) 경로가 실제 파일과 맞는지 확인 — 특히 종말 테마
4. page.tsx의 THEME_CARDS imagePath 확인

수정 후 빌드: cd pullim && npm run build
빌드 통과 확인."

  run_task 3 "최종테스트" "$COMMON

cd pullim && npm run dev &
DEV_PID=\$!
sleep 8

curl -s http://localhost:3000 | head -50
echo '---'
curl -s http://localhost:3000 -o /dev/null -w 'HTTP %{http_code}'

kill \$DEV_PID 2>/dev/null || true

echo ''
echo '빌드+dev 서버 정상 동작 확인 완료'"
}
