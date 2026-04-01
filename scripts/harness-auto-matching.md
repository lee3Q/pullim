# 하네스: 테마 자동 매칭 구현

## 배경
슬라이드 6장에 "자동 매칭 기능 존재"라고 적혀 있으나, `getRecommendedIndex()`가 항상 0을 반환하는 stub 상태.
프로필 axis 데이터(approachStyle, riskTolerance, copingStyle, decisionSpeed)가 이미 존재하므로, 이를 테마 특성과 매칭하면 된다.

## 공통 규칙
- 기존 파일을 **먼저 읽고** 최신 상태 위에서 수정
- 파일 수정 후 반드시 `cd ~/study/main/pullim/pullim && npx next build` 로 빌드 확인
- 커밋 메시지: `feat: [간단 설명]`

---

## Task 1: getRecommendedIndex 실제 로직 구현

**수정 대상**: `pullim/src/lib/personalization/recommendation-engine.ts`

**해야 할 것**:
1. 먼저 파일을 읽어라
2. 먼저 `pullim/src/lib/personalization/probability-profile.ts` 읽어서 ProbabilityProfile 타입 확인
3. `getRecommendedIndex()` 함수를 아래 로직으로 교체:
   - _profile이 null이면 → 0 반환 (기존 동작 유지)
   - profile이 있으면 → 각 옵션 텍스트를 프로필 차원과 매칭
   - 매칭 로직:
     - 옵션 텍스트에서 감성/직관 키워드 → copingStyle.value > 0 일수록 높은 점수
     - 옵션 텍스트에서 논리/분석 키워드 → approachStyle.value < 0 일수록 높은 점수
     - 옵션 텍스트에서 도전/모험 키워드 → riskTolerance.value > 0 일수록 높은 점수
     - 옵션 텍스트에서 신중/안전 키워드 → riskTolerance.value < 0 일수록 높은 점수
   - 가장 높은 점수의 옵션 인덱스 반환
   - 점수가 동률이면 첫 번째 반환
4. 키워드 매칭은 간단한 배열 includes로 충분 (ML 불필요):
   ```
   const EMPATHY_KEYWORDS = ["마음", "감정", "느낌", "위로", "편안", "기다", "들어"];
   const ANALYTICAL_KEYWORDS = ["분석", "논리", "비교", "정리", "데이터", "이유", "근거"];
   const ADVENTUROUS_KEYWORDS = ["도전", "모험", "새로", "시도", "과감", "직감"];
   const CAUTIOUS_KEYWORDS = ["신중", "안전", "천천", "조심", "확인", "생각"];
   ```
5. 함수 시그니처는 그대로 유지 (_profile → profile로 언더스코어 제거)

**검증**: 빌드 통과

---

## Task 2: 테마 자동 추천 함수 추가

**수정 대상**: `pullim/src/lib/personalization/recommendation-engine.ts`

**해야 할 것**:
1. 새 함수 `getRecommendedTheme(profile: ProbabilityProfile): ThemeType` 추가
2. 테마-프로필 매핑:
   - **달빛정원(garden)**: copingStyle > 0 (공감형) + riskTolerance < 0 (신중)
   - **모험가(adventure)**: riskTolerance > 0 (모험적) + approachStyle > 0 (직관)
   - **전략실(strategy)**: approachStyle < 0 (분석적) + decisionSpeed < 0 (숙고)
   - **천문대(stargazer)**: riskTolerance > 0 + copingStyle 중립 근처
   - **종말(apocalypse)**: riskTolerance > 0.3 + decisionSpeed > 0 (자극 추구)
3. 각 테마에 대해 적합도 점수(0~1) 계산 → 최고점 테마 반환
4. profile이 관찰 부족(totalObservations < 3)이면 "adventure" 기본값
5. `ThemeType` import: `import type { ThemeType } from "./story-scenes";`

**검증**: 빌드 통과

---

## Task 3: 홈 화면에서 자동 추천 표시

**수정 대상**: `pullim/src/app/page.tsx`

**해야 할 것**:
1. 먼저 파일을 읽어라
2. `getRecommendedTheme`를 import
3. 컴포넌트 마운트 시 localStorage에서 `pullim_user_profile` 읽기
4. 프로필이 있으면 `getRecommendedTheme(profile)` 호출
5. 추천된 테마 카드에 작은 배지 표시: `✦ 추천` (기존 추천 배지 스타일과 통일)
6. 프로필이 없으면 (첫 방문) 배지 없음 — 아무 동작 안 함
7. settings.showRecommendations가 false면 배지 숨김

**검증**: 빌드 통과

---

## 예상 시간: 30분
## 우선도: 슬라이드 정합성 — 발표 전까지 완료
