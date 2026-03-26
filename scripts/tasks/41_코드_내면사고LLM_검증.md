# 내면사고 LLM 실제 호출 검증

## 프로젝트
풀림 (~/study/main/pullim/pullim/)

## 현재 상태
- `pullim/src/lib/session/behind-llm.ts` — Gemini Flash Lite LLM 추론
- `pullim/src/app/api/behind-thought/route.ts` — API 엔드포인트
- .env.local에 GOOGLE_AI_API_KEY 존재

## 작업
1. behind-llm.ts를 읽고 Gemini API 호출 로직 확인
2. GOOGLE_AI_API_KEY 환경변수명이 코드와 일치하는지 확인
3. 3초 타임아웃 + 폴백이 구현되어 있는지 확인
4. API 키가 없을 때 graceful하게 데모 모드로 폴백하는지 확인
5. 문제 있으면 수정

## 주의
- 실제 API 호출 테스트는 하지 말 것 (비용)
- 코드 레벨 검증만
- `npm run build` 통과 확인
