# 밤배치 하네스 — 2026-03-30 (UI 수정 + 배포 정상화)

## 배경
대표가 pullim.vercel.app에서 테스트했을 때 6가지 문제 발견:
1. 대화형에서 raw 텍스트(`[OPTIONS]`, `[ANALYSIS]` 등) 노출
2. 텍스트게임형 진입 안됨
3. 아포칼립스 테마 미적용
4. 파악 스킵→바로 대화 진입 안됨
5. API 키 넣어도 가동 불가
6. 내면사고(듀얼AI) 동작 여부 불명

코드 조사 결과: 기능은 전부 구현+push 완료. 빌드 통과.
원인: 스트리밍 태그 필터 버그 + Vercel 환경변수 미설정 + 실제 플로우 미검증.

**CC 결과 (3-model: Opus+Sonnet+GLM-5):**
- Task 2(데모 검증)는 이미 구현이라 Task 3에 흡수
- 내면사고 검증 Task 누락 → Task 3에 포함
- Vercel 환경변수 설정이 문제 5의 근본 원인 → Task 3에 가이드 포함
- 타임아웃 30분 → 45분

## 공통 규칙
- 기존 파일을 **먼저 읽고** 최신 상태 위에서 수정
- 파일 수정 후 반드시 `cd ~/study/main/pullim/pullim && npx next build` 로 빌드 확인
- 커밋 메시지: `fix: [간단 설명]`
- LadderSession.tsx 수정 시 다른 Task와 충돌 주의 — 순차 실행

---

## Task 1: 스트리밍 태그 필터 강화 (LadderSession.tsx)

**문제**: Line 859의 regex가 `[TAG` 형식만 잡음. 불완전한 태그, HTML 태그, 줄바꿈 포함 태그 미처리. 스트리밍 중 `[OPTIONS]`, `[COMPARISON]`, `[ANALYSIS]` 등이 사용자에게 보임.

**수정 대상**: `pullim/src/components/session/LadderSession.tsx`

**해야 할 것**:
1. 먼저 파일을 읽어라
2. Line 859 부근의 streamText 표시 부분을 찾아라
3. 현재 regex: `streamText.split(/\[(?:COMPARISON|SENSORY|ANALYSIS|OPTIONS|CHEAT|WRAP_SUGGEST|LISTEN_COMPLETE|SUMMARY|SESSION_SUMMARY_MODE|BEHIND_THE_SCENES)/)[0]`
4. 이걸 더 강력한 필터로 교체. `stripStreamTags(text: string): string` 헬퍼 함수를 파일 상단(컴포넌트 밖)에 추가:
   - `[TAG]...[/TAG]` 완전한 블록 제거 (멀티라인, 모든 태그)
   - `[TAG` 시작했지만 아직 닫히지 않은 불완전 태그 이후 텍스트 제거
   - HTML 태그 (`<option>`, `</option>` 등) 제거
   - `A_emoji:`, `A_title:`, `B_emoji:` 등 구조화 키-값도 제거
   - 연속 빈 줄 정리 (2줄 이상 → 1줄)
5. 표시 부분을 `{stripStreamTags(streamText) || "..."}` 로 교체
6. `setStreamText` 호출은 그대로 유지 (파싱용 원본 보존)

**검증**: 빌드 통과

---

## Task 2: 전체 UX 플로우 통합 검증 + 수정

**문제**: 5테마 × 진입 경로가 코드상 연결은 되어 있으나 실제 동작 미검증. 내면사고 동작 불명.

**수정 대상**:
- `pullim/src/app/page.tsx` (홈)
- `pullim/src/components/session/LadderSession.tsx` (세션)
- `pullim/src/app/apocalypse/[id]/page.tsx`
- `pullim/src/app/adventure/[id]/page.tsx`
- `pullim/src/app/garden/[id]/page.tsx`
- `pullim/src/app/strategy/[id]/page.tsx`
- `pullim/src/app/stargazer/[id]/page.tsx`
- `pullim/src/lib/themes/index.ts`
- `pullim/src/lib/session/demo-ladder.ts`
- `pullim/src/lib/session/behind-the-scenes.ts`

**해야 할 것**:

### A. 진입 경로 5개 추적 (page.tsx → 세션 페이지)
1. 모든 파일을 먼저 읽어라
2. 다음 5개 경로가 코드상 끊김 없이 연결되는지 추적:
   - (A) 홈 → 테마 카드 클릭 → 사다리 세션 (파악 스킵)
   - (B) 홈 → "알아서 골라줘" → 파악 → 결과 → 사다리 세션
   - (C) 홈 → "그냥 대화할래" → 랜덤 테마 사다리 세션
   - (D) 사다리 진입 → "이야기로 풀어볼래" → 레벨 1
   - (E) 사다리 진입 → "직접 말할게" → 레벨 5
3. URL 파라미터 `theme`, `mode=ladder`, `entry`가 정확히 전달되는지 확인
4. 끊어진 경로가 있으면 수정

### B. 5테마 라우팅 검증
5. `THEMES` 객체의 5개 테마(adventure, garden, strategy, stargazer, apocalypse) 각각의 `route` 값 확인
6. 각 `[id]/page.tsx`에서 `mode=ladder` 분기가 있는지 확인
7. 홈 화면 테마 카드 배열에 5개 테마가 모두 있는지 확인

### C. 데모 모드 완주 검증
8. `demo-ladder.ts`에서 5테마별 레벨 1~5 데모 응답이 있는지 확인
9. `getDemoSummary()`가 5테마 전부 커버하는지 확인
10. 누락된 테마/레벨이 있으면 추가

### D. 내면사고(듀얼 AI) 동작 검증
11. `behind-the-scenes.ts`의 `inferState()` → `/api/behind-thought` 호출 경로 추적
12. Gemini API 키 없을 때 `inferStateSync()` 규칙 기반 폴백이 정상 작동하는지 확인
13. `LadderSession.tsx`에서 `currentInference` 상태가 업데이트되는지 확인
14. `showBehindThoughts` 토글이 설정 UI에 노출되는지 확인
15. 토글 켜면 💭 표시가 나오는지 코드 경로 확인

### E. 수정사항
16. 끊어진 경로, 누락된 데모 응답, 내면사고 연결 오류 등 발견 시 수정
17. 수정 후 빌드 확인

**검증**: 빌드 통과

---

## Task 3: API 에러 핸들링 + Vercel 환경변수 가이드

**문제**: API 키 넣어도 가동 불가 보고. 근본 원인은 Vercel 대시보드에 환경변수 미설정일 가능성 높음.

**수정 대상**:
- `pullim/src/app/api/ultimate/listen/route.ts`
- `pullim/src/app/api/behind-thought/route.ts`
- `pullim/src/lib/llm/claude.ts`
- `pullim/.env.local.example`

**해야 할 것**:

### A. API 에러 핸들링
1. 먼저 파일들을 읽어라
2. `isDemoMode()` 함수 확인 — API 키 없을 때 자동 데모 모드 전환 경로 확인
3. 에러 발생 시 클라이언트에 명확한 SSE 메시지 전송:
   - API 키 미설정 → `data: {"error": "API_KEY_MISSING", "message": "데모 모드로 전환됩니다"}`
   - API 호출 실패 → 구체적 에러 (rate limit, invalid key 등)
4. LadderSession.tsx에서 에러 메시지를 수신하면 사용자에게 안내 표시
5. behind-thought (Gemini) 에러가 세션을 중단시키지 않는지 확인

### B. 환경변수 가이드
6. `.env.local.example` 갱신 — 필수/선택 구분 명확히:
   ```
   # 필수 — 이것 없으면 데모 모드로만 동작
   ANTHROPIC_API_KEY=sk-ant-...

   # 선택 — 없으면 규칙 기반 폴백
   GOOGLE_AI_API_KEY=...

   # Supabase (피드백 수집용)
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
7. Vercel 배포 시 필요한 환경변수 목록을 `pullim/DEPLOY.md` 에 간단히 문서화 (5줄 이내)

**검증**: 빌드 통과

---

## Task 4: 빌드 + 커밋 + Push (Vercel 배포)

**해야 할 것**:
1. Task 1~3 완료 후 최종 빌드: `cd ~/study/main/pullim/pullim && npx next build`
2. 빌드 성공 확인
3. 변경 파일 커밋:
   ```
   fix: 스트리밍 태그 필터 강화 + UX 플로우 검증 수정 + API 에러 핸들링
   ```
4. `git push origin main`
5. push 성공 확인

**검증**: 빌드 성공 + push 성공
