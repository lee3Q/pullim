# 밤배치 하네스 — 2026-03-28 UI 전수 조사 + 수정

**실행 모델**: Sonnet (claude -p)
**웹앱 루트**: ~/study/main/pullim/pullim/
**프로젝트 루트**: ~/study/main/pullim/
**예상 소요**: 5시간+
**배경**: 다음 주 12명에게 실제 배포 예정. 배포 품질까지 UI를 끌어올려야 함.

---

## 제약 (2단계 — 충돌 시 범위 제약이 우선)

### 범위 제약 (어기면 즉시 중단, 어떤 상황에서도 예외 없음)
1. 새 파일 생성 금지 — 기존 파일 수정만
2. 새 npm 패키지 설치 금지
3. API route 프롬프트/시스템 메시지 수정 금지 — 파서/렌더러만 수정
4. CSS 변수(--fantasy-* 등) 값 변경 금지 — 새 CSS 속성 추가만 허용
5. 파일 삭제 금지
6. `git reset` 명령 사용 금지 — 롤백은 `git checkout -- [파일]`만

### 절차 게이트 (모든 수정에 적용)
7. 수정은 1파일씩 — 1파일 수정 → `npx next build` → 통과 → 다음 파일
8. 빌드 실패 시 → `git checkout -- [파일]` → 원인 기록 → 다른 접근 시도
9. Playwright 스크린샷 없이 "완료" 선언 금지
10. 커밋은 Task 단위 — 한 커밋에 여러 Task 섞지 마라
11. 추측으로 수정 금지 — 코드를 읽고 원인을 특정한 후에만 수정

---

## 선행 조건 (첫 번째로 실행. 읽지 않으면 작업 시작 금지)

```
1. cat ~/study/main/pullim/.state/handoffs/2026-03-28_handoff_13.md
2. cat ~/study/main/pullim/.state/project-config.md
3. cat ~/study/main/pullim/.state/projects/풀림_핵심UX_설계.md
4. cd ~/study/main/pullim/pullim && npx next build   ← 현재 빌드 상태 확인
5. git log --oneline -3   ← 현재 커밋 확인
```

빌드 실패 시 → 작업 시작 전에 빌드 수정부터.

---

## Task 1: 스크롤바 다크 테마

**수정 파일**: `pullim/src/app/globals.css` (이 파일만)
**수정 내용**: 파일 맨 끝에 아래 추가 (기존 내용 절대 수정 금지):

```css
/* 다크 스크롤바 — 판타지 테마 (Windows Chrome 대응) */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(255,255,255,0.15) transparent;
}
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 3px; }
::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.25); }
```

**검증**: `npx next build` 통과.
**커밋**: `git add pullim/src/app/globals.css && git commit -m "fix: 다크 스크롤바 CSS (Windows Chrome 대응)"`

---

## 체크포인트 1
```
echo "=== 체크포인트 1 ===" && git log --oneline -1 && date
```
Task 1 커밋 확인 후 Task 2로.

---

## Task 2: `<태그>` 깨짐 — 재현 먼저, 수정은 재현 후에만

### Step 2-0: 재현 확인 (수정 전. 이 단계를 건너뛰면 안 됨)
1. `cd ~/study/main/pullim/pullim && npm run dev &` 로 dev 서버 시작
2. `curl -s http://localhost:3000 | head -5` 로 서버 응답 확인 (응답 없으면 10초 대기 후 재시도, 3회 실패 시 "dev 서버 실패" 기록하고 Task 3으로)
3. Playwright로 `http://localhost:3000` 접속
4. 달빛정원 클릭 → "건너뛰고 바로 대화하기" 클릭 → 세션 진입
5. 세션 화면 스크린샷 촬영
6. **스크린샷에서 `<`, `>` 기호가 태그처럼 보이는 텍스트가 있는가?**
   - **있으면** → Step 2-1로
   - **없으면** → "재현 불가" 기록, Task 2 스킵, Task 3으로

### Step 2-1: 원인 특정 (재현 성공한 경우만)
아래 파일을 **이 순서대로** 읽어라 (하나도 건너뛰지 마라):
1. `pullim/src/lib/session/response-parser.ts` — 이미 태그 제거 로직이 있는지 확인
2. `pullim/src/lib/demo.ts` — 데모 데이터에 태그가 포함됐는지 확인
3. `pullim/src/lib/session/demo-ladder.ts` — 사다리 데모에 태그가 포함됐는지 확인
4. `pullim/src/components/game/GameDialogue.tsx` — 렌더링에서 태그가 새는지 확인

**기록할 것**: "태그가 새는 정확한 파일명:라인번호" → 이것을 기록한 후에만 수정 시작.

### Step 2-2: 수정
- response-parser에 이미 태그 제거가 있으면 → 누락된 패턴만 추가
- 데모 데이터에 태그가 있으면 → 데모 데이터 정리
- 렌더러에서 새면 → 렌더러에 strip 추가

### Step 2-3: 검증
- 빌드 통과
- Playwright로 동일 경로 재확인 → 태그 없음 스크린샷
- 커밋: `git commit -m "fix: AI 응답 태그 노출 제거"`

---

## 체크포인트 2
```
echo "=== 체크포인트 2 ===" && git log --oneline -1 && date
```

---

## Task 3: 4테마 전수 E2E 테스트 + 즉시 수정

### 사전 준비
dev 서버가 이미 떠있으면 재사용. 안 떠있으면:
```bash
cd ~/study/main/pullim/pullim && npm run dev &
sleep 5 && curl -s http://localhost:3000 | head -1  # 응답 확인
```

### 테스트 경로 (Playwright 동작 순서 — 정확히 따라라)

**경로 A — 파악 풀코스**:
1. `http://localhost:3000` 접속
2. 테마 카드 클릭 (text selector: "달빛정원" / "모험가의 숲" / "전략실" / "천문대")
3. "출발" 버튼 클릭
4. 각 장면에서 첫 번째 선택지 클릭 (장면이 끝날 때까지 반복)
5. 유형 결과 화면 → 스크린샷
6. "고민도 풀어볼래?" 또는 하단 버튼 클릭 → 세션 진입
7. 세션 화면 → 스크린샷

**경로 B — 스킵**:
1. `http://localhost:3000` 접속
2. 테마 카드 클릭
3. "건너뛰고 바로 대화하기" 클릭
4. 세션 화면 → 스크린샷

### 테스트 매트릭스

**라운드 1 — 모바일 (390×844)**

| # | 테마 | 경로 | 결과 |
|---|------|------|------|
| 1 | 달빛정원 | A (풀코스) | PASS / FAIL: [구체적 증상] |
| 2 | 달빛정원 | B (스킵) | PASS / FAIL: [구체적 증상] |
| 3 | 모험가의 숲 | A | PASS / FAIL |
| 4 | 모험가의 숲 | B | PASS / FAIL |
| 5 | 전략실 | A | PASS / FAIL |
| 6 | 전략실 | B | PASS / FAIL |
| 7 | 천문대 | A | PASS / FAIL |
| 8 | 천문대 | B | PASS / FAIL |

**각 스크린샷 체크리스트** (하나라도 실패 시 FAIL + 증상 기록):
- [ ] 이미지 로딩됨 (깨진 아이콘 없음)
- [ ] `<태그>` 노출 없음
- [ ] 텍스트 잘림/넘침 없음
- [ ] 버튼 보이고 클릭 가능
- [ ] 색상이 테마에 맞음 (달빛=보라, 모험=오렌지, 전략=파랑, 천문=남색)
- [ ] 한글 깨짐 없음
- [ ] 레이아웃 겹침 없음

**버그 발견 시 즉시 수정 규칙**:
1. FAIL 기록 + 스크린샷 증거 저장
2. 원인 파일 특정 (코드 읽고)
3. 1파일 수정 → 빌드 → 해당 테마만 재테스트
4. PASS 확인 후 매트릭스 다음 행으로

**라운드 2 — 데스크탑 (1280×800)**
- 라운드 1에서 FAIL 있었던 테마만 데스크탑 재확인
- 전부 PASS면 달빛정원 + 천문대만 데스크탑 확인

**라운드 3 — 수정 검증 (라운드 1~2에서 수정한 것이 있을 때만)**
수정된 테마를 모바일에서 처음부터 다시 한 번 돌린다. 전부 PASS 확인.

**Task 3 커밋**: `git commit -m "fix: E2E 테스트 발견 UI 버그 N건 수정"` (N=수정 건수, 0건이면 커밋 안 함)

---

## 체크포인트 3
```
echo "=== 체크포인트 3 ===" && git log --oneline -3 && date
```

---

## Task 4: 세션 UI 구조 파악 + 텍스트 게임형 강화

### Step 4-0: 현재 구조 확인 (수정 전. 읽기만)

아래 파일을 **전부** 읽어라:
1. `pullim/src/components/ultimate/LadderSession.tsx`
2. `pullim/src/components/game/GameDialogue.tsx`
3. `pullim/src/components/game/GameChoices.tsx`
4. `pullim/src/components/game/GameInput.tsx`
5. `pullim/src/lib/session/response-parser.ts`
6. `pullim/src/lib/session/demo-ladder.ts`
7. `pullim/src/components/ChatMessage.tsx` (사용되는지 확인)
8. `pullim/src/components/ChatInput.tsx` (사용되는지 확인)

그리고 아래를 **기록**하라 (기록 없이 수정 시작 금지):

```
현재 세션 UI 분석 결과:
- ChatMessage.tsx는 어떤 페이지에서 import되는가? → [예: 안 됨 / adventure에서 됨]
- ChatInput.tsx는 어떤 페이지에서 import되는가? → [예: 안 됨]
- LadderSession은 선택지를 카드형으로 렌더링하는가? → [예/아니오]
- GameChoices 컴포넌트가 실제로 사용되는가? → [예/아니오]
- demo-ladder.ts의 데모 응답에 선택지 마커(A., B., 1., 2. 등)가 있는가? → [예/아니오]
- "채팅형"으로 보이는 이유는? → [(a)스타일 / (b)파싱 / (c)데모데이터 / (d)기타: ___]
```

### Step 4-1: 원인 판단 (객관적 기준)

위 기록을 바탕으로:
- `demo-ladder.ts`의 응답에 선택지 마커가 **있고** GameChoices가 **렌더링되면** → 스타일 문제 (a)
- 선택지 마커가 **있는데** GameChoices가 **안 나오면** → 파싱 문제 (b)
- 선택지 마커 자체가 **없으면** → 데모 데이터 문제 (c)
- ChatMessage/ChatInput이 **실제로 사용되고 있으면** → 컴포넌트 교체 필요 (d)

### Step 4-2: 수정

**원인 (a) 스타일 문제인 경우**:
- GameDialogue/GameChoices의 스타일을 더 "게임형"으로 수정
- 대화 기록의 스크롤이 채팅앱처럼 보이는 부분 개선 (과거 대화 축소/접힘)
- 현재 단계의 내러티브 + 선택지를 화면 중앙에 크게 표시

**원인 (b) 파싱 문제인 경우**:
- response-parser.ts의 선택지 추출 로직 수정
- 데모 데이터의 선택지 형식과 파서가 맞는지 대조

**원인 (c) 데모 데이터 문제인 경우**:
- demo-ladder.ts의 각 레벨 응답에 선택지 2~3개 추가
- 형식: response-parser가 파싱할 수 있는 형태 (코드 확인 후 맞춤)

**원인 (d) 컴포넌트 교체 필요**:
- ChatMessage → GameDialogue로 교체
- ChatInput → GameInput으로 교체
- import 경로만 변경, 새 컴포넌트 작성 금지

### Step 4-3: 검증 (3테마 모두 통과해야 완료)

1. 빌드 통과
2. Playwright로 달빛정원 세션 진입 → 선택지가 보이는가? → 스크린샷
3. Playwright로 천문대 세션 진입 → 선택지가 보이는가? → 스크린샷
4. Playwright로 모험가 세션 진입 → 선택지가 보이는가? → 스크린샷

**완료 기준**: 3개 스크린샷 모두에서 AI 응답 아래에 2~3개 선택지 버튼/카드가 보임.
**커밋**: `git commit -m "fix: 세션 UI 텍스트 게임형 강화 (선택지 카드 + 내러티브)"`

**규모 초과 시**:
- 가능한 만큼만 수정하고 커밋
- 핸드오프에 **구체적으로** 기록: "이 파일의 이 함수(라인 N~M)에서 이렇게 바꾸면 된다"
- "잘 모르겠다", "구조적 재설계 필요"만 쓰고 끝내지 마라

---

## 체크포인트 4
```
echo "=== 체크포인트 4 ===" && git log --oneline -5 && date
```

---

## Task 5: UI 디테일 추가 수정 (남은 시간 전부 사용)

Task 3에서 발견하지 못한 세부 UI 문제를 추가로 찾고 수정한다.

### 5-1: 유형 결과 페이지 검수
- Playwright로 달빛정원 파악 풀코스 → 유형 결과 페이지 도달
- 스크린샷 촬영 후 확인:
  - [ ] 유형 이름/설명 텍스트 정상
  - [ ] 캐릭터 이미지 로딩됨
  - [ ] "고민도 풀어볼래?" 버튼 정상
  - [ ] 테마 색상 맞음
- 4테마 모두 반복

### 5-2: 설정(⚙) 토글 검수
- 홈 → ⚙ 클릭 → 설정 드롭다운 스크린샷
- "선택지 추천 표시" 토글 동작 확인
- "매운맛 모드 🌶️" 토글 동작 확인

### 5-3: "잘 모르겠어 — 더 알려줘" 펼침 검수
- 홈 → "잘 모르겠어" 클릭 → 4테마 설명 펼침 스크린샷
- 텍스트 잘림/색상 확인

### 5-4: 세션 데모 전 단계 검수
데모 모드로 세션 진입 후:
- Level 1 (LISTEN) 화면 스크린샷 → UI 깨짐 확인
- Level 2 (RESEARCH) 화면 스크린샷 → UI 깨짐 확인 (진입 가능하면)
- Level 3 (DEBATE) 화면 스크린샷 → UI 깨짐 확인 (진입 가능하면)
- 각 레벨에서 선택지/입력/대화 정상 렌더링 확인
- 4테마 모두 반복 (시간 허용 시)

### 5-5: 데스크탑 전용 문제 검수 (1280×800)
- 홈 화면 데스크탑 스크린샷
- 파악 장면 데스크탑 스크린샷
- 세션 데스크탑 스크린샷
- max-width 적용 확인, 글자 크기 적절한지

### 5-6: 접근성/가독성 검수
- 텍스트 대비(다크 배경 위 밝은 텍스트) 충분한지 눈으로 확인
- 너무 작은 텍스트(10px 이하) 없는지
- 클릭 영역이 너무 작은 버튼 없는지 (최소 44px)

**버그 발견 시**: Task 3과 동일한 수정 규칙 (1파일씩 → 빌드 → 재확인)
**Task 5 커밋**: `git commit -m "fix: UI 디테일 수정 N건"` (수정 건수)

---

## 체크포인트 5
```
echo "=== 체크포인트 5 ===" && git log --oneline -5 && date
```

---

## Task 6: 최종 빌드 + 배포 + 프로덕션 검증

### Step 6-1: 최종 빌드
```bash
cd ~/study/main/pullim/pullim && npx next build
```
실패 시 → 마지막 수정 파일 `git checkout --` → 재빌드. `git reset` 절대 금지.

### Step 6-2: 푸시 + 배포
```bash
git push origin main
cd ~/study/main/pullim/pullim && vercel --prod
```
배포 완료 메시지("Aliased: https://pullim.vercel.app") 확인 후 30초 대기.

### Step 6-3: 프로덕션 검증 (건너뛰기 금지)

배포 완료 후 `https://pullim.vercel.app` 에서:

| # | 확인 | Playwright 동작 | PASS 기준 |
|---|------|----------------|-----------|
| 1 | 홈 4테마 카드 | navigate → 스크린샷 | 4개 카드 모두 보임 |
| 2 | 달빛정원 파악 진입 | 클릭 → "출발" → 스크린샷 | 일러스트 + 선택지 보임 |
| 3 | 천문대 스킵 → 세션 | 클릭 → 스킵 → 스크린샷 | 세션 UI 정상 렌더링 |
| 4 | 스크롤바 | 긴 페이지에서 스크린샷 | 다크 스크롤바 |

4개 모두 PASS → 완료.
FAIL 있으면 → 원인 파악 → 수정 → 재배포 → 재검증 (최대 2회 반복).

### Step 6-4: 핸드오프 작성

`.state/handoffs/2026-03-29_handoff.md`에 반드시 포함:

```markdown
# Handoff — 2026-03-29

## 이번 세션 요약
[수정한 총 건수, 주요 수정 내용]

## 수정한 파일 목록
- [파일경로] — [수정 내용 1줄]
- [파일경로] — [수정 내용 1줄]
...

## 발견했으나 수정 못 한 버그
- [파일경로:라인] — [증상] — [추정 원인]
...

## Task 4 결과
- 현재 세션 UI 분석: [Step 4-0 기록 그대로 복사]
- 수정 내용: [뭘 바꿨는지]
- 남은 작업: [구체적 파일:라인 수준으로]

## 프로덕션 검증
- [PASS/FAIL 4개 항목]

## 다음 세션 할 일
- [ ] [구체적 항목]
```

---

## 금지 사항 (최종, 재강조)
- 새 파일 생성 금지
- 새 npm 패키지 설치 금지
- API route 프롬프트 수정 금지
- CSS 변수 값 변경 금지 (추가만)
- 파일 삭제 금지
- `git reset` 사용 금지
- 빌드 실패 상태로 커밋 금지
- Playwright 없이 완료 선언 금지
- 한 커밋에 여러 Task 섞기 금지
- 추측으로 수정 금지
- "잘 모르겠다"로 끝내기 금지 — 최소한 "이 파일의 이 부분을 이렇게 바꾸면 된다"까지

## 성공 기준
- [ ] 스크롤바 다크 적용
- [ ] `<태그>` 재현 시 수정 완료, 미재현 시 "재현 불가" 기록
- [ ] 8개 플로우 E2E 3라운드 통과
- [ ] 텍스트 게임형 세션 UI 구조 파악 완료 + 가능한 수정 적용
- [ ] UI 디테일 추가 검수 (유형결과/설정/접기/레벨별/데스크탑/접근성)
- [ ] pullim.vercel.app 프로덕션 배포 + 4항목 검증 PASS
- [ ] 핸드오프 문서 작성 (구체적 파일:라인 수준)
