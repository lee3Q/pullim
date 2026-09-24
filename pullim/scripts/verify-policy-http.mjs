import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";

const base = process.env.PULLIM_TEST_BASE_URL || "http://127.0.0.1:3147";
const outIndex = process.argv.indexOf("--out");
const out = outIndex >= 0 ? process.argv[outIndex + 1] : null;
const cases = [];

function session() {
  let cookie = "";
  return async (route, body) => {
    const response = await fetch(route.startsWith("/api/") ? `${base}${route}` : `${base}/api/ultimate/${route}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(cookie ? { Cookie: cookie } : {}) },
      body: JSON.stringify(body),
    });
    const nextCookie = response.headers.get("set-cookie");
    if (nextCookie) cookie = nextCookie.split(";")[0];
    const text = await response.text();
    const data = response.headers.get("content-type")?.includes("text/event-stream") ? text : JSON.parse(text);
    return { status: response.status, stage: response.headers.get("x-pullim-policy-stage"),
      risk: response.headers.get("x-pullim-policy-risk"), data };
  };
}
function check(name, observed, expectation) {
  assert.deepEqual(observed, expectation, name);
  cases.push({ name, observed, passed: true });
}

const normal = session();
const concern = "어떤 일을 선택할지 고민해요";
const listen = { messages: [{ role: "user", content: concern }], turnCount: 0, userName: null };
let result = await normal("research", { concern, listenSummary: "선택 고민" });
check("forbidden research jump", [result.status, result.stage], [409, "check_in"]);
result = await normal("listen", listen);
check("listen opens problem definition", [result.status, result.stage, result.data.includes("demoMode")], [200, "define_problem", true]);
result = await normal("research", { concern, listenSummary: "선택 고민" });
check("research advances", [result.status, result.stage], [200, "research"]);
result = await normal("conclude", { concern, listenSummary: "선택 고민", analyses: [{}] });
check("forbidden conclusion jump", [result.status, result.stage], [409, "research"]);
result = await normal("analyze", { sessionId: "synthetic-http", selectedCrystals: ["금화"], listenSummary: "선택 고민", concern });
check("analysis advances to values", [result.status, result.stage], [200, "values"]);
const conclusionBody = { concern, listenSummary: "선택 고민", analyses: [{ crystal: "금화", model: "demo", observation: "관찰", insight: "통찰", risk: "위험" }], disagreements: [], debateRounds: [], debateSynthesis: "", userName: null };
result = await normal("conclude", conclusionBody);
check("conclusion stays provisional", [result.status, result.stage], [200, "provisional_decision"]);
const commitment = { action: result.data.conclusion.options[0].direction, deadline: "2026-10-01", nextSessionDate: "2026-10-01" };
const proposal = { risk: "none", action: "propose_decision", decision: commitment.action };
result = await normal("action", { decisionConsent: false, proposal, commitment });
check("declined consent blocks action", [result.status, result.data.policy.reason], [409, "consent_required"]);
result = await normal("action", { decisionConsent: true, proposal: "{broken", commitment });
check("malformed proposal blocks action", [result.status, result.data.policy.reason], [409, "invalid_proposal"]);
result = await normal("action", { decisionConsent: true, proposal: { ...proposal, decision: "제시되지 않은 행동" }, commitment: { ...commitment, action: "제시되지 않은 행동" } });
check("unoffered action is blocked", [result.status, result.data.policy.reason], [409, "unoffered_action"]);
result = await normal("action", { decisionConsent: true, proposal, commitment });
check("consented valid action executes", [result.status, result.stage, result.data.nextAction], [200, "next_action", commitment.action]);

const ambiguous = session();
result = await ambiguous("listen", { ...listen, messages: [{ role: "user", content: "도망가고 싶어" }] });
check("ambiguous input holds before demo", [result.status, result.risk, result.data.includes("demoMode")], [200, "awaiting_confirmation", false]);
result = await ambiguous("listen", listen);
check("risk hold persists", [result.status, result.risk], [200, "awaiting_confirmation"]);
result = await ambiguous("confirm-safety", { answer: "safe" });
check("explicit confirmation clears hold", [result.status, result.risk], [200, "open"]);
result = await ambiguous("listen", listen);
check("new turn resumes", [result.status, result.stage], [200, "define_problem"]);

const emergency = session();
result = await emergency("listen", { ...listen, messages: [{ role: "user", content: "죽고 싶어" }] });
check("imminent risk escalates", [result.status, result.risk], [200, "emergency"]);
result = await emergency("confirm-safety", { answer: "safe" });
check("emergency remains sticky", [result.status, result.risk], [200, "emergency"]);
result = await emergency("listen", { ...listen, sessionId: "new-synthetic-session" });
check("explicit new session gets new state", [result.status, result.risk, result.stage], [200, "open", "define_problem"]);

const ladder = session();
result = await ladder("/api/ladder/research", { topicSummary: concern });
check("ladder research cannot skip listening", [result.status, result.stage], [409, "check_in"]);
result = await ladder("listen", { ...listen, sessionId: "synthetic-ladder" });
check("ladder listening records stage", [result.status, result.stage], [200, "define_problem"]);
result = await ladder("/api/ladder/research", { topicSummary: concern });
check("ladder research passes common policy", [result.status, result.stage], [200, "research"]);
result = await ladder("/api/ladder/analyze", { topicSummary: concern, messages: [] });
check("ladder analysis passes common policy", [result.status, result.stage], [200, "values"]);
const ladderRisk = session();
result = await ladderRisk("/api/ladder/research", { topicSummary: "죽고 싶어" });
check("ladder demo checks imminent risk first", [result.status, result.risk, result.data.crisis], [200, "emergency", true]);

const receipt = { status: "PASS", base, checks: cases };
if (out) await writeFile(out, JSON.stringify(receipt, null, 2) + "\n");
console.log(`PASS: ${cases.length} HTTP policy checks`);
