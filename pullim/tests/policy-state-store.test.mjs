import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { test } from "node:test";
import { commitPolicyState, loadPolicyState, markPolicyEmergency, StalePolicyState } from "../src/lib/safety/policy-state-store.ts";

test("stale signed session snapshots cannot overwrite emergency state", async () => {
  const sessionId = randomUUID();
  const initial = { sessionId, version: 0, stage: "check_in", riskState: "open",
    consent: "unknown", choiceHashes: [], events: [] };
  await commitPolicyState(initial);
  const old = await loadPolicyState(sessionId);
  const emergency = await loadPolicyState(sessionId);
  assert.ok(old && emergency);
  emergency.riskState = "emergency";
  await commitPolicyState(emergency);
  old.stage = "research";
  await assert.rejects(commitPolicyState(old), StalePolicyState);
  const current = await loadPolicyState(sessionId);
  assert.equal(current?.riskState, "emergency");
  assert.equal(current?.stage, "check_in");
});

test("an emergency mark blocks a concurrent older open-state write", async () => {
  const sessionId = randomUUID();
  await commitPolicyState({ sessionId, version: 0, stage: "define_problem", riskState: "open",
    consent: "unknown", choiceHashes: [], events: [] });
  const older = await loadPolicyState(sessionId);
  assert.ok(older);
  await markPolicyEmergency(sessionId);
  await assert.rejects(commitPolicyState(older), StalePolicyState);
  assert.equal((await loadPolicyState(sessionId))?.riskState, "emergency");
});
