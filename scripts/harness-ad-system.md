# 하네스: 광고 시스템 구현 (세션 진입/종료)

## 배경
슬라이드 7장 수익 모델에 "광고: 세션 진입/종료 시 (배너 없음)"이라 적혀 있으나 코드 0줄.
세션 시작 전, 종료 후에 전면 광고(인터스티셜) 슬롯을 표시하는 UI를 구현한다.
실제 광고 네트워크(AdMob 등)는 아직 연결하지 않고, **플레이스홀더 UI + 해금 로직**만 구현.

## 공통 규칙
- 기존 파일을 **먼저 읽고** 최신 상태 위에서 수정
- 파일 수정 후 반드시 `cd ~/study/main/pullim/pullim && npx next build` 로 빌드 확인
- 커밋 메시지: `feat: [간단 설명]`
- 기존 UI 톤(판타지 다크) 유지 — 광고 슬롯도 세계관에 맞게

---

## Task 1: 광고 컴포넌트 + 훅 생성

**생성 대상**:
- `pullim/src/components/AdInterstitial.tsx` — 전면 광고 컴포넌트
- `pullim/src/hooks/useAdGate.ts` — 광고 게이트 훅

**AdInterstitial.tsx 스펙**:
1. 전면 모달 (z-50, 화면 전체 덮기)
2. 플레이스홀더 UI:
   - 중앙에 "광고 영역" 텍스트 + 테마 색상 테두리 박스 (300x250 비율)
   - 3초 카운트다운 → "닫기" 버튼 활성화
   - 또는 "광고 없이 시작" 버튼 (유료 사용자용, 현재는 비활성)
3. Props: `onClose: () => void`, `placement: "session-start" | "session-end"`, `theme?: string`
4. 판타지 스타일: 반투명 배경 + rpg 폰트 + 세계관 톤 유지
5. `placement`에 따라 문구 변경:
   - session-start: "잠시 후 세션이 시작됩니다"
   - session-end: "세션이 끝났습니다. 다음에 또 만나요"

**useAdGate.ts 스펙**:
1. `const { shouldShowAd, markAdShown, sessionsUntilAd } = useAdGate()`
2. localStorage 기반 카운터: `pullim_ad_state`
   - `{ sessionsCompleted: number, lastAdShown: string (ISO), adFreeUntil: string | null }`
3. 기본 규칙: 매 세션마다 진입 시 광고 표시 (첫 세션은 제외)
4. `adFreeUntil`이 미래 날짜면 광고 스킵 (유료 구독 대비)
5. `markAdShown()`: sessionsCompleted++, lastAdShown 갱신

**검증**: 빌드 통과

---

## Task 2: LadderSession에 광고 게이트 연결

**수정 대상**: `pullim/src/components/session/LadderSession.tsx`

**해야 할 것**:
1. 먼저 파일 전체를 읽어라
2. `useAdGate`와 `AdInterstitial`을 import
3. **세션 진입 시** (Phase가 "entry"에서 "session"으로 전환되는 시점):
   - `shouldShowAd`가 true면 Phase를 "ad-start"로 설정
   - AdInterstitial 표시 → onClose → 원래 "session" Phase로 전환
4. **세션 종료 시** (Phase가 "summary"로 전환되는 시점):
   - AdInterstitial (placement="session-end") 표시
   - onClose → SessionSummary 표시
5. Phase 타입에 `"ad-start" | "ad-end"` 추가
6. `markAdShown()` 호출은 광고 닫을 때

**주의**:
- 기존 entry→session 전환 로직을 깨지 마라
- 광고가 없는 경우(첫 세션, 유료) 기존 흐름 그대로
- 데모 모드에서도 광고 표시 (제품 체험용)

**검증**: 빌드 통과

---

## 예상 시간: 30분
## 우선도: 슬라이드 정합성 — 발표 전까지 완료
