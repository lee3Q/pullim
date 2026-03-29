# 이미지 매핑 감사 — 2026-03-29

## 감사 대상
`pullim/src/lib/personalization/story-scenes.ts` 내 모든 `imagePath` (75개)
기준 디렉토리: `pullim/public/`

---

## 결과 요약

| 테마 | 총 장면 | 정상 | 누락 | 상태 |
|------|---------|------|------|------|
| garden (정원) | 15 | 15 | 0 | ✅ 전체 정상 |
| adventure (모험) | 15 | 15 | 0 | ✅ 전체 정상 |
| strategy (전략) | 15 | 15 | 0 | ✅ 전체 정상 |
| stargazer (천문대) | 15 | 10 | 5 | ❌ 11~15번 누락 |
| apocalypse (종말) | 15 | 0 | 15 | ❌ 전체 누락 (미생성) |

---

## ❌ stargazer — 누락 파일 5개

코드 경로: `/images/v3/stargazer_11.png` ~ `/images/v3/stargazer_15.png`
실제 `pullim/public/images/v3/`에 해당 파일 없음.

```
/images/v3/stargazer_11.png  ← 없음
/images/v3/stargazer_12.png  ← 없음
/images/v3/stargazer_13.png  ← 없음
/images/v3/stargazer_14.png  ← 없음
/images/v3/stargazer_15.png  ← 없음
```

**참고:** `pullim/public/images/v3/`에는 `stargazer_level1.png` ~ `stargazer_level5.png` 존재.
레벨 이미지는 있으나 discovery scene 11~15와는 별개 파일 — 매핑 불가.

**조치 필요:** stargazer_11~15 이미지 생성 후 `/images/v3/`에 배치. 또는 임시로 기존 1~10 이미지 재활용.

---

## ❌ apocalypse — 누락 파일 15개 (이미지 미생성)

코드 경로: `/assets/discovery/apocalypse_1.png` ~ `/assets/discovery/apocalypse_15.png`
이미지 생성 자체가 아직 안 됨 (handoff_7 기준: 이미지 100장 생성 대기 중).

```
/assets/discovery/apocalypse_1.png  ~ apocalypse_15.png  ← 전체 없음
```

**조치 필요:** 이미지 생성 후 `pullim/public/assets/discovery/`에 배치.

---

## ✅ 정상 테마 상세

### garden (정원)
- `/assets/discovery/garden_1.jpg` ~ `garden_10.jpg` ✅
- `/images/v3/garden_11.png` ~ `garden_15.png` ✅

### adventure (모험)
- `/assets/discovery/adventure_1.jpg` ~ `adventure_10.jpg` ✅
- `/images/v3/adventure_11.png` ~ `adventure_15.png` ✅

### strategy (전략)
- `/assets/discovery/strategy_1.jpg` ~ `strategy_10.jpg` ✅
- `/images/v3/strategy_11.png` ~ `strategy_15.png` ✅

### stargazer (천문대) — 1~10만 정상
- `/assets/discovery/stargazer_1.png` ~ `stargazer_10.png` ✅
- `/images/v3/stargazer_11.png` ~ `stargazer_15.png` ❌

---

## 우선순위

1. **stargazer 11~15** — 테마가 이미 프로덕션에 있으므로 빠른 수정 필요
2. **apocalypse 1~15** — 이미지 배치 작업 시 함께 해결

---

## 파일: /tmp/missing-images.txt
상세 누락 목록 저장 완료.
