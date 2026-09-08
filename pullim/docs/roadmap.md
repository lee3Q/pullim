# Roadmap

## v0.1 — Initial Open Source Release (Current)

- Ladder Session (5-level adaptive conversation)
- Crisis Safety (RED/YELLOW/GREEN)
- Provider Abstraction (Claude/GPT/Gemini/GLM/Local)
- Demo Mode (no API keys required)
- Inner Reasoning (rule-based default, LLM opt-in)
- Perspective Lenses (Crystals)
- Theme Renderer
- Reference Next.js 16 app
- MIT License

## P1 — Safety Normalization

- Standardize YELLOW (Tier B) handling across all routes
- Create shared safety response helper
- Only `ultimate/listen` currently has full YELLOW handling
- Other routes set `safetyLevel = "YELLOW"` but don't inject guards

## P1 — API Abuse Protection

- Rate limiting on all API routes
- Request body size limits
- Priority routes: `ultimate/listen`, `ultimate/analyze`, `ultimate/debate`
- Recommended: upstash/ratelimit or Vercel KV

## P1 — Provider Cleanup

- Merge `src/lib/llm/claude.ts` and `src/lib/providers/claude.ts` (and other duplicates)
- Reduce the two-layer provider architecture to a single layer

## P1 — Tests

- Expand test coverage beyond crisis-detector
- Integration tests for ladder flow
- Provider abstraction tests
- Prompt regression tests

## Experimental — Ultimate Pipeline Stabilization

The ultimate pipeline is included as experimental code:

- `listen` → `research` → `analyze` → `debate` → `judge` → `conclude`
- Multi-model debate (2+ models)
- Judge model (lightweight evaluation)
- Perplexity research integration

Before marking as stable:

- YELLOW handling must be complete on all stages
- Rate limiting must be in place
- Safety prompts must be audited for each stage
- Test coverage for each stage

## Not Planned for v0.x

- Authentication system
- Payment / subscription integration
- Public hosted demo (requires abuse protection first)
- Internationalization (crisis keywords are Korean-only)
- Mobile app (Capacitor config exists but is not actively maintained)
