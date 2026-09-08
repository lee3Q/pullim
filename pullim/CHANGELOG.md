# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [0.1.0] — 2026-05-21

### Added

**Initial Open Source Release**

- **Ladder Session** — 5-level adaptive conversation system (sensory → comparison → analysis → choices → free text). Automatically adjusts to the user's expressive capacity.
- **Inner Reasoning** — Optional adaptive regulation layer. Rule-based by default, LLM-based via `ENABLE_BEHIND_LLM=true` opt-in.
- **Crisis Safety** — Two-tier keyword detection (RED/YELLOW) running before any LLM call. RED halts execution and shows crisis resources (109, 1577-0199, 1588-9191).
- **Provider Abstraction** — Unified interface for Claude, GPT, Gemini, GLM, and local LLM (Ollama-compatible). Switch via environment variables.
- **Demo Mode** — Full application experience with curated mock data. No API keys required.
- **Perspective Lenses (Crystals)** — Analytical reframing tools. Each crystal provides a different thinking angle.
- **Theme Renderer** — Visual and conversational theme system for the reflection experience.
- **Reference App** — Next.js 16 app with React 19, TypeScript, Tailwind CSS 4, Zustand, Supabase, and Capacitor.
- **Unit Tests** — 22 crisis-detector tests covering Tier A, Tier B, GREEN, and priority rules.
- **`.env.example`** — Complete environment variable template with documentation.
- **MIT License** — Open source under MIT, Copyright (c) 2026 Sanggyu Lee.
- **`server-only` guards** — All LLM provider and session modules protected from client-side import.

### Not Included by Default

These features exist in the codebase but are not enabled or recommended for public deployment:

- **Monetization** — No payment integration or subscription system.
- **Ad Gate** — Ad UI exists but is disabled by default (`NEXT_PUBLIC_ENABLE_ADS=false`).
- **Paid Crystal Balance** — No in-app purchase system.
- **External Research** — Perplexity integration is experimental. Returns demo data without API key.
- **Judge Model** — Lightweight model for debate evaluation. Experimental.
- **Public Hosted Demo** — No rate limiting, authentication, or body size guards. See [SECURITY.md](SECURITY.md) before deploying publicly.
