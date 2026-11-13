import {
  ACTION_HISTORY_KEY,
  loadActions,
  saveAction,
  type ActionRecord,
  type ActionStorage,
} from "../session/action-history.ts";
import type { PullimPromise } from "../session/ladder-types.ts";
import type { UnravelResult } from "./unravel-engine.ts";

export const HALL_OF_INSIGHTS_KEY = "pullim_hall_of_insights_v1";
export const PROMISES_KEY = "pullim_promises";

export interface InsightRecord {
  id: string;
  createdAt: string;
  concernSummary: string;
  insightText: string;
  reframedQuestion: string;
}

export interface PullimExportBundle {
  format: "pullim-open-source-bundle-v2";
  exportedAt: string;
  actions: ActionRecord[];
  promises: PullimPromise[];
  insights: InsightRecord[];
}

function isValidInsight(value: unknown): value is InsightRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<InsightRecord>;
  return (
    typeof r.id === "string" &&
    r.id.trim().length > 0 &&
    typeof r.createdAt === "string" &&
    Number.isFinite(Date.parse(r.createdAt)) &&
    typeof r.concernSummary === "string" &&
    typeof r.insightText === "string" &&
    r.insightText.trim().length > 0 &&
    typeof r.reframedQuestion === "string"
  );
}

function isValidPromise(value: unknown): value is PullimPromise {
  if (!value || typeof value !== "object") return false;
  const p = value as Partial<PullimPromise>;
  return (
    typeof p.id === "string" &&
    p.id.trim().length > 0 &&
    typeof p.createdAt === "number" &&
    Number.isFinite(p.createdAt) &&
    typeof p.sessionTheme === "string" &&
    typeof p.trigger === "string" &&
    p.trigger.trim().length > 0 &&
    typeof p.action === "string" &&
    p.action.trim().length > 0 &&
    ["active", "completed", "failed", "skipped"].includes(p.status ?? "") &&
    (p.checkedAt === undefined ||
      (typeof p.checkedAt === "number" && Number.isFinite(p.checkedAt))) &&
    (p.reflection === undefined || typeof p.reflection === "string")
  );
}

export function loadInsights(storage: ActionStorage): InsightRecord[] {
  const raw = storage.getItem(HALL_OF_INSIGHTS_KEY);
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || !parsed.every(isValidInsight)) {
    throw new Error("명예의 전당(통찰) 기록 형식이 올바르지 않습니다.");
  }
  return parsed;
}

export function saveInsight(
  storage: ActionStorage,
  record: InsightRecord,
): InsightRecord {
  if (!isValidInsight(record)) {
    throw new Error("유효하지 않은 통찰 기록입니다.");
  }
  const existing = loadInsights(storage);
  const dup = existing.find((item) => item.id === record.id);
  if (dup) return dup;
  const next = [record, ...existing];
  storage.setItem(HALL_OF_INSIGHTS_KEY, JSON.stringify(next));
  return record;
}

export function deleteInsight(storage: ActionStorage, id: string): void {
  const existing = loadInsights(storage);
  storage.setItem(
    HALL_OF_INSIGHTS_KEY,
    JSON.stringify(existing.filter((item) => item.id !== id)),
  );
}

export function loadPromisesFromStorage(storage: ActionStorage): PullimPromise[] {
  const raw = storage.getItem(PROMISES_KEY);
  if (raw === null) return [];
  const parsed: unknown = JSON.parse(raw);
  if (
    !Array.isArray(parsed) ||
    !parsed.every(isValidPromise) ||
    new Set(parsed.map((p) => p.id)).size !== parsed.length
  ) {
    throw new Error("기존 약속 기록을 읽지 못했습니다.");
  }
  return parsed;
}

export function exportPullimBundle(storage: ActionStorage): PullimExportBundle {
  const actions = loadActions(storage);
  const promises = loadPromisesFromStorage(storage);
  const insights = loadInsights(storage);

  return {
    format: "pullim-open-source-bundle-v2",
    exportedAt: new Date().toISOString(),
    actions,
    promises,
    insights,
  };
}

export function importPullimBundle(
  storage: ActionStorage,
  rawJson: string,
  mode: "merge" | "replace" = "merge",
): { actionsCount: number; promisesCount: number; insightsCount: number } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawJson);
  } catch {
    throw new Error("JSON 파싱에 실패했습니다. 기존 데이터는 변경하지 않았습니다.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("올바른 풀림 백업 파일 형식이 아닙니다.");
  }

  const candidate = parsed as Record<string, unknown>;
  if (
    candidate.format !== "pullim-open-source-bundle-v2" &&
    candidate.format !== "pullim-local-history-v1"
  ) {
    throw new Error("지원하지 않는 백업 버전입니다.");
  }

  const incomingActions = Array.isArray(candidate.actions) ? candidate.actions : [];
  const incomingPromises = Array.isArray(candidate.promises) ? candidate.promises : [];
  const incomingInsights = Array.isArray(candidate.insights) ? candidate.insights : [];

  // Validate all incoming items in a temporary memory store before touching target storage
  const tempMap = new Map<string, string>();
  const tempStorage: ActionStorage = {
    getItem: (k) => tempMap.get(k) ?? null,
    setItem: (k, v) => tempMap.set(k, v),
  };

  if (mode === "merge") {
    const currentActionsRaw = storage.getItem(ACTION_HISTORY_KEY);
    const currentPromisesRaw = storage.getItem(PROMISES_KEY);
    const currentInsightsRaw = storage.getItem(HALL_OF_INSIGHTS_KEY);
    if (currentActionsRaw !== null) tempMap.set(ACTION_HISTORY_KEY, currentActionsRaw);
    if (currentPromisesRaw !== null) tempMap.set(PROMISES_KEY, currentPromisesRaw);
    if (currentInsightsRaw !== null) tempMap.set(HALL_OF_INSIGHTS_KEY, currentInsightsRaw);
  }

  // Validate & merge actions
  for (let i = 0; i < incomingActions.length; i++) {
    const a = incomingActions[i] as Partial<ActionRecord>;
    const normalized: ActionRecord = {
      sessionId:
        typeof a.sessionId === "string" && a.sessionId.trim()
          ? a.sessionId
          : `imported_action_${i}_${a.createdAt ?? ""}`,
      action: String(a.action ?? ""),
      deadline: a.deadline === undefined ? null : (a.deadline as string | null),
      createdAt: String(a.createdAt ?? ""),
      status: (a.status as ActionRecord["status"]) ?? "pending",
    };
    saveAction(tempStorage, normalized);
  }

  // Validate & merge promises
  const basePromises = loadPromisesFromStorage(tempStorage);
  const promiseMap = new Map<string, PullimPromise>(
    basePromises.map((p) => [p.id, p]),
  );
  for (let i = 0; i < incomingPromises.length; i++) {
    const p = incomingPromises[i] as Partial<PullimPromise>;
    const normalized: PullimPromise = {
      id:
        typeof p.id === "string" && p.id.trim()
          ? p.id
          : `imported_promise_${i}_${p.createdAt ?? Date.now()}`,
      createdAt:
        typeof p.createdAt === "number"
          ? p.createdAt
          : Date.parse(String(p.createdAt ?? "")),
      sessionTheme: String(p.sessionTheme ?? "structural"),
      trigger: String(p.trigger ?? ""),
      action: String(p.action ?? ""),
      status: (p.status as PullimPromise["status"]) ?? "active",
      ...(p.checkedAt !== undefined ? { checkedAt: Number(p.checkedAt) } : {}),
      ...(p.reflection !== undefined ? { reflection: String(p.reflection) } : {}),
    };
    if (!isValidPromise(normalized)) {
      throw new Error("백업 파일의 약속(Promise) 항목 형식이 올바르지 않습니다.");
    }
    if (!promiseMap.has(normalized.id)) {
      promiseMap.set(normalized.id, normalized);
    }
  }
  const mergedPromises = Array.from(promiseMap.values());
  tempStorage.setItem(PROMISES_KEY, JSON.stringify(mergedPromises));

  // Validate & merge insights
  for (const rawInsight of incomingInsights) {
    if (!isValidInsight(rawInsight)) {
      throw new Error("백업 파일의 통찰(Insight) 항목 형식이 올바르지 않습니다.");
    }
    saveInsight(tempStorage, rawInsight);
  }

  const finalActions = loadActions(tempStorage);
  const finalPromises = loadPromisesFromStorage(tempStorage);
  const finalInsights = loadInsights(tempStorage);

  // Commit atomically to real storage
  storage.setItem(ACTION_HISTORY_KEY, JSON.stringify(finalActions));
  storage.setItem(PROMISES_KEY, JSON.stringify(finalPromises));
  storage.setItem(HALL_OF_INSIGHTS_KEY, JSON.stringify(finalInsights));

  return {
    actionsCount: finalActions.length,
    promisesCount: finalPromises.length,
    insightsCount: finalInsights.length,
  };
}

export function exportUnravelToMarkdown(result: UnravelResult): string {
  if (result.haltedByCrisis && result.crisisResponse) {
    const hotlines = result.crisisResponse.hotlines
      .map((h) => `- **${h.name} (${h.number})**: ${h.description}`)
      .join("\n");
    return [
      "# [긴급 안전 안내] 풀림(Pullim) 위기 보호 알림",
      "",
      `> ${result.crisisResponse.userMessage}`,
      "",
      "## 지금 바로 연결 가능한 전문 기관",
      hotlines,
      "",
    ].join("\n");
  }

  const factsMd = result.facts.map((f) => `- [Fact] ${f}`).join("\n");
  const assumptionsMd = result.assumptions
    .map(
      (a) =>
        `- **[Assumption]** ${a.statement}\n  - *이유*: ${a.whyAssumption}\n  - *점검 질문*: ${a.checkQuestion}`,
    )
    .join("\n");
  const trapsMd = result.cognitiveTraps
    .map(
      (t) =>
        `- **${t.name}**: ${t.evidence}\n  - *전환 질문*: ${t.reframeQuestion}`,
    )
    .join("\n");
  const lensesMd = result.lenses
    .map(
      (l) =>
        `### ${l.badge} — ${l.title}\n- ${l.summary}\n- **질문**: ${l.socraticQuestion}\n- *사각지대 노트*: ${l.blindSpotNote}`,
    )
    .join("\n\n");
  const optionsMd = result.options
    .map(
      (o) =>
        `- ${o.recommended ? "**[✦ 추천]** " : ""}${o.title} (${o.costMinutes}분, 가역성: ${o.reversibility})\n  - ${o.description}`,
    )
    .join("\n");

  return [
    `# 풀림(Pullim) 사고 구조화 리포트`,
    `- 생성 시각: ${result.createdAt}`,
    `- 도메인: ${result.topicDomain}`,
    `- 권장 사다리 방향: ${result.recommendedLadderDirection === "down" ? "내려가기 (Level 5 → 1 감각 점검)" : "올라가기 (Level 1 → 5 단계별 구체화)"}`,
    "",
    "## 1. 원문 고민",
    `> ${result.rawConcern}`,
    "",
    "## 2. 핵심 갈등 & 재정의된 질문",
    `- **핵심 긴장**: ${result.coreTension}`,
    `- **핵심 질문**: **${result.reframedQuestion}**`,
    "",
    "## 3. 사실(Facts) vs 가정(Assumptions) 분리",
    "### 확인된 사실",
    factsMd,
    "",
    "### 검증 전 가설·추측",
    assumptionsMd,
    "",
    "## 4. 포착된 인지적 함정 (Blind Spots)",
    trapsMd,
    "",
    "## 5. 세 가지 시선 (3 Perspective Lenses)",
    lensesMd,
    "",
    "## 6. 되돌릴 수 있는 작은 실험 선택지",
    optionsMd,
    "",
    "## 7. If-Then 실행 의도 (Implementation Intention)",
    `- **만약 (Trigger)**: ${result.ifThenPlan.trigger}`,
    `- **행동 (Action)**: ${result.ifThenPlan.action}`,
    `- **최소 대안 (Fallback)**: ${result.ifThenPlan.fallback}`,
    "",
  ].join("\n");
}

export function exportJournalToMarkdown(bundle: PullimExportBundle): string {
  const actionsSection =
    bundle.actions.length === 0
      ? "_저장된 확정 행동이 없습니다._"
      : bundle.actions
          .map(
            (a) =>
              `- [${a.status === "completed" ? "x" : " "}] **${a.action}** (기한: ${a.deadline ?? "없음"}, 상태: ${a.status})`,
          )
          .join("\n");

  const promisesSection =
    bundle.promises.length === 0
      ? "_저장된 If-Then 약속이 없습니다._"
      : bundle.promises
          .map(
            (p) =>
              `- [${p.status === "completed" ? "x" : " "}] **만약** ${p.trigger} → **${p.action}** (상태: ${p.status})${p.reflection ? `\n  - *회고*: ${p.reflection}` : ""}`,
          )
          .join("\n");

  const insightsSection =
    bundle.insights.length === 0
      ? "_저장된 핵심 통찰이 없습니다._"
      : bundle.insights
          .map(
            (i) =>
              `- **✦ "${i.insightText}"** (${i.createdAt.slice(0, 10)})\n  - *맥락*: ${i.concernSummary}\n  - *재정의 질문*: ${i.reframedQuestion}`,
          )
          .join("\n");

  return [
    "# 풀림(Pullim) 로컬 의사결정 저널",
    `- 내보낸 시각: ${bundle.exportedAt}`,
    "",
    "## 1. 확정 행동 (Confirmed Actions)",
    actionsSection,
    "",
    "## 2. If-Then 작은 약속 (Implementation Intentions)",
    promisesSection,
    "",
    "## 3. 명예의 전당 — 내 언어의 핵심 통찰 (Hall of Insights)",
    insightsSection,
    "",
  ].join("\n");
}
