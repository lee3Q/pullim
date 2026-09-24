# Pullim

Pullim helps a person move from a vague concern through listening, problem
definition, research, value exploration, a provisional decision, and a next
action. The person chooses and confirms the action. Model text does not own
the right to advance the protocol.

## Run locally

```sh
npm ci
npm run dev -- --port 3147
```

Without an AI key the app runs in demo mode. In production, set
`PULLIM_POLICY_SECRET` to a random server-only value (for example, generated
with `openssl rand -hex 32`) and configure `PULLIM_POLICY_REDIS_URL` plus
`PULLIM_POLICY_REDIS_TOKEN` for a shared Redis REST store. Requests fail closed
with HTTP 503 if the secret or durable store is unavailable. Local development
uses process memory for the synthetic demo; restarting that process starts fresh
sessions. See `.env.local.example` for the configuration names.

## Decision policy

All six `/api/ultimate/*` conversation routes and the ladder research,
analysis, and behind-thought routes pass through
`src/lib/safety/ultimate-policy.ts` before demo or model work. A signed cookie
identifies the session; the server-side store tracks stage, risk state, consent,
offered choice hashes, and recent event types. It keeps only hashes of user
utterances, not their raw text. A new session ID starts a new protocol state.
Old signed cookies read the latest state and cannot roll back an emergency.
Concurrent writes compare state versions and reject stale responses. The server
rejects stage jumps, holds ambiguous risk until explicit confirmation, and
keeps imminent risk in the emergency state for that session. Risk responses
carry a structured policy status and the relevant help path.

The conclusion route validates model JSON and offers provisional options.
Clicking an option and deadline sends explicit consent to
`/api/ultimate/action`. The action route accepts only an option whose hash was
recorded from the server's conclusion response, checks the proposal schema,
and uses `executeProposal` to authorize the transition to `next_action`.
Malformed output, mismatched risk, denied consent, and forbidden transitions
do not execute an action. The user can dismiss the provisional conclusion
without committing. The five theme screens and the ladder screen show risk
holds before continuing; the theme screens stop when research or judge
validation fails.

## Public verification

In one terminal, run `npm run dev -- --port 3147` with no model API key. In
another, run:

```sh
npm test
npx tsc --noEmit
node scripts/verify-policy-http.mjs --out /tmp/pullim-policy-http-receipt.json
```

The recorded synthetic receipt is [evidence/public-policy-http.json](evidence/public-policy-http.json).
The HTTP script checks 24 requests through the actual Next routes: ordinary
progress, a forbidden stage jump, a demo-mode risk signal, persistent risk
hold, explicit safety confirmation, emergency stickiness, consent refusal,
malformed proposal rejection, and an authorized action. It uses only
synthetic concerns. This is Stage 1 implementation evidence; it is not a
clinical safety or decision-quality study. The cookie is a one-browser
session control, not a cross-device event database. Future research must
evaluate the protocol with independent human outcomes and safety review.

For the local Redis REST and Next HTTP path, first install dependencies, then
run from the repository root:

```sh
cd pullim && npm ci && cd ..
node pullim/scripts/record-policy-evidence.mjs --out-dir /tmp/pullim-policy-evidence
```

The recorder runs tests, TypeScript, and a production build before an actual
local `redis-server` HTTPS REST check, three independent crossed HTTP races,
and the 24 route regressions. It retains command exit codes, timing, hashes,
and raw receipts in the chosen directory. It requires `redis-server`, `openssl`,
and Node.js. An independent reviewer can place a `Verdict: PASS` or
`Verdict: REVISE` review in `independent-qa.md` and write a scoped report;
`verify-policy-evidence.mjs --evidence-dir DIR --report FILE` checks that review,
the raw receipts, and the report. Its default paths are the project session's
evidence and report locations. These checks cover a synthetic local engine and
local Next server, not a managed Redis deployment or clinical safety.
