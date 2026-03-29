HARNESS_FILE="$PROJECT_ROOT/.state/handoffs/2026-03-29_handoff_7.md"
TASK_TIMEOUT=2400

tasks() {
  COMMON="프로젝트 루트: ~/study/main/pullim. 하네스: $HARNESS_FILE 읽어라."

  run_task 1 "프롬프트100장" "$COMMON

이미지 프롬프트 100장을 scripts/prompts-v4.txt에 작성해라. --- 구분자로 분리.

기존 스타일 참조: scripts/prompts-v3.txt 를 읽고 동일한 포맷(스타일 지시어+배경+색상+비율+장면묘사)을 따라라.

배분 (정확히 이 순서와 수량):

[1-8] 천문대 OG 공유카드 8장 — 8유형별. 1:1 정사각, Cosmic illustration style, deep purple+gold. 각 유형 성격이 드러나는 별/우주 장면. 파일명 주석: og_stargazer_{type}.png

[9-20] 앱스토어 스크린샷 12장 — 앱 UI가 보이는 목업 스타일. 6.5인치 프레임, 다크배경. 테마별 대표 장면 3장씩(모험가/정원/전략실/천문대). 파일명 주석: appstore_{N}.png

[21-35] 마케팅 15장 — SNS 공유용. 감성 일러스트+짧은 문구 공간. 9:16 세로. 5테마×3장. 파일명 주석: marketing_{theme}_{N}.png

[36-50] UI연출 15장 — 앱 내 배경/카드 장식. 4:3 가로. 추상적 분위기 일러스트. 세션요약배경5+레벨전환5+로딩5. 파일명 주석: ui_{purpose}_{N}.png

[51-95] 아포칼립스 45장:
  [51-65] discovery 15장 — 파악 장면. 4:3 가로. Post-apocalyptic illustration style, warm ember and ash tones, dark background with orange/amber glow. 폐허+감성. pullim/src/lib/personalization/story-scenes.ts의 APOCALYPSE_SCENES 각 장면 illustration 필드 참조. 파일명 주석: apocalypse_{N}.png
  [66] outro 1장 — 언덕 위 두 사람, 폐허와 초록 공존 풍경. 파일명: apocalypse_outro.png
  [67-74] personality 8장 — 8유형 캐릭터. 정사각 1:1. 종말 세계관 속 생존자 캐릭터. personality-type.ts의 apocalypse themedName 참조. 파일명: apocalypse_{type}.png
  [75-82] OG 공유카드 8장 — 1:1. 유형별 종말 장면. 파일명: og_apocalypse_{type}.png
  [83-87] levels 5장 — 사다리 레벨1-5. 4:3. 레벨 올라갈수록 폐허→초록 변화. 파일명: apocalypse_level{N}.png
  [88] home 카드 1장 — 홈 테마 선택 카드. 4:3. 폐허 도시 실루엣+엠버빛. 파일명: home_card_apocalypse.png
  [89-93] backgrounds 5장 — 세션 배경. 16:9 가로. enter/listen/research/conclude/complete. 파일명: apocalypse-{stage}-bg.png
  [94] avatar 1장 — 동행자 캐릭터. 정사각. 후드 쓴 따뜻한 느낌의 생존자. 파일명: apocalypse-avatar.png
  [95] enter-bg 1장 — 테마 진입 배경. 16:9. 폐허 도시 파노라마+석양. 파일명: apocalypse-enter-bg.png

[96-100] 랜딩 5장 — 웹 랜딩페이지 히어로/섹션. 16:9 가로. 풀림 전체 분위기. 파일명: landing_{N}.png

중요: 각 프롬프트에 no text 포함. 모든 프롬프트는 영어로 작성."

  run_task 2 "이미지매핑확인" "$COMMON

pullim/src/lib/personalization/story-scenes.ts를 읽고, 모든 테마의 imagePath가 실제 존재하는 파일을 가리키는지 확인해라.

확인 방법: 각 imagePath에 해당하는 파일이 pullim/public/ 아래에 존재하는지 ls로 확인.
없는 파일 목록을 /tmp/missing-images.txt에 저장.
있는데 경로가 잘못된 것도 포함.

특히 stargazer(천문대) 테마 이미지 매핑이 안 맞다는 피드백이 있었으니 꼼꼼히 확인.
apocalypse 테마는 이미지가 아직 없으니 목록만 만들어라.

결과를 .state/daily/2026-03-29_image_audit.md에 저장."

  run_task 3 "빌드확인" "$COMMON

cd pullim && npm run build 2>&1 | tail -20
빌드 실패하면 에러 수정하고 재빌드."
}
