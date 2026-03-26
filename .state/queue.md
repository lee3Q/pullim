# 작업 큐 — 우선순위 순

> **규칙**: 새 세션 시작 시 이 파일을 읽고, 1번부터 실행한다.
> 완료 시 해당 항목을 [x]로 바꾸고 프로젝트 파일도 갱신한다.
> 대표 판단 필요한 항목은 🔴 표시 — 실행하지 말고 리포트에 올린다.
> 새 작업 발견 시 적절한 위치에 추가한다.

## 매 세션 루틴 (항상)

> 상세 루틴: `.state/routines.md` 참조

**아침 세션** (첫 세션):
- [ ] 일일 리포트 생성 → `.state/daily/YYYY-MM-DD_morning.md`
- [ ] 풀림 체험 — Playwright로 홈→파악→세션 풀코스 1회. 어색한 점 리포트에 포함
- [ ] 🔴 항목 대표 판단 대기 → 판단 받으면 즉시 실행

**밤 세션** (마지막 세션, "마무리"/"밤 루틴" 시):
- [ ] queue.md 갱신 + 프로젝트 파일 갱신
- [ ] /handoff 실행
- [ ] 밤 리포트 생성 → `.state/daily/YYYY-MM-DD_evening.md`
- [ ] 밤샘 배치 필요 시 준비

**항상**:
- [ ] 두어스 소재 감지 → `아산두어스_신청.md` 수집 로그에 추가 (04-20까지)

## 즉시 실행 (승인 불필요)

- [ ] **위기 안전 시스템 사다리 적용 확인** — 사다리 세션에서 RED 감지가 작동하는지 코드 확인. crisis-detector가 sensoryLadderContext 경로에서도 호출되는지 검증. 안 되면 수정.
  - 참고: `pullim/src/lib/safety/crisis-detector.ts`, `pullim/src/app/api/ultimate/listen/route.ts`
  - 프로젝트: 풀림_핵심UX_설계.md

- [ ] **디자인 판타지 매칭** — 현재 모던 UI(둥근 카드, 시스템 폰트)가 판타지 일러스트와 안 어울림. 폰트/카드 배경/버튼 스타일을 판타지 세계관에 맞게 수정. CC로 검증.
  - 참고: StoryDiscovery.tsx의 SceneCard, 홈 화면 page.tsx
  - 프로젝트: 풀림_핵심UX_설계.md

- [ ] **내면사고 LLM 검증** — behind-llm.ts 구현 완료됐으나 실제 Gemini API 호출 테스트 미수행. .env.local에 GEMINI_API_KEY가 있는지 확인하고, 없으면 데모 모드에서 폴백 작동하는지 확인.
  - 참고: `pullim/src/lib/session/behind-llm.ts`, `behind-the-scenes.ts`
  - 프로젝트: 풀림_핵심UX_설계.md

- [ ] **StoryDiscovery continue-prompt 조건 버그** — `nextIndex >= story.minScenes && nextIndex === story.minScenes`는 중복 조건. `sceneStartTime` 리셋 누락. CC에서 Sonnet이 발견.
  - 참고: StoryDiscovery.tsx line 73 부근
  - 프로젝트: 풀림_핵심UX_설계.md

## 대표 확인 후 실행

- [ ] 🔴 **Claude API 실제 세션 테스트** — API 키 넣고 실제 세션 1회 돌리기. 비용 발생. 대표 확인 후 실행.
  - 예상 비용: 세션 1회 ~$0.05-0.10
  - 프로젝트: 풀림_핵심UX_설계.md

- [ ] 🔴 **UI 게임화 개편 프로젝트 정리** — 핵심UX 재설계와 겹치는 부분 정리. _done으로 보낼지 범위 재정의할지.
  - 프로젝트: _backlog/UI_게임화_개편.md

## 보류 (5/23 이후)

- [ ] Supabase 연결 + 세션 영속화
- [ ] Vercel 배포 + 모바일 테스트
- [ ] 고민 라우팅 실행 (사다리 기준 재설계 완료)
- [ ] 모델 저비용화 실행 (사다리 기준 재설계 완료)
- [ ] 감각 레벨 이미지 카드 (현재 이모지+텍스트)
- [ ] PWA 아이콘 생성 (192px, 512px)

## 완료

- [x] Capacitor iOS 셋업 (2026-03-26)
- [x] localStorage 키 버그 수정 (2026-03-26)
- [x] 아웃트로 버튼 onClick 수정 (2026-03-26)
- [x] 모든 경로 파악 거치도록 수정 (2026-03-26)
- [x] 사다리 세션 데모 모드 (2026-03-26)
- [x] 내면사고 LLM 구현 — Gemini Flash Lite (2026-03-26)
- [x] 진입 UX CC 3-model 검증 (2026-03-26)
- [x] 백로그 프로젝트 정합성 최신화 (2026-03-26, 다른 세션)
