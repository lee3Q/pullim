# 달빛정원 UI/UX 설계

> 날짜: 2026-03-20
> 기반: 모험가_UI_설계.md의 테마 시스템 — 컴포넌트 동일, 테마 prop만 다름
> 이 문서는 모험가와의 **차이점만** 기록

---

## 배경 컴포넌트: GardenBackground

```
모험가: CampfireBackground (모닥불 + 오두막 + 불꽃 파티클)
달빛정원: GardenBackground (달 + 벤치 + 꽃밭 + 반딧불 파티클)
```

### 레이어 구성

```
Layer 0: 남색 그라디언트 배경 (#0f1729 → #1a2744)
Layer 1: 별이 반짝이는 밤하늘 (CSS animation, 작은 white dot)
Layer 2: 달 (고정, 우상단, radial-gradient로 빛 번짐)
Layer 3: 정원 실루엣 (꽃밭 + 나무 — 도트 아트 PNG or SVG)
Layer 4: 벤치 (중앙 하단 — 정원사가 앉아있는 곳)
Layer 5: 반딧불 파티클 (CSS animation, 랜덤 위치에서 깜빡임)
```

### 반딧불 파티클

```css
.firefly {
  position: absolute;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(167, 139, 250, 0.8); /* 보라빛 */
  animation: firefly-blink 3s ease-in-out infinite;
  animation-delay: var(--delay);
}

@keyframes firefly-blink {
  0%, 100% { opacity: 0; transform: translate(0, 0); }
  30% { opacity: 1; }
  70% { opacity: 0.6; }
  50% { transform: translate(10px, -15px); }
}
```

반딧불 20개 정도, 랜덤 위치 + 랜덤 딜레이.

---

## 단계별 배경 변화

| 단계 | 모험가 | 달빛정원 |
|------|--------|---------|
| 입장/듣기 | 모닥불 보통 | 달빛 보통 + 반딧불 느리게 |
| 리서치 | 두루마리 오버레이 | 편지함 열리는 오버레이 |
| 구슬 선택 | 모닥불 약해짐, 구슬 빛남 | 달빛 약해짐, 꽃봉오리 핌 |
| 분석 중 | 구슬 빛남 | 꽃에서 빛 방출 |
| 토론 | 구슬 빛 교차 | 꽃봉오리 빛 교차 |
| 결론 | 모닥불 꺼짐 | 달빛 어두워짐 + 반딧불 사라짐 |

---

## 구슬 → 꽃봉오리 비주얼

| 요소 | 모험가 (구슬) | 달빛정원 (봉오리) |
|------|-------------|----------------|
| 형태 | 원형 (구체) | 꽃봉오리 형태 (방울) |
| 미선택 | 반투명 원 + float 애니메이션 | 닫힌 봉오리 + 살짝 흔들림 |
| 선택 시 | 빛나며 확대 | 꽃이 피는 애니메이션 |
| 분석 중 | 구슬 내부 이미지 | 꽃잎 사이로 빛 |
| 불일치 | 구슬 빛 충돌 | 봉오리 색상 대비 |

```css
.flower-bud {
  width: 72px;
  height: 72px;
  background: radial-gradient(circle at 40% 40%, rgba(167,139,250,0.3), transparent);
  border: 2px solid rgba(167, 139, 250, 0.2);
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; /* 봉오리 형태 */
  transition: all 0.5s;
}

.flower-bud.selected {
  border-radius: 50%; /* 피면서 원형으로 */
  border-color: #a78bfa;
  box-shadow: 0 0 30px rgba(167, 139, 250, 0.4);
  animation: bloom 0.8s ease-out;
}

@keyframes bloom {
  0% { transform: scale(1); border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%; }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); border-radius: 50%; }
}
```

---

## 색상 팔레트

```
배경:   #0f1729 → #1a2744 (남색 밤)
주요:   #a78bfa (보라 — 달빛)
보조:   #c4b5fd (연보라)
카드:   rgba(167, 139, 250, 0.05)
텍스트: #d4d4e0
약한:   #777
경고:   #fbbf24
```

---

## 사운드

| 요소 | 모험가 | 달빛정원 |
|------|--------|---------|
| BGM | lo-fi + 모닥불 크래클 | 어쿠스틱 기타 + 밤벌레 + 물소리 |
| 구슬 선택 | 크리스탈 종 소리 | 꽃 피는 소리 (소프트 팝) |
| 단계 완료 | 두루마리 닫힘 | 편지 봉투 닫힘 |
| 세션 종료 | 불 꺼지는 소리 | 달빛 페이드 + 귀뚜라미 |

---

## 데이터 카드 스타일 (달빛정원)

```css
.data-card-garden {
  background: rgba(167, 139, 250, 0.05);
  border: 1px solid rgba(167, 139, 250, 0.15);
  border-radius: 16px; /* 모험가보다 더 둥글게 */
  padding: 16px;
}

.data-card-garden:hover {
  border-color: rgba(167, 139, 250, 0.4);
}

.data-card-garden.selected {
  border-color: #a78bfa;
  box-shadow: 0 0 20px rgba(167, 139, 250, 0.2);
}
```

---

나머지 구조(컴포넌트 트리, 페이지 레이아웃, 반응형, 사운드 시스템)는 모험가_UI_설계.md와 동일. Theme prop으로 분기.

*설계: 2026-03-20 by Claude Code (A5 — 달빛정원 UI)*
