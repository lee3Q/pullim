import assert from "node:assert/strict";
import { test } from "node:test";
import { destination } from "../src/lib/safety/ultimate-stage.ts";

test("ladder chat can keep listening after research and analysis without moving the stage", () => {
  assert.equal(destination("listen", {}, "check_in"), "define_problem");
  assert.equal(destination("listen", {}, "define_problem"), "define_problem");
  assert.equal(destination("listen", {}, "research"), "research");
  assert.equal(destination("listen", {}, "values"), "values");
});

test("listen stays blocked in the decision stages", () => {
  assert.equal(destination("listen", {}, "provisional_decision"), null);
  assert.equal(destination("listen", {}, "next_action"), null);
});

test("other forbidden transitions are unchanged", () => {
  assert.equal(destination("research", {}, "check_in"), null);
  assert.equal(destination("ladder_research", {}, "check_in"), null);
  assert.equal(destination("analyze", {}, "define_problem"), null);
  assert.equal(destination("debate", {}, "research"), null);
  assert.equal(destination("conclude", {}, "define_problem"), null);
});
