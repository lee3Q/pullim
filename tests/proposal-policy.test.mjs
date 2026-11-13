import assert from "node:assert/strict";
import test from "node:test";
import { executeProposal } from "../src/lib/safety/proposal-policy.ts";

const startingSession = { stage: "check_in", riskState: "open" };

function assertNoAction(result, reason, session = startingSession) {
  assert.equal(result.status, "blocked");
  assert.equal(result.reason, reason);
  assert.equal(result.action, null);
  assert.deepEqual(result.session, session);
}

test("malformed or invalid model output cannot advance or propose a decision", () => {
  for (const raw of [
    "{invalid json",
    JSON.stringify({ risk: "none", action: "advance_stage", targetStage: "define_problem", decision: "extra" }),
    JSON.stringify({ risk: "none", action: "propose_decision", decision: " " }),
    JSON.stringify({ risk: "none", action: "unknown" }),
  ]) {
    assertNoAction(executeProposal(startingSession, "none", raw), "invalid_proposal");
  }

  const decisionSession = { stage: "provisional_decision", riskState: "open" };
  for (const raw of [
    "{invalid json",
    JSON.stringify({ risk: "none", action: "propose_decision", decision: " " }),
    JSON.stringify({ risk: "none", action: "propose_decision", decision: "가상 사례의 임시 선택", targetStage: "next_action" }),
  ]) {
    assertNoAction(executeProposal(decisionSession, "none", raw), "invalid_proposal", decisionSession);
  }
});

test("risk and action disagreement does not execute either model action", () => {
  assertNoAction(
    executeProposal(startingSession, "none", JSON.stringify({ risk: "imminent", action: "advance_stage", targetStage: "define_problem" })),
    "risk_mismatch",
  );
  const decisionSession = { stage: "provisional_decision", riskState: "open" };
  assertNoAction(
    executeProposal(decisionSession, "none", JSON.stringify({ risk: "ambiguous", action: "propose_decision", decision: "가상 사례의 임시 선택" })),
    "risk_mismatch",
    decisionSession,
  );
});

test("forbidden stage jump and premature conclusion leave the session unchanged", () => {
  assertNoAction(
    executeProposal(startingSession, "none", JSON.stringify({ risk: "none", action: "advance_stage", targetStage: "research" })),
    "forbidden_transition",
  );
  assertNoAction(
    executeProposal(startingSession, "none", JSON.stringify({ risk: "none", action: "propose_decision", decision: "가상 사례의 임시 선택" })),
    "forbidden_transition",
  );
});

test("observed risk holds or escalates even when the model proposes progress", () => {
  const raw = JSON.stringify({ risk: "none", action: "advance_stage", targetStage: "define_problem" });
  for (const [risk, status, riskState] of [
    ["ambiguous", "held", "awaiting_confirmation"],
    ["imminent", "escalated", "emergency"],
  ]) {
    const result = executeProposal(startingSession, risk, raw);
    assert.equal(result.status, status);
    assert.equal(result.action, null);
    assert.deepEqual(result.session, { stage: "check_in", riskState });
  }
});

test("a schema-valid permitted next step executes", () => {
  const result = executeProposal(startingSession, "none", JSON.stringify({ risk: "none", action: "advance_stage", targetStage: "define_problem" }));
  assert.equal(result.status, "executed");
  assert.equal(result.session.stage, "define_problem");
  assert.equal(result.action.action, "advance_stage");
});
