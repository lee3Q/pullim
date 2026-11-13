import assert from "node:assert/strict";
import { test } from "node:test";
import {
  unravelConcern,
  separateFactsAndAssumptions,
  detectCognitiveTraps,
  detectBreakthroughInsight,
} from "../src/lib/core/unravel-engine.ts";

test("unravelConcern separates facts from assumptions and generates 3 lenses and 1 recommended option", () => {
  const input =
    "내 레포를 어떻게 해야 사람들이 쓸만한 오픈소스로 변화시킬지 고민이야. 기존에 만든 것들이 아까워서 갈아엎으면 분명 다 망할 것 같아.";
  const result = unravelConcern(input, { preferredLens: "structural" });

  assert.equal(result.haltedByCrisis, false);
  assert.equal(result.topicDomain, "project");
  assert.ok(result.facts.length >= 1);
  assert.ok(result.assumptions.length >= 1);
  assert.equal(result.lenses.length, 3);
  assert.equal(result.options.length, 4);
  assert.equal(result.options.filter((o) => o.recommended).length, 1);
  assert.ok(result.ifThenPlan.trigger.length > 0);
  assert.ok(result.ifThenPlan.action.length > 0);
  assert.ok(result.cognitiveTraps.some((t) => t.id === "sunk_cost" || t.id === "catastrophizing"));
});

test("unravelConcern immediately halts on Tier A crisis input and returns 109 helpline", () => {
  const result = unravelConcern("너무 힘들어서 오늘 밤에 죽고 싶다");
  assert.equal(result.haltedByCrisis, true);
  assert.equal(result.crisisTier, "A");
  assert.ok(result.crisisResponse);
  assert.equal(result.options.length, 0);
  assert.ok(result.crisisResponse.hotlines.some((h) => h.number === "109"));
});

test("detectCognitiveTraps identifies binary thinking, mind reading, and should pressure", () => {
  const traps = detectCognitiveTraps(
    "무조건 완벽하게 해야만 하는데, 못하면 분명 나를 실망할 거고 전부 아니면 끝장이야.",
  );
  const ids = new Set(traps.map((t) => t.id));
  assert.ok(ids.has("binary_thinking"));
  assert.ok(ids.has("mind_reading"));
  assert.ok(ids.has("should_pressure"));
});

test("detectBreakthroughInsight recognizes deep self-authored insight for Hall of Insights", () => {
  const shortNote = detectBreakthroughInsight("그냥 모르겠다");
  assert.equal(shortNote.isBreakthrough, false);

  const deepInsight = detectBreakthroughInsight(
    "결국 내가 두려웠던 건 실패 자체가 아니라 남들에게 완벽해 보여야 한다는 내 기준의 강박이었다는 걸 깨달았다.",
  );
  assert.equal(deepInsight.isBreakthrough, true);
  assert.ok(deepInsight.score >= 0.55);
});

test("separateFactsAndAssumptions handles empty or minimal concern gracefully", () => {
  const empty = separateFactsAndAssumptions("   ");
  assert.equal(empty.facts.length, 1);
  assert.equal(empty.assumptions.length, 1);
});
