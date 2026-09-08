# Self-Hosting Guide (자체 호스팅 가이드)

Pullim을 자기 환경에서 실행하는 방법입니다.

## 로컬 실행

```bash
git clone https://github.com/sanggyulee/pullim.git
cd pullim
npm install
cp .env.example .env.local
npm run dev
```

기본값 `LLM_MODE=demo`로 외부 API 호출 없이 실행됩니다.

## API 키

- 사용자가 **자기 계정의 API 키**를 사용합니다.
- `.env.local`에 설정:
  - `ANTHROPIC_API_KEY` — Claude
  - `OPENAI_API_KEY` — GPT
  - `GOOGLE_AI_API_KEY` — Gemini
  - `GLM_API_KEY` + `GLM_BASE_URL` — GLM
  - `PERPLEXITY_API_KEY` — Perplexity (실험적)
- 모든 키는 선택사항입니다. 키가 없으면 demo 모드로 동작합니다.
- API 키를 절대 git에 commit하지 마세요.

## 로컬 모델 사용

Ollama 호환 로컬 LLM을 사용할 수 있습니다:

```env
LLM_MODE=local
LOCAL_LLM_BASE_URL=http://localhost:11434
LOCAL_LLM_MODEL=qwen3:4b
```

로컬 모델 사용 시 API 비용이 발생하지 않습니다.

## 공개 배포 (Vercel 등)

**주의: 공개 배포에 실제 API 키를 연결하면 비용이 발생합니다.**

공개 배포 전 필수 보호장치:

1. **인증(Authentication)** — 로그인 또는 API 토큰
2. **Rate Limit** — 사용자당 요청 수 제한
3. **Body Size Limit** — 요청 본문 크기 제한
4. **사용량 할당(Quota)** — 일일/월간 사용량 상한
5. **비용 알림(Budget Alert)** — API 비용 임계치 초과 시 알림

### 공개 데모 안전 모드

```env
PULLIM_HOSTED_DEMO=true
LLM_MODE=demo
```

`PULLIM_HOSTED_DEMO=true`이면 외부 cloud LLM/Perplexity 호출이 모두 차단되고 demo fallback만 사용됩니다. 실제 API 비용이 발생하지 않습니다.

## 데이터 저장

- **기본**: 브라우저 localStorage (서버 저장 없음)
- **Supabase 연동**: `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL` 설정
  - RLS(Row Level Security) 정책 필수
  - anon key만으로는 보안 미충족

## 빌드

```bash
npm run build
npm start
```

Node.js 환경에서 프로덕션 빌드를 실행합니다.
