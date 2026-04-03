# 하네스: 천문대/종말 BGM 교체 + 배포

## 배경
ICC 발표에서 "5테마 각각 이미지·BGM·말투가 다름"이라 주장했으나,
천문대(stargazer) BGM 2개 + 종말(apocalypse) BGM 1개가 **4.4KB 무음 placeholder**.
종말은 2번 트랙 자체가 없음 (config에도 1개만 등록).

정상 BGM 크기 참고: 모험가 4.6MB, 달빛정원 3.9MB, 전략실 3.6MB.

## 전제 조건
🔴 대표가 Suno/Udio에서 BGM 4곡을 생성해서 아래 파일명으로 저장해야 함:
- `pullim/public/assets/stargazer-bgm.mp3` (덮어쓰기)
- `pullim/public/assets/stargazer-bgm-2.mp3` (덮어쓰기)
- `pullim/public/assets/apocalypse-bgm.mp3` (덮어쓰기)
- `pullim/public/assets/apocalypse-bgm-2.mp3` (신규)

## 공통 규칙
- 기존 파일을 **먼저 읽고** 최신 상태 위에서 수정
- 파일 수정 후 반드시 `cd ~/study/main/pullim/pullim && npx next build` 로 빌드 확인
- 커밋 메시지: `feat: [간단 설명]`

---

## Task 1: 종말 BGM 2번 트랙 config 등록

**파일**: `pullim/src/lib/themes/index.ts`

**현재 상태** (apocalypse bgmTracks):
```ts
bgmTracks: [
  { src: "/assets/apocalypse-bgm.mp3", label: "종말 1" },
],
```

**수정 후**:
```ts
bgmTracks: [
  { src: "/assets/apocalypse-bgm.mp3", label: "종말 1" },
  { src: "/assets/apocalypse-bgm-2.mp3", label: "종말 2" },
],
```

**검증**: 빌드 통과 확인.

---

## Task 2: BGM 파일 교체 확인 + 빌드 + 커밋 + 푸시

**순서**:
1. 4개 BGM 파일이 존재하고 **100KB 이상**인지 확인 (placeholder 방지):
   ```bash
   for f in stargazer-bgm.mp3 stargazer-bgm-2.mp3 apocalypse-bgm.mp3 apocalypse-bgm-2.mp3; do
     size=$(wc -c < "pullim/public/assets/$f" 2>/dev/null || echo 0)
     if [ "$size" -lt 100000 ]; then echo "FAIL: $f is $size bytes (placeholder)"; exit 1; fi
     echo "OK: $f ($size bytes)"
   done
   ```
2. `cd ~/study/main/pullim/pullim && npx next build` — 빌드 통과 확인
3. 커밋: `feat: 천문대/종말 실제 BGM 교체 + 종말 2번 트랙 추가`
4. `git push origin main`

**완료 조건**: 4개 파일 모두 100KB 이상 + 빌드 통과 + Vercel 배포 트리거.

---

## BGM 생성 프롬프트 (대표용 — Suno/Udio)

### 천문대 BGM 1 — "별의 관측실"
```
Ambient lo-fi, soft piano melody over deep space pad synths, gentle celestial chimes, slow tempo 65 BPM, dreamy and contemplative, like stargazing alone at an observatory at midnight, subtle vinyl crackle, no vocals, 2 minutes loop-friendly
```

### 천문대 BGM 2 — "별자리 사이"
```
Ethereal ambient, soft harp arpeggios with reverb, distant cosmic drone, twinkling bell sounds like stars, meditative and curious mood, 70 BPM, lo-fi warm texture, telescope-at-dawn feeling, no vocals, 2 minutes loop-friendly
```

### 종말 BGM 1 — "잿빛 여명"
```
Post-apocalyptic ambient, low distorted drone with sparse piano notes, distant wind and debris sounds, melancholic but resilient mood, 55 BPM, cinematic lo-fi, like walking through ruins at dawn with hope, no vocals, 2 minutes loop-friendly
```

### 종말 BGM 2 — "마지막 모닥불"
```
Dark ambient folk, gentle acoustic guitar over ominous low pad, crackling fire samples, slow 60 BPM, bittersweet survival mood, warmth against desolation, intimate campfire in a broken world, no vocals, 2 minutes loop-friendly
```

**팁**: Suno에서 "Instrumental" 체크 필수. 길이 2분. 루프 가능하게 앞뒤 페이드.
