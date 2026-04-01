# API 키 빠른 세팅 (5분 완료)

> ANTHROPIC_API_KEY 없으면 풀림이 데모 모드로만 동작함 — 실제 AI 응답 불가.

---

## 1단계 — API 키 발급 (2분)

1. 브라우저에서 **https://console.anthropic.com** 열기
2. 로그인 → 왼쪽 메뉴 **"API Keys"** 클릭
3. 오른쪽 위 **"Create Key"** 버튼 클릭
4. 이름 아무거나 입력 (예: `pullim`) → **"Create Key"** 확인
5. 화면에 `sk-ant-api03-...` 형태의 키가 나옴
6. **지금 바로 복사** — 창 닫으면 다시 볼 수 없음

---

## 2단계 — Vercel에 등록 (2분, 배포 서버용)

1. **https://vercel.com** → 풀림 프로젝트 클릭
2. 상단 탭 **"Settings"** 클릭
3. 왼쪽 메뉴 **"Environment Variables"** 클릭
4. 입력 칸에 아래처럼 채우기:
   - Key: `ANTHROPIC_API_KEY`
   - Value: 복사해둔 키 붙여넣기 (`sk-ant-...`)
5. **"Save"** 클릭
6. 상단 **"Deployments"** 탭 → 최신 배포 오른쪽 **"..."** → **"Redeploy"** 클릭
   - 재배포 안 하면 키가 적용 안 됨

---

## 3단계 — 내 컴퓨터에 등록 (1분, 로컬 테스트용)

1. Finder에서 `/Users/sanggyulee/study/main/pullim/pullim/` 폴더 열기
2. `.env.local` 파일 찾기 (없으면 `.env.local.example` 복사 → 이름을 `.env.local`로 변경)
3. 텍스트 편집기로 열기
4. 아래 줄에 키 붙여넣기:
   ```
   ANTHROPIC_API_KEY=sk-ant-여기에붙여넣기
   ```
5. 저장

---

## 4단계 — 작동 확인

**배포 서버**: https://pullim.vercel.app 열기 → 세션 시작 → AI가 실제로 답변하면 성공

**내 컴퓨터**: 터미널에서 `npm run dev` 실행 → http://localhost:3000 열기 → 세션 시작

> 데모 모드일 때는 화면 상단에 "데모 모드" 표시가 뜸. 표시가 없으면 실제 AI 모드.

---

*더 자세한 테스트 방법 → `API_테스트_가이드.md` 참고*
