# Pullim

Experimental self-reflection and decision-support app. Start with one ordinary
concern, separate facts from assumptions, consider options, and choose a small
next action yourself. It is not a therapist, diagnostic test, emergency service,
or validated predictor of behavior. No treatment or decision-quality benefit
has been established for this product.

The Next.js app is in [`pullim/`](pullim/), not this repository root. This
repository also contains historical research and project artifacts. They are
not all required to run the app.

## Try the local demo

Requires Node.js 20.9 or newer and npm. This change was checked with Node 22.

```sh
git clone https://github.com/lee3Q/pullim.git
cd pullim/pullim
npm ci
npm run dev -- --hostname 127.0.0.1 --port 3147
```

Open http://127.0.0.1:3147. Use fictional concerns for the demo. No AI key or
Supabase account is needed for the synthetic demo. A model response in demo mode
is canned content, not personal advice. Do not copy placeholder API keys into
`.env.local`; leave external services unconfigured for the no-cost demo.

```sh
npm test
npx tsc --noEmit
npm run build
```

The build is a compile check, not a ready-to-deploy certificate. Policy HTTP
checks and production store requirements are documented in the
[app README](pullim/README.md).

## Synthetic UI checks

From the app directory, install the Playwright browser once, then run only the
synthetic tests below. The existing Playwright config starts a local dev server
on port 3000. These tests mock API replies and do not use a paid model service.

```sh
npx playwright install chromium
npx playwright test tests/e2e/action-history.spec.ts tests/e2e/ultimate-action.spec.ts
```

Screenshots go to `.playwright-results/` under the app directory, separate from
tracked historical `test-results/` evidence. No external working
directory is required. The checks cover history writes, denied policy, local
storage failure and retry, and five theme flows. They do not verify live model
behavior or clinical safety. Korean text was inspected; some emoji glyphs in
the test environment remain unverified.

## Who might use it?

- A person with a low-stakes, vague concern who wants to turn it into a clear
  question and a small, reversible next action.
- A developer studying consent-controlled conversation flows with synthetic
  inputs, rather than deploying a clinical service.

These are candidate use cases based on the current flow and related research,
not observed customer demand. See [user jobs and evidence](docs/USER_JOBS_AND_EVIDENCE.md).

## Before deployment or wider reuse

- Dependency audit after the Next.js 16.4.4 update on 2026-11-03 with
  Node 22.23.4 and npm 10.9.9 reported 4 production findings (all moderate).
  The full audit including development dependencies reported 20 findings
  (19 moderate, 1 high). Counts can change with the audit database. These are
  dependency findings, not proof of exploitability or a security certificate.
- Production requires a server-only policy secret and a shared Redis REST
  store. Local in-memory policy state is not durable across restarts.
- Browser-local data, Supabase persistence, model requests, and policy-state
  hashes are different data paths. Do not interpret hashed policy state as
  proof that all app data is hashed or stays local. Read the source and privacy
  page before submitting personal content.
- No repository license was found at the inspected revision. Public source
  visibility is not an open-source reuse license. The owner must choose the
  license; this change does not choose it.
- Native iOS/Android, managed Redis/Supabase, paid model calls, and clinical
  safety were not tested. Do not rely on the app in an emergency.
