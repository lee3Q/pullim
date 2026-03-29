# 이미지 에셋 v2 — 전체 프롬프트 가이드

> 총 77장 | `scripts/prompts-v2.txt` | p도구 사용
> 생성 도구: GPT/DALL-E, Gemini/Imagen, 또는 기타 이미지 생성 AI

## 배치별 구성

### Batch 1: OG 소셜 공유 카드 (25장) — 바이럴 핵심
prompts-v2.txt 순서: #1~#25

**paste-macro.sh 설정:**
```bash
SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/og"
NAMES=(
  og_main
  og_adventure_quiet-strategist og_adventure_empathic-deliberator og_adventure_analytical-explorer og_adventure_bold-designer
  og_adventure_free-healer og_adventure_warm-guardian og_adventure_intuitive-breaker og_adventure_sensory-adventurer
  og_garden_quiet-strategist og_garden_empathic-deliberator og_garden_analytical-explorer og_garden_bold-designer
  og_garden_free-healer og_garden_warm-guardian og_garden_intuitive-breaker og_garden_sensory-adventurer
  og_strategy_quiet-strategist og_strategy_empathic-deliberator og_strategy_analytical-explorer og_strategy_bold-designer
  og_strategy_free-healer og_strategy_warm-guardian og_strategy_intuitive-breaker og_strategy_sensory-adventurer
)
```

**용도:** 카카오톡/인스타/트위터 공유 시 OG 이미지로 표시. `/result?theme=X&type=Y` 페이지의 openGraph.images 교체.
**비율:** 16:9 (1200×630 권장)

---

### Batch 2: 천문대 파악 장면 (11장) — 4번째 테마
prompts-v2.txt 순서: #26~#36

**paste-macro.sh 설정:**
```bash
SAVE_DIR="$SCRIPT_DIR/../pullim/public/assets/discovery"
NAMES=(
  stargazer_1 stargazer_2 stargazer_3 stargazer_4 stargazer_5
  stargazer_6 stargazer_7 stargazer_8 stargazer_9 stargazer_10
  stargazer_outro
)
```

**장면 요약:**
| # | 장면 | 핵심 선택 |
|---|------|-----------|
| 1 | 천문대 입구, 관측실 vs 옥상 | risk |
| 2 | 망원경 앞, 깜빡이는 별 | approach |
| 3 | 천문대 지기를 만남 | coping |
| 4 | 별자리 이야기 | decision |
| 5 | 유성우 — 소원을 빌 것인가 | risk + coping |
| 6 | 오래된 별 지도 발견 | approach |
| 7 | 구름이 몰려옴 — 기다릴 것인가 | decision + risk |
| 8 | 다른 관측자 — 같은 별, 다른 시각 | approach + coping |
| 9 | 새벽 직전 가장 밝은 별 | decision |
| 10 | 해가 뜨기 시작 | risk |
| outro | 별과 일출이 공존하는 순간 | — |

**비율:** 4:3
**코드 변경 필요:** story-scenes.ts에 STARGAZER_SCENES 추가, ThemeType에 "stargazer" 추가

---

### Batch 3: 천문대 캐릭터 (8장) — 유형별
prompts-v2.txt 순서: #37~#44

**paste-macro.sh 설정:**
```bash
SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/personality"
NAMES=(
  stargazer_quiet-strategist stargazer_empathic-deliberator stargazer_analytical-explorer stargazer_bold-designer
  stargazer_free-healer stargazer_warm-guardian stargazer_intuitive-breaker stargazer_sensory-adventurer
)
```

**캐릭터 컨셉:**
| 유형 | 천문대 이름 (제안) | 비주얼 |
|------|-------------------|--------|
| quiet-strategist | 별자리를 읽는 항해사 | 항법사, 육분의, 별 차트 |
| empathic-deliberator | 달의 뒷면을 궁금해하는 항해사 | 망원경, 달빛, 따뜻한 눈 |
| analytical-explorer | 미지의 행성을 계산하는 항해사 | 홀로그램 성도, 탐구 |
| bold-designer | 새 항로를 그리는 항해사 | 함장 코트, 은하수 |
| free-healer | 흐르는 별을 따라가는 항해사 | 오로라, 무중력, 자유 |
| warm-guardian | 등대를 지키는 항해사 | 우주 등대, 금빛 빔 |
| intuitive-breaker | 블랙홀을 향해 뛰어드는 항해사 | 혜성, 소행성대 돌파 |
| sensory-adventurer | 오로라를 느끼는 항해사 | 성운, 무지개빛, 경이 |

**비율:** 1:1
**스타일:** Cosmic illustration, 기존 3테마 캐릭터와 동일 품질

---

### Batch 4: 홈 테마 카드 (4장)
prompts-v2.txt 순서: #45~#48

**paste-macro.sh 설정:**
```bash
SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/home"
NAMES=(
  home_card_garden home_card_adventure home_card_strategy home_card_stargazer
)
```

**용도:** 홈 화면 테마 선택 카드의 배경 이미지. 현재 emoji만 사용 → 이미지로 교체.
**비율:** 3:4 (세로형 카드)

---

### Batch 5: 세션 배경 보강 (9장)
prompts-v2.txt 순서: #49~#57

**paste-macro.sh 설정:**
```bash
SAVE_DIR="$SCRIPT_DIR/../pullim/public/assets"
NAMES=(
  adventure-conclude-bg adventure-research-bg strategy-conclude-bg
  stargazer-enter-bg stargazer-listen-bg stargazer-research-bg
  stargazer-crystal-bg stargazer-conclude-bg stargazer-avatar
)
```

**기존 재사용 해소:**
- adventure CONCLUDE: enter-bg 재사용 → 전용 배경
- adventure RESEARCH: listen-bg 재사용 → 전용 배경
- strategy CONCLUDE: strategy-bg 재사용 → 전용 배경

**천문대 신규:**
- enter, listen, research, crystal, conclude: 세션 단계별 배경
- avatar: 천문대 지기 캐릭터 (세션 안내자)

**비율:** 9:16 (풀스크린 모바일), avatar만 1:1

---

### Batch 6: 세션 레벨 일러스트 (15장)
prompts-v2.txt 순서: #58~#72

**paste-macro.sh 설정:**
```bash
SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/levels"
NAMES=(
  adventure_level1 adventure_level2 adventure_level3 adventure_level4 adventure_level5
  garden_level1 garden_level2 garden_level3 garden_level4 garden_level5
  strategy_level1 strategy_level2 strategy_level3 strategy_level4 strategy_level5
)
```

**레벨 진행 컨셉:**
| Level | 의미 | 모험가 | 달빛정원 | 전략실 |
|-------|------|--------|---------|--------|
| 1 듣기 | 시작 | 숲 가장자리 모닥불 | 정원 입구 벤치 | 빈 회의실 |
| 2 관찰 | 패턴 발견 | 숲 깊이 동물 발자국 | 이슬+반딧불 | 데이터 스트림 |
| 3 탐구 | 깊은 탐색 | 유적 발견 | 별 비친 연못 | 홀로그램 3D |
| 4 통찰 | 큰 그림 | 절벽 위 전경 | 뿌리 연결 | 핵심 인사이트 |
| 5 결단 | 행동 준비 | 빛나는 길 선택 | 새벽 정원 | 실행 계획 완성 |

**비율:** 4:3
**용도:** 사다리 세션 중 레벨 전환 시 분위기 변화 일러스트

---

### Batch 7: 마케팅 (5장)
prompts-v2.txt 순서: #73~#77

**paste-macro.sh 설정:**
```bash
SAVE_DIR="$SCRIPT_DIR/../pullim/public/images/marketing"
NAMES=(
  marketing_intro_1 marketing_intro_2 marketing_intro_3
  marketing_banner marketing_summary
)
```

**용도:**
- intro_1: 세 세계 나란히 (앱 소개 인스타 카드)
- intro_2: 내면의 세 가지 빛 (자기발견 개념)
- intro_3: 폰에서 판타지 세계가 나옴 (제품 개념)
- banner: 에브리타임/커뮤니티 배너 (16:9)
- summary: 빛나는 문 (초대 느낌, 1:1)

---

### Batch 8: 앱 아이콘 변형 (5장)
prompts-v2.txt 순서: #78~#82

**paste-macro.sh 설정:**
```bash
SAVE_DIR="$SCRIPT_DIR/../pullim/public/icons"
NAMES=(
  icon_v2_knot icon_v2_brush icon_v2_moon icon_v2_spiral icon_v2_venn
)
```

**변형 컨셉:**
| # | 이름 | 컨셉 | 특징 |
|---|------|------|------|
| 1 | knot | 풀리는 매듭 (현재 개선) | 매듭이 풀려 빛 입자로 흩어짐 |
| 2 | brush | "풀" 캘리그래피 | 한글 글자 자체가 아이콘 |
| 3 | moon | 달+씨앗/진주 | 달빛정원 분위기, 미니멀 |
| 4 | spiral | 미로→중심 빛 | 복잡함 속 명확함 |
| 5 | venn | 3원 교집합 | 3테마 상징, 모던 |

**용도:** 5가지 중 최종 1개 선택 → icon-192.png, icon-512.png 교체 + favicon
**비율:** 1:1 (정사각)

---

## 사용 순서

```bash
# 1. prompts-v2.txt를 prompts.txt로 교체
cp scripts/prompts-v2.txt scripts/prompts.txt

# 2. paste-macro.sh에서 NAMES/SAVE_DIR을 Batch 1로 설정

# 3. 디렉토리 생성
mkdir -p pullim/public/images/{og,home,levels,marketing}

# 4. 큐 초기화 + 실행
p reset
p       # 하나씩 전송
ps      # 생성된 이미지 저장 (또는 p dl)

# 5. Batch 1 완료 후 → NAMES/SAVE_DIR을 Batch 2로 변경, p reset, 반복
```

## 배치 간 전환 팁
- `p reset` 후 `p skip`으로 이전 배치 건너뛰기 가능
- 또는 배치별로 별도 prompts.txt 파일 생성:
  - `scripts/prompts-batch1-og.txt`
  - `scripts/prompts-batch2-stargazer.txt` 등
- PROMPTS_FILE 변수를 변경하면 됨

## 코드 변경 체크리스트 (이미지 생성 후)

- [ ] `story-scenes.ts`: ThemeType에 `"stargazer"` 추가, STARGAZER_SCENES 배열
- [ ] `personality-type.ts`: themedName/themedEmoji/themedAttitude에 stargazer 추가
- [ ] `app/stargazer/[id]/page.tsx`: 새 세션 페이지
- [ ] `app/page.tsx`: THEME_CARDS에 stargazer 추가, home_card 이미지 연결
- [ ] `app/result/page.tsx`: OG 이미지를 `/images/og/og_{theme}_{type}.png`로 교체
- [ ] `app/layout.tsx`: 메인 OG 이미지를 `/images/og/og_main.png`로 교체
- [ ] 레벨 일러스트 컴포넌트 연결 (LadderSession에서 레벨 변경 시 배경 전환)
