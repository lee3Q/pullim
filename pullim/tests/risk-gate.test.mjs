import assert from "node:assert/strict";
import test from "node:test";
import { gateRiskAction } from "../src/lib/safety/risk-gate.ts";

test("imminent risk stops both decision proposals and stage progression with help", () => {
  for (const action of ["propose_decision", "advance_stage"]) {
    const result = gateRiskAction("open", { type: "risk_signal", level: "imminent" }, action);
    assert.equal(result.state, "emergency");
    assert.equal(result.executedAction, null);
    assert.match(result.message, /119/);
    assert.ok(result.helpPaths.some((path) => path.phone === "119"));
    assert.ok(result.helpPaths.some((path) => path.phone === "109"));
  }
});

test("ambiguous risk holds actions until explicit safety confirmation", () => {
  const held = gateRiskAction("open", { type: "risk_signal", level: "ambiguous" }, "advance_stage");
  assert.equal(held.state, "awaiting_confirmation");
  assert.equal(held.executedAction, null);
  assert.match(held.message, /생각이나 계획/);

  const noAnswer = gateRiskAction(held.state, { type: "risk_signal", level: "none" }, "propose_decision");
  assert.equal(noAnswer.state, "awaiting_confirmation");
  assert.equal(noAnswer.executedAction, null);

  const unclear = gateRiskAction(held.state, { type: "risk_confirmation", answer: "unclear" }, "advance_stage");
  assert.equal(unclear.state, "awaiting_confirmation");
  assert.equal(unclear.executedAction, null);

  const cleared = gateRiskAction(held.state, { type: "risk_confirmation", answer: "safe" }, "advance_stage");
  assert.equal(cleared.state, "open");
  assert.equal(cleared.executedAction, null);

  const nextTurn = gateRiskAction(cleared.state, { type: "risk_signal", level: "none" }, "advance_stage");
  assert.equal(nextTurn.executedAction, "advance_stage");
});

test("unsafe confirmation escalates and emergency cannot be cleared by later input", () => {
  const emergency = gateRiskAction("awaiting_confirmation", { type: "risk_confirmation", answer: "unsafe" }, "propose_decision");
  assert.equal(emergency.state, "emergency");
  assert.equal(emergency.executedAction, null);

  const later = gateRiskAction(emergency.state, { type: "risk_confirmation", answer: "safe" }, "advance_stage");
  assert.equal(later.state, "emergency");
  assert.equal(later.executedAction, null);
});

test("ordinary input permits the proposed action", () => {
  const result = gateRiskAction("open", { type: "risk_signal", level: "none" }, "advance_stage");
  assert.equal(result.executedAction, "advance_stage");
  assert.equal(result.message, null);
});
