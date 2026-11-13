import assert from "node:assert/strict";
import { test } from "node:test";
import {
  saveInsight,
  loadInsights,
  deleteInsight,
  exportPullimBundle,
  importPullimBundle,
  exportUnravelToMarkdown,
  exportJournalToMarkdown,
} from "../src/lib/core/journal-portability.ts";
import { unravelConcern } from "../src/lib/core/unravel-engine.ts";

function createMemoryStorage() {
  const map = new Map();
  return {
    map,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => map.set(k, v),
  };
}

test("Hall of Insights save, deduplicate, load, and delete work cleanly", () => {
  const storage = createMemoryStorage();
  assert.deepEqual(loadInsights(storage), []);

  const item = {
    id: "insight_1",
    createdAt: "2026-11-14T00:00:00.000Z",
    concernSummary: "오픈소스 전환 고민",
    insightText: "완벽한 구조보다 누군가 오늘 당장 쓸 수 있는 단순함이 중요하다.",
    reframedQuestion: "핵심 가치 1개는 무엇인가?",
  };
  saveInsight(storage, item);
  saveInsight(storage, item);
  assert.equal(loadInsights(storage).length, 1);

  deleteInsight(storage, "insight_1");
  assert.deepEqual(loadInsights(storage), []);
});

test("JSON export and import round-trip preserves actions, promises, and insights and rejects corrupt JSON", () => {
  const source = createMemoryStorage();
  const payload = JSON.stringify({
    format: "pullim-open-source-bundle-v2",
    exportedAt: "2026-11-14T00:00:00.000Z",
    actions: [
      {
        sessionId: "s1",
        action: "핵심 기능 1개 남기기",
        deadline: "2026-11-15",
        createdAt: "2026-11-14T00:00:00.000Z",
        status: "pending",
      },
    ],
    promises: [
      {
        id: "p1",
        createdAt: 1700000000000,
        sessionTheme: "structural",
        trigger: "에디터를 여는 순간",
        action: "README부터 10분 작성하기",
        status: "active",
      },
    ],
    insights: [
      {
        id: "i1",
        createdAt: "2026-11-14T00:00:00.000Z",
        concernSummary: "오픈소스 개편",
        insightText: "덜어낼수록 본질이 선명해진다.",
        reframedQuestion: "무엇을 버릴 것인가?",
      },
    ],
  });

  const stats = importPullimBundle(source, payload, "replace");
  assert.deepEqual(stats, { actionsCount: 1, promisesCount: 1, insightsCount: 1 });

  const exported = exportPullimBundle(source);
  assert.equal(exported.format, "pullim-open-source-bundle-v2");
  assert.equal(exported.actions.length, 1);
  assert.equal(exported.promises.length, 1);
  assert.equal(exported.insights.length, 1);

  // Corrupt JSON must not overwrite existing storage
  assert.throws(() => importPullimBundle(source, "{bad json", "replace"));
  assert.equal(exportPullimBundle(source).actions.length, 1);

  const md = exportJournalToMarkdown(exported);
  assert.match(md, /핵심 기능 1개 남기기/);
  assert.match(md, /덜어낼수록 본질이 선명해진다/);
});

test("exportUnravelToMarkdown generates structured report and respects crisis halt", () => {
  const normal = unravelConcern("사이드 프로젝트 우선순위를 정하기 어렵다.");
  const normalMd = exportUnravelToMarkdown(normal);
  assert.match(normalMd, /사실\(Facts\) vs 가정\(Assumptions\) 분리/);
  assert.match(normalMd, /If-Then 실행 의도/);

  const crisis = unravelConcern("죽고 싶다");
  const crisisMd = exportUnravelToMarkdown(crisis);
  assert.match(crisisMd, /109/);
  assert.doesNotMatch(crisisMd, /되돌릴 수 있는 작은 실험 선택지/);
});
