# StoryDiscovery continue-prompt 조건 버그 수정

## 프로젝트
풀림 (~/study/main/pullim/pullim/) — Next.js 15 + React 19 + TypeScript

## 수정 대상
`pullim/src/components/discovery/StoryDiscovery.tsx` 75번 줄 부근

## 버그
```tsx
} else if (nextIndex >= story.minScenes && nextIndex === story.minScenes) {
```
`nextIndex >= story.minScenes && nextIndex === story.minScenes`는 `nextIndex === story.minScenes`와 동일. 중복 조건.

또한 `sceneStartTime` ref가 장면 전환 시 리셋되지 않아 이후 장면의 timeMs가 누적됨.

## 수정 내용
1. 조건을 `nextIndex === story.minScenes`로 단순화
2. 장면 전환 시 `sceneStartTime.current = Date.now()` 추가 (setSceneIndex 호출 직전)

## 검증
- `npm run build` 통과 확인
- 변경은 최소한으로, 다른 코드 수정하지 말 것
