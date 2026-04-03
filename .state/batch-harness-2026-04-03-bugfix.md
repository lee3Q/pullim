# 하네스: API 테스트 전 버그 수정 (2026-04-03)

> 목표: API 키 넣기 전에 코드 리뷰에서 발견된 CRITICAL/HIGH 버그 수정.
> 모든 Task는 기존 파일을 먼저 읽고 최신 코드 위에 수정할 것.
> 수정 후 반드시 `cd ~/study/main/pullim/pullim && npm run build` 빌드 확인.

---

## Task 1: React Hooks 규칙 위반 수정 (CRITICAL)

**문제:** 5개 테마 페이지에서 조건부 early return 뒤에 Hook이 호출됨. mode 전환 시 런타임 크래시.

**대상 파일:**
- `src/app/adventure/[id]/page.tsx`
- `src/app/garden/[id]/page.tsx`
- `src/app/strategy/[id]/page.tsx`
- `src/app/stargazer/[id]/page.tsx`
- `src/app/apocalypse/[id]/page.tsx`

**수정 방법:**
1. 각 파일을 읽어라.
2. `searchParams.get("mode") === "ladder"` 조건부 early return을 찾아라.
3. **모든 Hook 호출을 조건 분기 위로 올려라.** Hook은 반드시 컴포넌트 최상단에서 무조건 호출되어야 한다.
4. early return 대신, 렌더 시점에서 JSX를 분기해라:
```tsx
// 수정 전 (버그):
if (searchParams.get("mode") === "ladder") {
  return <LadderSessionPage ... />;
}
const { playing } = useBGM(...); // Hook after conditional return!

// 수정 후:
const isLadder = searchParams.get("mode") === "ladder";
const { playing } = useBGM(...); // Hook always called
// ... 나머지 모든 Hook도 여기에 ...
if (isLadder) {
  return <LadderSessionPage ... />;
}
```
5. 5개 파일 전부 동일하게 수정.

**체크포인트:** `npm run build` 통과 + 5개 파일 모두에서 조건부 return 이전에 Hook 호출이 없어야 함.

---

## Task 2: SSE 연결 끊김 처리 (CRITICAL — API 비용 보호)

**문제:** 사용자가 페이지를 벗어나도 Claude API 스트리밍이 끝까지 진행되어 토큰 비용 낭비.

**대상 파일:** `src/app/api/ultimate/listen/route.ts`

**수정 방법:**
1. 파일을 읽어라.
2. `ReadableStream` 생성 부분 (약 561행)을 찾아라.
3. `req.signal`(AbortSignal)을 사용해서 클라이언트 연결 끊김을 감지하라:
```typescript
const readable = new ReadableStream({
  async start(controller) {
    let aborted = false;
    req.signal.addEventListener('abort', () => {
      aborted = true;
      controller.close();
    });
    
    try {
      // ... 기존 스트리밍 로직 ...
      // Claude 스트리밍 루프 안에서 aborted 체크:
      // if (aborted) break; 또는 stream.abort()
    } catch (e) {
      if (!aborted) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true, text: "..." })}\n\n`));
      }
    } finally {
      if (!aborted) {
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    }
  },
  cancel() {
    // ReadableStream이 취소될 때 (클라이언트 disconnection)
  }
});
```
4. Claude API 스트리밍(`stream.on("text", ...)`) 부분에서 `aborted` 플래그를 확인하고, true면 즉시 중단.
5. local 모드(`localStream`) 경로도 동일하게 abort 처리.
6. 데모 모드 SSE 경로에서도 `setTimeout` 루프 중 abort 체크.

**체크포인트:** `npm run build` 통과.

---

## Task 3: behind-thought 입력 검증 (CRITICAL)

**문제:** 잘못된 요청 시 에러 응답 없이 무한대기(서버 행).

**대상 파일:** `src/app/api/behind-thought/route.ts`

**수정 방법:**
1. 파일을 읽어라.
2. `req.json()` 직후에 입력 검증을 추가:
```typescript
export async function POST(req: NextRequest) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 형식" }, { status: 400 });
  }
  
  const { signals, events, currentLevel, recentMessages } = body;
  
  if (!signals || currentLevel === undefined) {
    return NextResponse.json({ error: "signals, currentLevel 필수" }, { status: 400 });
  }
  
  // ... 기존 로직 ...
}
```

**체크포인트:** `npm run build` 통과.

---

## Task 4: SSE 파서 버퍼링 + concurrent 가드 (HIGH)

**문제 1:** LadderSession.tsx SSE 파서가 chunk 경계를 버퍼링하지 않아 느린 네트워크에서 텍스트 유실.
**문제 2:** sendToAI에 AbortController가 없어 빠른 클릭 시 동시 호출로 응답이 꼬임.

**대상 파일:** `src/components/session/LadderSession.tsx`

**수정 방법 (문제 1 — SSE 버퍼링):**
1. 파일을 읽어라. SSE 파싱 부분 (약 400행)을 찾아라.
2. `chunk.split("\n")` 하기 전에 buffer를 유지하도록 수정:
```typescript
let sseBuffer = "";
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  sseBuffer += decoder.decode(value, { stream: true });
  const lines = sseBuffer.split("\n");
  sseBuffer = lines.pop() ?? ""; // 마지막 불완전한 라인은 보관
  for (const line of lines) {
    // 기존 파싱 로직
  }
}
```

**수정 방법 (문제 2 — concurrent 가드):**
1. 컴포넌트 상단에 `const abortRef = useRef<AbortController | null>(null);` 추가.
2. `sendToAI` 함수 시작 부분:
```typescript
// 이전 요청 취소
if (abortRef.current) {
  abortRef.current.abort();
}
abortRef.current = new AbortController();
const signal = abortRef.current.signal;
```
3. `fetch` 호출에 `{ signal }` 추가.
4. catch에서 `AbortError`는 무시:
```typescript
catch (e) {
  if (e instanceof DOMException && e.name === "AbortError") return;
  // ... 기존 에러 처리 ...
}
```

**체크포인트:** `npm run build` 통과.

---

## Task 5: 종말 테마 persona + cheatCount + 태그 누출 (HIGH)

**문제 1:** listen/route.ts의 `getPersona()`에 종말 case 없음 → 모험가로 폴백.
**문제 2:** LadderSession.tsx handleCheat에서 Zustand stale read로 cheatCount 1 뒤처짐.
**문제 3:** response-parser.ts에서 WRAP_SUGGEST 닫는 태그 없으면 UI에 태그 텍스트 노출.

**대상 파일:**
- `src/app/api/ultimate/listen/route.ts` — getPersona()
- `src/components/session/LadderSession.tsx` — handleCheat (약 660행)
- `src/lib/session/response-parser.ts` — WRAP_SUGGEST 처리

**수정 방법 (문제 1):**
1. `getPersona()` switch문에 `case "종말":` 추가. 종말 테마 페르소나 작성:
   - 세계관: 세상이 끝난 뒤, 폐허 속에서 사용자와 대화하는 생존자 동료
   - 톤: 반말, 담담하지만 따뜻한, 2-3문장 최대
   - 시작 메시지, 에러 메시지, 기본 옵션 포함

**수정 방법 (문제 2):**
```typescript
// 수정 전 (버그):
store.incrementCheatCount();
const newCheatCount = store.cheatCount + 1; // stale!

// 수정 후:
const newCheatCount = store.cheatCount + 1;
store.incrementCheatCount();
```

**수정 방법 (문제 3):**
`response-parser.ts`에서 WRAP_SUGGEST 태그 제거 regex를 보강:
```typescript
// 닫는 태그 있든 없든 전부 제거
.replace(/\[WRAP_SUGGEST\][\s\S]*?(\[\/WRAP_SUGGEST\]|$)/g, "")
```
또한 `stripStreamTags` (LadderSession.tsx 약 49행)에서도 동일하게 보강.

**체크포인트:** `npm run build` 통과.

---

## Task 6: 나머지 HIGH — session-summary, 입력검증, OG 폴백 (HIGH)

**문제 1:** session-summary Supabase insert 에러 미처리.
**문제 2:** listen route messages 입력 검증 없음 (undefined면 크래시).
**문제 3:** result/page.tsx OG 이미지가 0개 — fallback 이미지 필요.

**대상 파일:**
- `src/app/api/session-summary/route.ts`
- `src/app/api/ultimate/listen/route.ts`
- `src/app/result/page.tsx`

**수정 방법 (문제 1):**
session-summary의 Supabase insert를 try-catch로 감싸라.

**수정 방법 (문제 2):**
listen route POST 함수 시작부에 messages 검증 추가:
```typescript
if (!Array.isArray(messages)) {
  // SSE 에러 응답 반환
}
```

**수정 방법 (문제 3):**
result/page.tsx generateMetadata에서 OG 이미지가 없을 때 fallback:
```typescript
const ogImage = `/images/og/og_${theme}_${typeId}.png`;
// fallback: 메인 OG 이미지
const fallbackOgImage = "/images/og/og_main.png";
```
`public/images/og/og_main.png`가 없으면, 기존 이미지 중 하나를 복사해서 사용.
또는 OG 이미지 메타태그 자체를 조건부로만 출력 (이미지 없으면 생략).

**체크포인트:** `npm run build` 통과.

---

## 최종 검증

모든 Task 완료 후:
1. `cd ~/study/main/pullim/pullim && npm run build` — 에러 0개 확인
2. 수정한 파일 목록 출력
3. 각 Task별 수정 내용 한 줄 요약
