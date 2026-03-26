# discovery_selections Supabase 저장 활성화

## 프로젝트
풀림 (~/study/main/pullim/pullim/) — Next.js 15 + React 19 + TypeScript

## 현재 상태
- `pullim/src/app/api/discovery-selections/route.ts` 존재 (POST 핸들러)
- Supabase 환경변수 설정 완료
- `pullim/src/lib/supabase/client.ts` — getSupabase() 사용 가능

## 작업
1. discovery-selections API route를 읽고, Supabase에 실제 저장하는지 확인
2. Supabase에 discovery_selections 테이블이 필요하면, 테이블 생성 SQL을 출력 (직접 생성하지 말 것)
3. 저장 로직이 localStorage 폴백만 있으면, Supabase 저장 추가
4. getSupabase()가 null이면 localStorage 폴백 유지

## 주의
- Supabase에 테이블이 없으면 insert가 실패할 수 있음 → try/catch 필수
- `npm run build` 통과 확인
