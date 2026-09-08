# Contributing to Pullim

Thank you for your interest in contributing to Pullim.

## Project Direction

Pullim is an adaptive reflection engine. Contributions should align with the core philosophy:

- **Agency first** — The tool serves the user's judgment.
- **Safety as infrastructure** — Crisis handling is a foundation layer, not a feature.
- **Reflection, not direction** — AI surfaces perspectives. The user decides.

## Development Environment

```bash
# Setup
git clone https://github.com/sanggyulee/pullim.git
cd pullim
npm install
cp .env.example .env.local

# Run in demo mode (no API keys needed)
npm run dev

# Run tests
npm run test:unit

# Build
npm run build
```

## Testing

All contributions that modify safety or logic behavior must include tests.

```bash
# Run existing tests
npm run test:unit

# Tests are in tests/unit/
# Uses vitest with @ alias pointing to src/
```

## Safety-Related Contributions

Changes to crisis detection, safety prompts, or crisis response behavior require extra care:

1. **Do not weaken existing safety detection.** Any change that reduces RED or YELLOW detection sensitivity must be justified with concrete examples of false positives.
2. **Test coverage required.** New keywords, patterns, or detection logic must include unit tests.
3. **Review the crisis policy.** See [docs/safety/crisis-policy.ko.md](docs/safety/crisis-policy.ko.md) before modifying safety-related code.
4. **Korean safety resources must remain.** The hotline numbers (109, 1577-0199, 1588-9191) and emergency numbers (112, 119) are non-negotiable.

## Prompt Changes

Pullim uses prompts across multiple providers and pipeline stages. When modifying prompts:

- **Test with demo mode first.** Verify the change doesn't break the demo flow.
- **Check all providers.** A prompt change may work with Claude but break with GPT or Gemini.
- **Keep safety prompts intact.** Safety guard injections (`safetyGuard`, `systemPrompt` modifications) should only be strengthened, never weakened.
- **Document the change.** Include the rationale in your PR description.

## Adding a Provider

To add a new LLM provider:

1. Create `src/lib/providers/<name>.ts` implementing the `LLMProvider` interface from `src/lib/providers/types.ts`.
2. Add `import "server-only"` as the first line.
3. Register the provider in `src/lib/providers/index.ts`.
4. Add corresponding env vars to `.env.example`.
5. Add demo fallback behavior in `src/lib/demo.ts` if applicable.
6. Include tests.

## Privacy and Secrets

- **No real API keys, tokens, or secrets in code or PRs.** Use `.env.example` for documentation only.
- **No personal data.** Do not include real session data, user inputs, or conversation logs in issues or PRs.
- **No personally identifiable information.** Report issues with anonymized examples only.

## Pull Request Process

1. Fork the repository and create a branch from `main`.
2. Make your changes with clear, focused commits.
3. Run `npm run test:unit` and `npm run build` to verify.
4. Open a PR with a description that explains the what and why.

## Code of Conduct

Be respectful. Pullim exists to help people reflect and make decisions. Contributions should reflect that intention.
