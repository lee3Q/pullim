import assert from "node:assert/strict";
import { test } from "node:test";
import { ACTION_HISTORY_KEY, loadActions, saveAction, updateAction, deleteAction } from "../src/lib/session/action-history.ts";

const record = { sessionId: "synthetic-session", action: "작은 행동", deadline: "2026-11-04",
  createdAt: "2026-11-03T00:00:00+09:00", status: "pending" };
function memory() {
  const data = new Map([["pullim_promises", "unchanged"]]);
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test("empty only when missing, and saved minimal action survives another read", () => {
  const storage = memory();
  assert.deepEqual(loadActions(storage), []);
  saveAction(storage, { ...record, concern: "must not copy", transcript: "must not copy" });
  assert.deepEqual(loadActions(storage), [record]);
  assert.equal(storage.getItem("pullim_promises"), "unchanged");
  assert.ok(!storage.getItem(ACTION_HISTORY_KEY).includes("must not copy"));
});
test("retry/back/resubmit does not duplicate or overwrite an action", () => {
  const storage = memory();
  saveAction(storage, record);
  saveAction(storage, { ...record, createdAt: "2026-11-04T00:00:00Z" });
  assert.throws(() => saveAction(storage, { ...record, action: "different" }));
  assert.deepEqual(loadActions(storage), [record]);
});
test("empty action, session id and invalid dates are refused without writes", () => {
  for (const patch of [{ action: " " }, { sessionId: "" }, { deadline: "2026-02-30" },
    { deadline: "" }, { createdAt: "bad" }, { status: "failed" }]) {
    const storage = memory();
    assert.throws(() => saveAction(storage, { ...record, ...patch }));
    assert.equal(storage.getItem(ACTION_HISTORY_KEY), null);
  }
});
test("no deadline is explicit and overdue pending is not automatically failed", () => {
  const storage = memory();
  saveAction(storage, { ...record, deadline: null });
  saveAction(storage, { ...record, sessionId: "overdue", deadline: "2020-01-01" });
  assert.equal(loadActions(storage)[0].deadline, null);
  assert.equal(loadActions(storage)[1].status, "pending");
});
test("quota/permission read and write failures propagate, retry remains safe", () => {
  const storage = memory();
  const failWrite = { ...storage, setItem() { throw new Error("quota"); } };
  assert.throws(() => saveAction(failWrite, record), /quota/);
  assert.deepEqual(loadActions(storage), []);
  const failRead = { ...storage, getItem() { throw new Error("permission"); } };
  assert.throws(() => saveAction(failRead, record), /permission/);
  saveAction(storage, record);
  saveAction(storage, record);
  assert.equal(loadActions(storage).length, 1);
});
test("corrupt/partial existing JSON is not silently replaced", () => {
  for (const raw of ["{", "null", "{}", "[{}]", JSON.stringify([record, record])]) {
    const storage = memory();
    storage.setItem(ACTION_HISTORY_KEY, raw);
    assert.throws(() => loadActions(storage));
    assert.throws(() => saveAction(storage, record));
    assert.equal(storage.getItem(ACTION_HISTORY_KEY), raw);
  }
});
test("manual update/delete preserve other records and Ladder keys, with failure propagation", () => {
  const storage = memory();
  saveAction(storage, record);
  saveAction(storage, { ...record, sessionId: "second" });
  updateAction(storage, record.sessionId, "deferred");
  assert.equal(loadActions(storage)[0].status, "deferred");
  assert.throws(() => updateAction(storage, "missing", "completed"));
  assert.throws(() => deleteAction({ ...storage, setItem() { throw new Error("quota"); } }, record.sessionId));
  assert.equal(loadActions(storage).length, 2);
  deleteAction(storage, record.sessionId);
  assert.deepEqual(loadActions(storage), [{ ...record, sessionId: "second" }]);
  assert.equal(storage.getItem("pullim_promises"), "unchanged");
});
