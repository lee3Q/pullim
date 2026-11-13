# Contributing to Pullim (풀림)

Thank you for your interest in contributing to **Pullim (풀림)**!

## Core Principles

1. **Augment Only, Never Replace Human Judgment**: Pullim helps a person separate facts from assumptions, explore perspectives, and commit to a small reversible next action of their own choosing.
2. **Deterministic Crisis Safety First**: Any change touching `src/lib/safety/` must preserve the pre-LLM Crisis Safety Gate (`Tier A` immediate halt + `109` / `1577-0199` / `119` helpline guidance, `Tier B` caution hold, sticky emergency state).
3. **100% Local-First & Zero Lock-In**: Users must be able to run Pullim offline/locally with zero paid API keys, zero ads, and full JSON/Markdown export/import portability.
4. **Zero-Dependency Simplicity**: Keep the core engine, CLI, and workbench server runnable directly on Node.js 22+ without heavy external runtime dependencies.

## Development Workflow

```sh
git clone https://github.com/lee3Q/pullim.git
cd pullim

# Run full test suite (54 unit, portability, HTTP & CLI tests)
npm test

# Run lint & build verification
npm run lint
npm run build

# Start local Web Workbench on http://127.0.0.1:3147
npm start

# Run CLI demo
npm run cli -- demo
```
