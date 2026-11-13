# Security & Crisis Safety Policy

## Crisis Safety Boundary

Pullim is an open-source self-reflection and decision-structuring tool. **It is not a medical device, therapist, diagnostic instrument, or emergency service.**

- All inputs pass through the deterministic crisis detector (`src/lib/safety/crisis-detector.ts`) and risk gate (`src/lib/safety/risk-gate.ts`) **before** any external LLM call.
- Imminent self-harm/suicide risk (`Tier A`) immediately halts decision analysis and surfaces emergency helplines (`109`, `1577-0199`, `1588-9191`, `119`).

## Reporting a Vulnerability

If you discover a security issue or a bypass in the crisis safety gate or policy state store, please open an issue or contact the maintainer (`@lee3Q`) with reproduction steps.
