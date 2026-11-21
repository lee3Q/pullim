# Pullim security audit implementation — 2026-11-21

## Reproduction and confirmation

F-01, F-02, and F-03 were independently confirmed by the supplied security, UX/architecture, and findings-verification reports. F-01 reproduced an attacker-controlled provider listener receiving the BYOK bearer token and concern. F-02 traced concern, provider, ladder, and local journal text into `innerHTML` and inline handlers. F-03 accepted an 8 MiB JSON request and showed substantial RSS amplification.

## Contract and boundary

Pullim remains local-first. The built-in engine sends no concern to an external provider. BYOK OpenAI uses only `https://api.openai.com/v1`. Ollama overrides are restricted to explicit loopback HTTP URLs with a port. Rejected provider configuration falls back to the deterministic engine without contacting the rejected address. Every JSON POST body is capped at 1 MiB and returns 413 when the declared or received body exceeds the cap.

The web renderer escapes untrusted text before inserting HTML and dynamic renderer actions use data attributes handled by a listener. Existing static UI handlers remain a compatibility surface for the current inline script and should be migrated with the surrounding UI event wiring in a separate change.

## Patch rationale

The URL policy prevents arbitrary server-side fetches and key forwarding while preserving the intended OpenAI endpoint and local Ollama workflow. The body cap bounds buffering before JSON parsing. Escaping covers user, model, engine, and stored journal text in the affected renderers. The patch avoids broad schema or persistence changes.

## Tests

`npm test`, `npm run lint`, and `npm run build` are run with the login-shell Node/npm PATH. Focused adversarial tests cover an unapproved OpenAI URL, a 413 body-size boundary, and the renderer source contract. The supplied baseline also records 54 passing Node tests before this patch.

## Unknowns

Reverse-proxy limits, deployment authentication, browser CSP, DNS rebinding behavior after URL validation, and real browser execution were not verified in this repository. The Ollama rule intentionally rejects remote/private-network endpoints because the current server has no operator-authenticated allowlist boundary.

## Rollback

Revert the implementation commit on `audit/security-ux-architecture-20261121`. This restores the previous provider, body-reader, and renderer behavior. Do not remove the pre-existing `STATE.md` or `STATUS.md` files.
