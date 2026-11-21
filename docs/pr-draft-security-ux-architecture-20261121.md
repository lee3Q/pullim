# Draft PR — security and UX architecture fixes

## Summary

- Restrict server-side BYOK provider destinations.
- Cap HTTP JSON bodies at 1 MiB with a 413 response.
- Escape untrusted renderer text and move affected dynamic actions to data attributes.
- Add focused adversarial regression tests.

## Contract

Built-in processing remains local. OpenAI BYOK uses the official HTTPS v1 endpoint. Ollama remains available on explicit loopback HTTP endpoints. Invalid external configuration falls back to the built-in engine. JSON POST bodies above 1 MiB are rejected.

## Reproduction and patch rationale

The audit reproduced API-key and concern exfiltration through arbitrary `baseUrl`, HTML/inline-handler injection through user and LLM text, and memory amplification from unbounded JSON buffering. The patch places the smallest enforceable boundaries at the provider fetch and shared body reader, then escapes affected UI fields without changing local storage or BYOK defaults.

## Verification

Run `npm test`, `npm run lint`, `npm run build`, and the focused HTTP adversarial tests. Record the exact commands and commit SHA in the final audit evidence.

## Unknowns and rollback

Deployment proxy limits, CSP, DNS rebinding, and browser execution remain deployment-level unknowns. Roll back by reverting the implementation commit on the audit branch.
