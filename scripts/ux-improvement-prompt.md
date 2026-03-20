# UX 개선 작업 프롬프트

프로젝트: /Users/sanggyulee/study/main/pullim/pullim

아래 작업들을 전부 수행해. 각 작업 후 빌드 에러가 나면 즉시 수정. 승인 없이 진행.

---

## 작업 A: /history 페이지 신규 생성

src/app/history/page.tsx 신규 생성.
- 현재 세션 기록 기능은 없음 (Supabase 미연동)
- placeholder 페이지로 만들되 RPG 스타일 적용
- 홈과 동일한 배경 (home-bg.webp, Image fill, 다크 그라디언트)
- 내용: "아직 기록이 없습니다" rpg-panel + "새 고민 시작하기" rpg-button → 홈으로 이동
- 헤더: "풀림" + "← 돌아가기" 버튼
- font-rpg 적용

---

## 작업 B: UX 개선 9개

### B-1. 홈 카피에 가치 설명 (#1)
src/app/page.tsx — "풀림에 오신 것을 환영합니다." 아래에:
`"AI 3개 관점이 당신의 고민을 함께 들여다봅니다."`

### B-2. 테마 카드에 적합 상황 태그 (#2)
src/lib/themes/index.ts에 `useCases: string` 필드 추가:
- 모험가: "막막한 갈림길 · 직관적 결정"
- 전략실: "데이터 · 논리 · 전문가 시각"
- 달빛정원: "감정 정리 · 마음 돌봄"

src/components/ultimate/ThemeSelector.tsx에서 카드 하단에 표시:
```tsx
<p className="text-[11px] text-white/35 mt-2 font-rpg-sm">{theme.useCases}</p>
```

### B-3. 첫 입장 시 타이핑 인디케이터 즉시 표시 (#4)
adventure/strategy/garden [id]/page.tsx 모두:
- `showInitialTyping` state 추가, 초기값 true
- 첫 대사 setTimeout 전에 즉시 typing indicator 표시
- 1초 후 "...왔군."(또는 테마별 대사) 나오면서 setShowInitialTyping(false)
- render에서: showInitialTyping && stage==="ENTER" && dialogues.length===0 일 때 CharacterDialogue typing 표시

### B-4. 선택지 + "직접 입력" escape hatch (#7)
src/components/ultimate/SelectionButtons.tsx:
- `onCustomInput?: () => void` prop 추가
- 선택지 아래에 "직접 입력하기" rpg-button-ghost 버튼 → onCustomInput 호출

adventure/strategy/garden page.tsx:
- SelectionButtons에 `onCustomInput={() => setOptions([])}` 전달

### B-5. 구슬 설명 항상 노출 (#9)
src/components/ultimate/CrystalSelector.tsx:
- 선택 여부와 관계없이 description 항상 표시
- 선택 시 text-white/60, 미선택 시 text-white/35

### B-6. 구슬 분석에 risk/question 표시 (#12)
src/components/ultimate/CrystalAnalysisView.tsx:
- observation/insight 아래에 추가:
```tsx
{analysis.risk && <p className="text-[11px] text-amber-400/70 mt-1.5 font-rpg-sm">⚠ {analysis.risk}</p>}
{analysis.question && <p className="text-[11px] text-white/40 mt-1 italic">&ldquo;{analysis.question}&rdquo;</p>}
```

### B-7. 결론 카드 클릭 인터랙션 (#15)
src/components/ultimate/ConclusionView.tsx:
- phase==="summary"의 선택지 카드에 onClick={() => handleSelectAction(i)} 추가
- cursor-pointer, 호버 시 border 강조

### B-8. CrisisAlert 다크 테마 (#16)
src/components/CrisisAlert.tsx:
- bg-white → bg-gray-900/95 backdrop-blur-sm
- 텍스트 흰색 계열, 빨간 액센트 유지
- "닫기" → "괜찮습니다"

### B-9. 세션 완료 후 CTA (#19)
src/components/ultimate/ConclusionView.tsx:
- phase==="done"에서 farewell 아래에:
```tsx
<div className="flex gap-3 justify-center mt-4">
  <a href="/" className="rpg-button-ghost px-4 py-2 text-xs font-rpg-sm">새 고민 시작하기</a>
  <a href="/history" className="rpg-button-ghost px-4 py-2 text-xs font-rpg-sm">내 기록 보기</a>
</div>
```

---

## 작업 C: 전략실 톤 — "현실 전문가 브리핑"

### C-1. src/lib/themes/index.ts 전략실 labels:
```tsx
enter: "안녕하세요. 의사결정 브리핑을 시작하겠습니다.",
askConcern: "오늘 다뤄야 할 안건을 말씀해주세요.",
farewell: "추가 브리핑이 필요하시면 다시 방문해주세요.",
tagline: "판단은 당신의 몫입니다. 근거는 제가 드렸습니다.",
```

### C-2. strategy/[id]/page.tsx:
- ERROR_MSG: "시스템 응답 지연입니다. 잠시 후 다시 시도해주세요."
- 초기 대사 "...왔군." → "접수되었습니다."
- "무엇이 자네를 여기까지 데려왔는가?" → theme.labels.enter + "\n" + theme.labels.askConcern

### C-3. LoadingOverlay 전략실 메시지:
- "렌즈로 분석하는 중..." → "전문가 관점에서 분석하는 중..."
- src/components/ultimate/LoadingOverlay.tsx의 STAGE_CONFIG.analyze.text.비서 수정

---

## 최종 확인
- `npm run build` 통과
- 3테마 일관성 확인 (adventure/strategy/garden 모두 동일 패턴)
