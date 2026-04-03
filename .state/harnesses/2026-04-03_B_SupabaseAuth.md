# 하네스: Supabase Auth + 세션 저장

## 목표
localStorage 기반 세션 데이터를 Supabase에도 저장하는 구조를 구현한다. 이메일 로그인 Auth 포함. Supabase 환경변수 없으면 기존 localStorage 폴백으로 정상 동작.

## 현재 상태

### Supabase 클라이언트
- `src/lib/supabase/client.ts` — `getSupabase()` / `isSupabaseAvailable()` 이미 존재
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 의존성: `@supabase/supabase-js@^2.98.0`, `@supabase/ssr@^0.9.0` 이미 설치됨

### 기존 Supabase 사용 패턴
- `src/app/api/discovery-selections/route.ts` — `getSupabase()` null 체크 후 insert. null이면 `{ ok: true, storage: "local" }` 반환
- `src/app/api/session-summary/route.ts` — 동일 패턴. `session_summaries` 테이블에 insert
- `src/app/api/profile/route.ts` — `user_profiles` 테이블 upsert

### 세션 데이터 흐름
1. 세션 시작: `useLadderStore.initSession()` (Zustand, 메모리만)
2. 세션 진행: `store.addMessage()`, `store.incrementTurn()` (메모리만)
3. 세션 종료: `store.endSession(summary)` → `SessionSummary` 컴포넌트 렌더
4. 약속 저장: `promise-store.ts` — localStorage에 저장
5. 사용자 ID: `src/lib/user-id.ts` — localStorage `pullim_user_id` 키

## 작업 항목

### Task 1: Supabase Auth 함수 추가
**파일: `src/lib/supabase/client.ts` 수정**

기존 `getSupabase()` / `isSupabaseAvailable()` 시그니처 변경 금지. 아래 함수만 추가:

```typescript
// 추가할 함수:
export async function getAuthUser(): Promise<{ id: string; email: string } | null>
export async function signInWithEmail(email: string, password: string): Promise<{ user: { id: string } | null; error: string | null }>
export async function signUpWithEmail(email: string, password: string): Promise<{ user: { id: string } | null; error: string | null }>
export async function signOut(): Promise<void>
```

제약:
- Supabase 없으면 모든 함수가 null/빈값 반환 (에러 아님)
- 비밀번호 최소 6자 (Supabase 기본)
- try-catch 필수

### Task 2: Auth 상태 훅
**새 파일: `src/hooks/useAuth.ts`**

```typescript
export function useAuth(): {
  user: { id: string; email: string } | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  isSupabaseReady: boolean;
}
```

구현:
- `useEffect`에서 `supabase.auth.onAuthStateChange` 구독
- Supabase 없으면 `{ user: null, isSupabaseReady: false, loading: false }` 고정 반환
- cleanup에서 구독 해제

### Task 3: 로그인 모달 UI
**새 파일: `src/components/AuthModal.tsx`**

모달 형태. 최소화 원칙:
- 이메일 + 비밀번호 입력
- 로그인 / 회원가입 탭 전환
- 에러 메시지 표시
- 성공 시 자동 닫힘
- 기존 RPG 테마 스타일 유지 (`rpg-panel`, `font-rpg` 등)
- Supabase 미설정 시 "현재 로그인을 사용할 수 없습니다" 표시

**`src/app/page.tsx` 수정:**
- 헤더에 로그인 버튼 추가 (user가 null이면 "로그인", 있으면 이메일 앞 5자 표시)
- AuthModal 토글 (별도 페이지 아님)

### Task 4: 세션 완료 시 Supabase 저장
**새 파일: `src/app/api/session-save/route.ts`**

기존 `session-summary/route.ts` 패턴 그대로:
- `getSupabase()` null 체크 → null이면 `{ ok: true, storage: "local" }` 반환
- 테이블: `sessions`

저장할 데이터:
```typescript
{
  user_id: string,       // Supabase Auth UUID
  session_id: string,    // nanoid
  theme: string,
  summary: string,
  turn_count: number,
  cheat_count: number,
  messages_count: number,
  entry_mode: string,
  created_at: string,    // ISO
}
```

**`src/components/session/LadderSession.tsx` 수정:**
- `generateSummary` 또는 `phase === "summary"` 진입 시점에서:
  1. `getAuthUser()` 호출
  2. 유저 있으면 `/api/session-save` POST (fire-and-forget)
  3. 유저 없으면 기존 localStorage 경로만

### Task 5: Supabase 마이그레이션 SQL (참고용)
**새 파일: `src/lib/supabase/migrations/001_sessions_table.sql`**

```sql
-- sessions 테이블
create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  session_id text not null,
  theme text not null,
  summary text,
  turn_count integer default 0,
  cheat_count integer default 0,
  messages_count integer default 0,
  entry_mode text default 'concern',
  created_at timestamptz default now()
);

-- RLS
alter table public.sessions enable row level security;

create policy "Users can read own sessions"
  on public.sessions for select
  using (auth.uid() = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check (auth.uid() = user_id);

-- 인덱스
create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_created_at on public.sessions(created_at desc);
```

🔴 실제 실행은 대표가 Supabase 대시보드 > SQL Editor에서.

### Task 6: 빌드 + 커밋 + 배포
```bash
cd ~/study/main/pullim/pullim && npx next build
```
- 빌드 실패 시: 에러 메시지 읽고 수정 반복
- 빌드 성공 시:
```bash
cd ~/study/main/pullim && git add -A && git commit -m "feat: Supabase Auth(이메일 로그인) + 세션 완료 시 DB 저장 (localStorage 폴백 유지)" && git push
```

## 제약
- 웹앱 경로: ~/study/main/pullim/pullim/
- 빌드 통과 필수
- Supabase 환경변수 없어도 앱 정상 동작 (폴백)
- AuthModal은 모달 형태 — 별도 페이지 생성 금지
- 기존 `getSupabase()` / `isSupabaseAvailable()` 시그니처 변경 금지
- `promise-store.ts`는 수정하지 마라 (localStorage 전용 유지)
- SQL 마이그레이션은 참고용 파일만 생성. 실행은 대표가.

## 완료 기준 (AC)
- [ ] `src/lib/supabase/client.ts`에 Auth 함수 4개 추가 (getAuthUser, signIn, signUp, signOut)
- [ ] `src/hooks/useAuth.ts` 훅 생성 + Supabase 없을 때 안전한 폴백
- [ ] `src/components/AuthModal.tsx` 모달 생성 (로그인/회원가입)
- [ ] 홈(`page.tsx`) 헤더에 로그인 버튼 통합
- [ ] `/api/session-save` route 생성
- [ ] LadderSession에서 세션 종료 시 저장 API 호출
- [ ] SQL 마이그레이션 파일 생성 (참고용)
- [ ] Supabase 없을 때 전체 앱 정상 동작 확인
- [ ] `npx tsc --noEmit` 타입 에러 0개
- [ ] `npx next build` 성공
- [ ] git commit + push 완료
