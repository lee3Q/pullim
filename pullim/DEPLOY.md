# Vercel 환경변수 설정 가이드

Vercel 대시보드 → Settings → Environment Variables에서 아래 변수를 추가하세요.

| 변수명 | 필수 여부 | 설명 |
|--------|-----------|------|
| `ANTHROPIC_API_KEY` | **필수** | 없으면 데모 모드로만 동작. [Anthropic Console](https://console.anthropic.com)에서 발급. |
| `GOOGLE_AI_API_KEY` | 선택 | 내면사고(듀얼 AI) 기능. 없으면 규칙 기반 폴백으로 동작. |
| `NEXT_PUBLIC_SUPABASE_URL` | 선택 | 피드백 수집용. 없으면 localStorage 폴백. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 선택 | Supabase와 함께 설정. |
