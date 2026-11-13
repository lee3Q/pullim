import assert from "node:assert/strict";
import { test } from "node:test";
import {
  createLadderSession,
  buildLadderStepCard,
  advanceLadderSession,
  detectOverRationalization,
} from "../src/lib/core/ladder-engine.ts";

test("upward ladder climbs from Level 1 to Level 5 and completes", () => {
  let session = createLadderSession("어디서부터 손대야 할지 막막해요.", {
    direction: "up",
  });
  assert.equal(session.currentLevel, 1);
  assert.equal(session.direction, "up");

  for (const expectedLevel of [1, 2, 3, 4, 5]) {
    assert.equal(session.currentLevel, expectedLevel);
    const card = buildLadderStepCard(
      session.currentLevel,
      session.concern,
      session.direction,
      session.lens,
      session.flipCount,
    );
    assert.equal(card.options.filter((o) => o.recommended).length, 1);
    const rec = card.options.find((o) => o.recommended);
    session = advanceLadderSession(session, {
      type: "select_option",
      optionId: rec.id,
    });
  }

  assert.equal(session.completed, true);
  assert.equal(session.turnCount, 5);
  assert.equal(session.profile.totalObservations, 5);
});

test("over-rationalized input starts at Level 5 and steps down to sensory Level 1", () => {
  const text =
    "머리로는 장단점 분석은 다 끝났고 이성적으로 어떤 선택이 맞는지 다 아는데 마음이 안 움직여서 결정을 못 내리고 있어요.";
  assert.equal(detectOverRationalization(text), true);

  let session = createLadderSession(text);
  assert.equal(session.direction, "down");
  assert.equal(session.currentLevel, 5);

  const l5Card = buildLadderStepCard(session.currentLevel, session.concern, session.direction);
  session = advanceLadderSession(session, {
    type: "select_option",
    optionId: l5Card.options[0].id,
  });
  assert.equal(session.currentLevel, 3);

  const l3Card = buildLadderStepCard(session.currentLevel, session.concern, session.direction);
  session = advanceLadderSession(session, {
    type: "select_option",
    optionId: l3Card.options[0].id,
  });
  assert.equal(session.currentLevel, 2);

  const l2Card = buildLadderStepCard(session.currentLevel, session.concern, session.direction);
  session = advanceLadderSession(session, {
    type: "select_option",
    optionId: l2Card.options[0].id,
  });
  assert.equal(session.currentLevel, 1);
});

test("flip_angle triggers behind-the-scenes meta-cognition and rejecting recommendation triggers facet shift", () => {
  let session = createLadderSession("선택지가 둘 다 마음에 안 들어요.", {
    direction: "up",
    initialLevel: 3,
  });

  session = advanceLadderSession(session, { type: "flip_angle" });
  assert.equal(session.flipCount, 1);
  assert.equal(session.behindInference.dissatisfied, true);
  assert.ok(session.behindLabel?.includes("불만족") || session.behindLabel?.includes("조정"));

  const card = buildLadderStepCard(
    session.currentLevel,
    session.concern,
    session.direction,
    session.lens,
    session.flipCount,
  );
  const nonRec = card.options.find((o) => !o.recommended);
  session = advanceLadderSession(session, {
    type: "select_option",
    optionId: nonRec.id,
  });
  assert.ok(session.latestFacetShift?.detected);
});
