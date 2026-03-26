# Lighthouse 성능 점검 → 자동 수정

## 프로젝트
풀림 (~/study/main/pullim/pullim/) — Next.js 15

## 작업
코드 레벨에서 Lighthouse 성능 관련 항목 점검 및 수정.

1. **이미지 최적화**: `<img>` 태그가 있으면 `<Image>` (next/image)로 변환. width/height 명시.
2. **CLS 방지**: 이미지에 width/height 또는 aspect-ratio 확인
3. **LCP 개선**: 첫 화면에 보이는 이미지에 `priority` prop 추가
4. **미사용 CSS**: globals.css에서 사용하지 않는 스타일 제거
5. **JavaScript 번들**: dynamic import가 필요한 큰 컴포넌트 확인

## 점검 파일
- page.tsx (홈)
- StoryDiscovery.tsx
- LadderSession.tsx
- layout.tsx
- globals.css

## 주의
- 실제 Lighthouse 실행은 하지 않음 (코드 레벨 점검만)
- `npm run build` 통과 확인
