# 스토리 파악 장면 — 이미지 생성 프롬프트

> 프롬프트 큐 사용: `bash scripts/prompt-queue.sh scripts/prompts.txt`
> 이미지 생성 후 `pullim/public/assets/discovery/` 에 저장, `story-scenes.ts`에 imagePath 추가

## 달빛정원 (GPT/DALL-E 추천)

**garden_1** — 정원 입구, 두 갈래 길
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A misty garden entrance at night, small stone steps leading to two diverging paths. One path has colorful flowers blooming, the other is a quiet stone wall path. Faint bench visible in the distance. Moonlight filtering through fog. Dark green and purple tones.

**garden_2** — 벤치의 낯선 사람
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A person sitting alone on a garden bench seen from behind, shoulders slightly slumped. Stone wall path beside them, soft moonlight. Lonely but peaceful atmosphere. Dark green and blue tones.

**garden_3** — 대화 시작
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. Two people sitting on a garden bench, one turning their head with a gentle smile. Warm subtle glow between them. Night garden setting with flowers nearby. Intimate quiet mood.

**garden_4** — 연못의 달
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. Two silhouettes sitting by a garden pond at night. Full moon reflected perfectly on the still water surface. Dreamy philosophical atmosphere. Deep blue and silver tones.

**garden_5** — 비가 오기 시작
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. Raindrops beginning to fall in a moonlit garden. A small traditional pavilion visible in the distance. Moody atmosphere with gentle storm approaching. Blue-grey tones.

**garden_6** — 나비 한 마리
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. Rain has stopped in a night garden. A single luminous butterfly hovering near an outstretched hand. Dewdrops on leaves catching moonlight. Magical delicate moment. Soft cyan and green glow.

**garden_7** — 오래된 나무의 글
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. Massive old tree trunk in a moonlit garden. Ancient carved text barely visible on the bark glowing faintly. Moss and small flowers at the base. Mysterious wise atmosphere.

**garden_8** — 시든 꽃과 물뿌리개
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A watering can sitting alone in a corner of a night garden. A few wilted flowers nearby with petals falling. Melancholic but hopeful mood. Muted warm tones against dark background.

**garden_9** — 돌 위의 고양이
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A cat curled up on a warm flat stone in a moonlit garden. Eyes half-open gazing lazily. Peaceful contemplative atmosphere. Warm amber glow on stone against cool blue garden.

**garden_10** — 안개 속 종소리
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. Thick fog rolling through a deep garden path at night. Faint glow of a small bell or wind chime barely visible through the mist. An unexplored path leading into the unknown. Ethereal mysterious atmosphere.

**garden_outro** — 파악 완료 전환
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A person standing up from a garden bench, smiling and waving goodbye. The garden around them is slightly brighter than before. Warm hopeful ending. Soft golden and green tones.

## 모험가 (Gemini/Imagen 추천)

**adventure_1** — 숲 입구, 두 갈래 길
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A dense forest entrance with two diverging paths. One sunlit and wide, the other dark and narrow with birds singing. Adventurous atmosphere. Rich greens and golden light contrast.

**adventure_2** — 보물상자
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. An old treasure chest sitting in a forest clearing. A rusty lock on it with a key-like object nearby. The chest seems to move slightly. Mysterious atmosphere. Warm brown and gold tones.

**adventure_3** — 부상당한 여행자
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A traveler collapsed by the roadside in a forest, holding their ankle in pain. Dappled light through trees. Sympathetic atmosphere. Muted earth tones with soft green.

**adventure_4** — 마왕의 제안
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. Glowing eyes in deep darkness. A booming voice from the shadows. Dramatic confrontation moment in a dark forest. Purple and red ominous glow against black.

**adventure_5** — 절벽과 밧줄
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A cliff edge with something sparkling far below. A frayed old rope hanging down the cliff face. Dangerous but tempting scene. Dramatic height perspective. Blue sky and rocky brown tones.

**adventure_6** — 세 갈래 길
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. Three forking paths in a forest. A weathered signpost with illegible text. Water sounds from the left, silence in the middle, smoke smell from the right. Mysterious crossroads atmosphere.

**adventure_7** — 여인숙
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A small village at night with a crooked inn sign. Warm firelight and laughter spilling from the windows. Slightly unsettling but inviting. Warm orange against dark blue night.

**adventure_8** — 동굴 속 빛
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A deep cave entrance with ethereal blue light seeping from within. Beautiful but unknown. Rocky dark exterior contrasting with magical blue interior glow.

**adventure_9** — 강 건너기
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A wide rushing river with strong current. Remnants of a broken bridge. Forest on both sides. Challenging crossing ahead. Blue water with white rapids against green banks.

**adventure_10** — 탑 꼭대기
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. Top of a tall stone tower, wind blowing strongly. Panoramic view of the land below. A carved inscription on the edge. Dramatic height with vast sky. Golden sunset and grey stone.

**adventure_outro** — 모험 완료 전환
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A lone adventurer standing on a hilltop overlooking the journey behind. The full path visible below. Triumphant reflective moment. Warm golden light and vast landscape.

## 전략실 (GPT 또는 Gemini)

**strategy_1** — 첫 브리핑
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A modern meeting room with a large whiteboard showing two strategy options labeled A and B. Clean corporate interior. Cool blue and white tones with focused lighting.

**strategy_2** — 보고서 오류
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A monitor screen filled with dense numbers and a spreadsheet. A red circle highlighting a discrepancy. Focused analytical atmosphere. Blue screen glow against dark office.

**strategy_3** — 팀원의 실수
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. An office scene with a teammate holding their head in frustration. An error screen on their monitor. Stressful but human moment. Warm office tones with red error glow.

**strategy_4** — 회의실 결정
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A long conference table with two groups of people sitting on opposite sides. Tense meeting atmosphere. The head seat is empty, waiting for a decision maker. Cool professional lighting.

**strategy_5** — 경쟁사 기습
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A laptop showing a news alert notification with a competitor company logo. Urgent disruption moment. Blue notification glow against dark workspace.

**strategy_6** — 모호한 요청
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. An email on screen with a long confusing message. The recipient looking puzzled. Ambiguous communication moment. Soft white screen glow in dim office.

**strategy_7** — 마감 압박
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A calendar with a red deadline date circled. Stack of new request memos piling up beside it. Pressure and urgency. Red accent against organized desk.

**strategy_8** — 상사의 자유재량
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A boss walking away smiling, leaving behind an empty whiteboard in a meeting room. Freedom but uncertainty. Bright empty whiteboard against dim room.

**strategy_9** — 야근 판단
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. An office at night, dark sky outside the window. A half-finished document on the monitor. Coffee cup nearby. Late night work dilemma. Warm monitor glow against dark window.

**strategy_10** — 반대 의견
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A presenter at a podium, one audience member raising their hand to challenge. Slight tension in the room. Professional presentation atmosphere. Spotlight on speaker with dim audience.

**strategy_outro** — 전략실 완료 전환
> Soft illustration style, dark moody background, subtle glow, minimal details, mobile app card size 4:3 ratio, no text. A clean desk with a completed strategy document. Confidence and clarity after decisions. Morning light coming through office window. Fresh organized atmosphere.
