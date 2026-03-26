# history/preview 페이지 정리

## 프로젝트
풀림 (~/study/main/pullim/pullim/)

## 작업
1. `pullim/src/app/history/page.tsx` 읽기 — 현재 상태 확인
2. `pullim/src/app/preview/page.tsx` 읽기 — 현재 상태 확인
3. 두 페이지가 현재 앱 흐름에서 접근 가능한지 확인
4. 이전 UI(끝판왕 시절) 잔재가 있으면:
   - history: 세션 기록 보기 페이지로 역할 명확화, 기록 없으면 빈 상태 UI
   - preview: 불필요하면 리다이렉트 or 최소 UI로 정리
5. 판타지 톤에 맞게 스타일 수정

## 주의
- 삭제하지 말 것 (라우트 유지)
- 최소한의 수정으로 깨진 UI만 정리
- `npm run build` 통과 확인
