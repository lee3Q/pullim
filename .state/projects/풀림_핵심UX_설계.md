# 풀림 핵심 UX 설계 — 스토리형 파악 + 개인화

## 개요
풀림의 핵심 기능 설계/구현: 스토리형 파악 장면, 행동 기반 개인화, 홈 화면 길잡이 흐름.
대표 피드백 "설문 아닌 스토리"를 반영한 재설계가 핵심.

## 현재 단계: 4. 실행 (스토리형 재설계)

### 단계 정의
1. **리서치** ✅ 완료
2. **설계** ✅ 완료
   - UX 철학 6가지 확정 (제품/풀림_미션과_진짜UX_2026-03-25.md)
   - Seed 작성 + 교차검증 반영
3. **검증** ✅ 완료
   - 3-model 교차검증 (Opus + Sonnet + GLM-5)
   - 코드 1차 구현 + 빌드 성공
   - 대표 체감 테스트 → **"스토리형이어야 한다"** 피드백
4. **실행** ← 현재 (스토리형으로 재설계/재구현)
   - [x] 스토리형 파악 장면 설계 (3테마 x 10장면 = 30장면, 코드 구현 완료)
   - [x] 일러스트 33장 생성 + imagePath 연결 완료
   - [x] 홈 화면 "오늘 어떤 마음이야?" → 파악/입력 두 경로 (캐릭터 없이 시스템 UI)
   - [x] 코드 재구현 (설문형 → 스토리형, StoryDiscovery 컴포넌트)
   - [x] 추천 on/off 설정 UI (useSettings 훅 + 헤더 토글)
   - [x] discovery_selections Supabase 저장
   - ⚡ 품질검증 체크포인트
   - [x] **양방향 사다리 세션 플로우** — Seed 작성 + CC 검증 + 구현 완료 (mode=ladder)
     - 새 파일 12개: ladder-types, ladder-store, behind-the-scenes, prompt-builder, level-detector, response-parser, LadderSession, LadderSessionPage, 5 level components, CheatButton, SessionSummary
     - 기존 페이지 3개 수정 (adventure/garden/strategy — mode=ladder 분기 추가)
     - 홈 페이지 수정 (mode=ladder 라우팅)
     - 빌드 통과 확인
     - Seed↔구현 정합성 AC 15/15 전체 통과 (2라운드 검증)
     - Gap 수정 3건: 치트3회→접어둘까, 프로필기반 진입추천, 실제 세션요약 생성
     - Gap 수정 2건: 심심/궁금 진입경로 추가, 추천거부→ProbabilityProfile 반영
   - [x] **PWA 모바일 앱 설정** — manifest.json 보강 + Service Worker + iOS Apple 메타태그
     - 아이콘 파일(icons/icon-192.png, icon-512.png) 생성 필요 (디자인 에셋)
   - [x] **Capacitor iOS 셋업** — 네이티브 앱 껍데기, 코드 수정에 영향 없음
   - [x] **진입 UX 버그 수정 (CC 3-model 검증)** — 2026-03-26
     - localStorage 키 통일 (`pullim_profile` → `pullim_user_profile` 포맷)
     - 아웃트로 버튼 onClick 추가
     - 모든 경로가 파악을 거치도록 수정 (심심/궁금/고민있어 포함)
     - adventure_1.png 90도 회전 (세로→가로)
   - [x] **사다리 세션 데모 모드** — API 키 없이 전체 UX 흐름 테스트 가능
   - ⚡ 품질검증 체크포인트
   - [x] **내면사고 LLM** — if/else → Gemini Flash Lite LLM 추론 (비용 0원, 3초 타임아웃+폴백)
   - [x] **디자인 판타지 매칭** — 폰트(Gowun Batang+Noto Serif KR)/카드/버튼/색상 판타지화 완료. CSS 변수 통일. 3-model CC 통과.
   - [x] **위기 안전 시스템** — 클라이언트 Tier A 위기 감지 연결 완료 (SSE crisis 플래그 → CrisisAlert 모달). 빌드 통과.
   - [ ] **Claude API 실제 테스트** — 프롬프트 빌더 → 실제 응답 품질 확인
5. **최종 검증** — 대표 확인 + 교차검토 (배포 목표: 5/23 이후)

## 대표 피드백 (2026-03-25, 반드시 반영)
- 온보딩이 모험가 안에 있으면 안 됨 → **홈 화면에서 길잡이가 시작**
- 파악 질문 = 스토리 장면 안의 선택 (설문 X)
- 일러스트 필수
- "지금 뭘 원해?" 먼저 → 위로/분석/모르겠어 → 테마 추천
- 추천 on/off 가능해야

## 확정된 설계 철학
1. 단계적 감각화 = 양방향 사다리
2. 사용자 모델 = 확률 분포 (빈도가 성격)
3. 추천 = 관찰 도구 (틀림이 데이터)
4. 세계관 3개 유지, 모드 분리 X
5. 철학/심리학 → 이야기화
6. 고민 없어도 진입 가능

## 보류 사항
- Supabase 연결 (프로젝트 생성 + env 설정 + discovery_selections 테이블 생성) — 배포 준비 시 일괄 처리

## 참고 자료
- 제품/풀림_미션과_진짜UX_2026-03-25.md (핵심 UX 철학)
- 제품/풀림_진짜시작_2026-03-24.md (핵심 비전)
- .state/seeds/풀림_진짜UX_v1.md (Seed, 스토리형 재작업 필요)
- 이전 핸드오프: .state/handoffs/2026-03-25_handoff_3.md

## 상태
- 시작일: 2026-03-25 (분리)
- 상태: 진행 중
- 최종 갱신: 2026-03-26
