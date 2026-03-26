# lint 경고 전부 수정

## 프로젝트
풀림 (~/study/main/pullim/pullim/)

## 작업
1. `npm run lint` 실행
2. 모든 경고/에러 수정:
   - unused imports 제거
   - missing dependencies in useEffect
   - any 타입 → 적절한 타입으로
   - 기타 ESLint 규칙 위반
3. `npm run lint` 0 경고 목표 (max-warnings 20 이하면 OK)

## 주의
- 로직 변경 없이 lint 수정만
- 타입 변경 시 기존 동작 깨뜨리지 않도록
- `npm run build` 통과 확인
