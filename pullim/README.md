# Pullim

**Pullim is an open-source adaptive reflection engine for untangling worries, exploring decisions, and turning vague thoughts into next actions.**

It does not decide for the user. It helps the user recover agency over their own choices.

---

풀림은 흐릿한 고민을 풀고, 선택지를 탐색하며, 막연한 생각을 다음 행동으로 바꾸는 오픈소스 적응형 성찰 엔진입니다.

사용자 대신 결정하지 않습니다. 사용자가 자신의 선택에 대한 주도권을 되찾도록 돕습니다.

---

## Core Philosophy

- **Agency first** — The tool serves the user's judgment, never overrides it.
- **Adaptive difficulty** — Meet people where they are. If expression is hard, lower the bar. If articulation is ready, raise it.
- **Safety as infrastructure** — Crisis detection is not a feature; it's a foundation layer.
- **Reflection, not direction** — AI surfaces perspectives and patterns. The user decides what to do with them.

핵심 철학: 주도권 우선 / 적응형 난이도 / 안전망은 기반 계층 / 성찰은 방향 지시가 아님

## Key Features

### Adaptive Ladder

A 5-level conversation system that adjusts to the user's expressive capacity.

| Level | Name | Mode |
|-------|------|------|
| 1 | Sensory (감각) | Image / color / word selection |
| 2 | Comparison (비교) | Pick between curated options |
| 3 | Analysis (분석 확인) | Confirm or refine AI-organized patterns |
| 4 | Choices (선택) | Select from action alternatives |
| 5 | Free Text (자유 대화) | Open-ended conversation |

The ladder moves down when expression is difficult and up when the user is ready for more agency. See [docs/concepts/ladder.ko.md](docs/concepts/ladder.ko.md).

### Inner Reasoning Layer

An optional adaptive regulation layer that reads conversation signals and adjusts prompts accordingly. Not a hidden control mechanism — it reduces friction, not agency.

- Default: rule-based (no external calls)
- Opt-in: LLM-based inference via `ENABLE_BEHIND_LLM=true`

See [docs/concepts/inner-reasoning.ko.md](docs/concepts/inner-reasoning.ko.md).

### Crisis Safety

A two-tier keyword detection system that runs before any LLM call.

- **RED (Tier A)** — Immediate halt. LLM call is blocked. Crisis resources are shown.
- **YELLOW (Tier B)** — Safety guard injected into the prompt. Conversation continues with caution.
- **GREEN** — Normal conversation.

Safety mode overrides themes, personas, and all other features. See [docs/safety/crisis-policy.ko.md](docs/safety/crisis-policy.ko.md).

### Perspective Lenses (Crystals)

Crystals are not currency — they are perspective lenses. Each one reframes the user's concern through a different analytical angle.

Crystals do not claim to produce truth. They produce thinking material.

See [docs/concepts/perspective-lenses.ko.md](docs/concepts/perspective-lenses.ko.md).

### Theme Renderer

Themed visual and conversational environments that adapt the experience's look and feel. Themes are cosmetic — they do not change the underlying analysis or safety behavior.

### Provider Abstraction

Multi-model support through a unified provider interface:

- Anthropic (Claude)
- OpenAI (GPT)
- Google (Gemini)
- GLM (via z.ai gateway)
- Local LLM (Ollama-compatible)

Switch providers via environment variables without code changes.

### Demo Mode

Run the full application without any API keys. All AI responses are replaced with curated mock data.

Set `LLM_MODE=demo` in `.env.local`.

## Quickstart

```bash
# Clone
git clone https://github.com/sanggyulee/pullim.git
cd pullim

# Install
npm install

# Configure (demo mode — no API keys needed)
cp .env.example .env.local
# LLM_MODE=demo is the default

# Run
npm run dev
```

Open `http://localhost:3000` in your browser.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `LLM_MODE` | Yes | `demo` | `demo` for mock data, `live` for real AI |
| `ANTHROPIC_API_KEY` | No | — | Claude API key |
| `OPENAI_API_KEY` | No | — | GPT API key |
| `GOOGLE_AI_API_KEY` | No | — | Gemini API key |
| `GLM_API_KEY` | No | — | GLM API key |
| `LOCAL_LLM_BASE_URL` | No | `http://localhost:11434` | Ollama endpoint |
| `ENABLE_BEHIND_LLM` | No | `false` | Opt-in LLM-based inner reasoning |
| `NEXT_PUBLIC_ENABLE_ADS` | No | `false` | Ad UI feature flag |
| `NEXT_PUBLIC_SUPABASE_URL` | No | — | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | — | Supabase anon key |

See `.env.example` for the full list with documentation.

## API Keys and Costs

**Pullim does not provide hosted model access or free API credits.**

- The default is `LLM_MODE=demo` — no external LLM API calls, no cost.
- To use Claude, GPT, Gemini, GLM, Perplexity, or other providers, you must supply your own API key in `.env.local` or your deployment environment.
- If you deploy a public instance with real API keys, **you bear all API costs**.
- Do not connect real API keys to a public deployment without authentication, rate limiting, body size limits, and quota enforcement.

**Pullim은 호스팅된 모델 접근이나 무료 API 크레딧을 제공하지 않습니다.**

- 기본값은 `LLM_MODE=demo`이며 외부 LLM API를 호출하지 않고 비용도 발생하지 않습니다.
- Claude, GPT, Gemini, GLM, Perplexity 등을 사용하려면 사용자가 직접 `.env.local` 또는 배포 환경에 API 키를 설정해야 합니다.
- 공개 배포에 실제 API 키를 연결하면 **모든 API 비용은 배포자가 부담**합니다.
- 인증, rate limit, body size 제한, 사용량 할당(quota) 없이 공개 배포에 실제 API 키를 넣지 마세요.

## Safety Disclaimer

**Pullim is not a therapy tool, diagnostic instrument, or emergency service.**

- It does not provide medical, psychological, legal, or financial advice.
- If you or someone you know is in crisis, contact a professional or emergency service immediately.
- In South Korea: **109** (suicide prevention), **1577-0199** (mental health), **112** / **119** (emergency).

See [docs/safety/limitations.ko.md](docs/safety/limitations.ko.md) for full limitations.

## Architecture Overview

```
pullim/
├── src/
│   ├── app/api/           # Next.js API routes
│   │   ├── ladder/        # Ladder session endpoints
│   │   ├── ultimate/      # Ultimate pipeline endpoints
│   │   ├── behind-thought/# Inner reasoning (opt-in)
│   │   └── session-*/     # Session persistence
│   ├── components/        # React components
│   │   ├── session/       # Ladder session UI
│   │   ├── ultimate/      # Ultimate pipeline UI
│   │   └── discovery/     # Onboarding flow
│   ├── lib/
│   │   ├── providers/     # LLM provider abstraction
│   │   ├── llm/           # LLM client wrappers
│   │   ├── safety/        # Crisis detection
│   │   ├── session/       # Session management
│   │   ├── themes/        # Theme configuration
│   │   ├── demo.ts        # Demo mode data
│   │   └── supabase/      # Supabase client
│   └── hooks/             # React hooks
├── tests/unit/            # Unit tests (vitest)
└── docs/                  # Documentation
```

**Tech stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS 4 · Zustand · Supabase · Capacitor

## Experimental Features

These features are included in the codebase but are not part of the stable v0.1 release:

- **Ultimate Pipeline** — A multi-stage reflection flow (listen → research → analyze → debate → judge → conclude). See API routes under `src/app/api/ultimate/`.
- **Research** — Perplexity-powered external research integration. Returns demo cards when no API key is configured.
- **Multi-model Debate** — Two or more models argue opposing perspectives on the user's concern.
- **Judge Model** — A lightweight model evaluates debate arguments for logical consistency.

These features may have incomplete safety handling. See [docs/roadmap.md](docs/roadmap.md) for planned stabilization.

## Hosted Demo Warning

**If you deploy a public instance of Pullim, you MUST implement rate limiting and request body size limits before connecting real API keys.**

Without these protections, your API keys can be abused to generate costs. The current codebase does not include authentication, rate limiting, or body size guards on any API route. See [SECURITY.md](SECURITY.md) for details.

For local development and testing, demo mode (`LLM_MODE=demo`) requires no API keys and has no abuse risk.

## Tests

```bash
# Unit tests
npm run test:unit

# All tests
npm run test
```

## License

[MIT](LICENSE) — Copyright (c) 2026 Sanggyu Lee
