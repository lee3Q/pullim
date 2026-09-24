import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { detectCrisis } from "./crisis-detector";
import { gateRiskAction } from "./risk-gate";
import { executeProposal, type DecisionStage } from "./proposal-policy";
import { holdUltimateRequest, type UltimateRoute } from "./ultimate-guard";
import { commitPolicyState, loadPolicyState, markPolicyEmergency, StalePolicyState, type PolicyState } from "./policy-state-store";

type Event = { type: "user_input" | "risk_signal" | "risk_confirmation" | "stage_transition" | "consent" | "model_proposal" | "policy_decision"; value: string };
type State = PolicyState;
const COOKIE = "pullim_policy";
const secret = process.env.PULLIM_POLICY_SECRET || (process.env.NODE_ENV === "production" ? "" : "pullim-local-development-only");
const configured = process.env.NODE_ENV !== "production" || (secret.length >= 32 && !!process.env.PULLIM_POLICY_REDIS_URL && !!process.env.PULLIM_POLICY_REDIS_TOKEN);
const missingConfiguration = () => Response.json({ policy: { status: "blocked", reason: "policy_configuration_unavailable" } }, { status: 503 });

const initial = (sessionId: string): State => ({ sessionId, version: 0, stage: "check_in", riskState: "open", consent: "unknown", choiceHashes: [], events: [] });
const sign = (payload: string) => createHmac("sha256", secret).update(payload).digest("base64url");
const choiceHash = (value: string) => createHmac("sha256", secret).update(value).digest("hex");
function encode(state: State): string {
  const payload = Buffer.from(JSON.stringify({ sessionId: state.sessionId })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
function decode(token: string | undefined): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const value = JSON.parse(Buffer.from(payload, "base64url").toString()) as { sessionId?: unknown };
    return typeof value?.sessionId === "string" && value.sessionId.length > 0 && value.sessionId.length <= 128 ? value.sessionId : null;
  } catch { return null; }
}
async function resolveState(req: NextRequest, requestedId?: string): Promise<State> {
  const cookieId = decode(req.cookies.get(COOKIE)?.value);
  if (requestedId && requestedId !== cookieId) {
    if (await loadPolicyState(requestedId)) throw new StalePolicyState("existing session requires its current cookie");
    return initial(requestedId);
  }
  const sessionId = requestedId || cookieId || randomUUID();
  const stored = await loadPolicyState(sessionId);
  if (!stored && cookieId === sessionId) throw new StalePolicyState("session expired");
  return stored || initial(sessionId);
}
function stateFailure(error: unknown): Response {
  if (error instanceof StalePolicyState) return Response.json({ policy: { status: "blocked", reason: "stale_policy_state" } }, { status: 409 });
  return Response.json({ policy: { status: "blocked", reason: "policy_store_unavailable" } }, { status: 503 });
}
async function save(response: Response, state: State): Promise<Response> {
  try {
    if (state.riskState === "emergency") await markPolicyEmergency(state.sessionId);
    await commitPolicyState(state);
  } catch (error) {
    if (error instanceof StalePolicyState && state.riskState === "emergency") {
      try {
        for (let attempt = 0; attempt < 3; attempt++) {
          const latest = await loadPolicyState(state.sessionId);
          if (!latest) break;
          latest.riskState = "emergency";
          append(latest, { type: "risk_signal", value: "A" });
          try { await commitPolicyState(latest); return stateFailure(error); }
          catch (retryError) { if (!(retryError instanceof StalePolicyState)) return stateFailure(retryError); }
        }
      } catch (retryError) { return stateFailure(retryError); }
    }
    return stateFailure(error);
  }
  response.headers.set("Set-Cookie", `${COOKIE}=${encode(state)}; Path=/api; HttpOnly; SameSite=Lax; Max-Age=86400${process.env.NODE_ENV === "production" ? "; Secure" : ""}`);
  response.headers.set("X-Pullim-Policy-Stage", state.stage);
  response.headers.set("X-Pullim-Policy-Risk", state.riskState);
  return response;
}
function append(state: State, event: Event): void {
  state.events = [...state.events, event].slice(-12);
}
function inputText(route: UltimateRoute, body: Record<string, unknown>): string {
  if (route === "listen" && Array.isArray(body.messages)) {
    const message = [...body.messages].reverse().find((item) => item && item.role === "user");
    return typeof message?.content === "string" ? message.content : "";
  }
  if (route === "ladder_research" || route === "ladder_analyze") {
    return typeof body.topicSummary === "string" ? body.topicSummary : "";
  }
  if (route === "behind_thought" && Array.isArray(body.recentMessages)) {
    return body.recentMessages.filter((item) => item?.role === "user")
      .map((item) => item.content).filter((item): item is string => typeof item === "string").join("\n");
  }
  return [body.concern, body.listenSummary].filter((item): item is string => typeof item === "string").join("\n");
}
function destination(route: UltimateRoute, body: Record<string, unknown>, current: DecisionStage): DecisionStage | null {
  if (route === "behind_thought") return current;
  if (route === "listen") return current === "check_in" ? "define_problem" : current === "define_problem" ? current : null;
  if (route === "research" || route === "ladder_research") return current === "define_problem" || current === "research" ? "research" : null;
  if (route === "judge") {
    return body.mode === "logic"
      ? current === "values" || current === "provisional_decision" || current === "next_action" ? current : null
      : current === "research" ? current : null;
  }
  if (route === "analyze" || route === "ladder_analyze") return current === "research" || current === "values" ? "values" : null;
  if (route === "debate") return current === "values" ? current : null;
  return current === "values" || current === "provisional_decision" ? "provisional_decision" : null;
}
function blocked(state: State, reason: string, message: string): Response {
  return Response.json({ policy: { status: "blocked", reason, stage: state.stage, riskState: state.riskState,
    events: state.events }, message }, { status: 409 });
}

/** The API, including demo mode, must pass this gate before model work. */
export function withUltimatePolicy(route: UltimateRoute, handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    if (!configured) return missingConfiguration();
    let body: Record<string, unknown>;
    try {
      const parsed = await req.clone().json();
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid body");
      body = parsed as Record<string, unknown>;
    } catch { return Response.json({ policy: { status: "blocked", reason: "invalid_request" } }, { status: 400 }); }

    let state: State;
    try {
      const requestedId = route === "listen" && typeof body.sessionId === "string" && body.sessionId.trim()
        ? body.sessionId.trim() : undefined;
      if (requestedId && requestedId.length > 128) return Response.json({ policy: { status: "blocked", reason: "invalid_session_id" } }, { status: 400 });
      state = await resolveState(req, requestedId);
    } catch (error) { return stateFailure(error); }
    const utterance = inputText(route, body);
    append(state, { type: "user_input", value: createHmac("sha256", secret).update(utterance).digest("hex") });
    const crisis = detectCrisis(utterance);
    append(state, { type: "risk_signal", value: crisis.tier || "none" });
    const observed = crisis.tier === "A" ? "imminent" : crisis.tier === "B" ? "ambiguous" : "none";
    const gated = gateRiskAction(state.riskState, { type: "risk_signal", level: observed }, "advance_stage");
    state.riskState = gated.state;
    if (body.safetyConfirmation === "safe" || body.safetyConfirmation === "unsafe" || body.safetyConfirmation === "unclear") {
      append(state, { type: "risk_confirmation", value: body.safetyConfirmation });
      const confirmed = gateRiskAction(state.riskState, { type: "risk_confirmation", answer: body.safetyConfirmation }, null);
      state.riskState = confirmed.state;
      return save(Response.json({ policy: { status: confirmed.state === "open" ? "held" : "escalated",
        riskState: confirmed.state, events: state.events }, message: confirmed.message || "안전 확인을 기록했습니다. 다음 입력에서 계속해 주세요." }), state);
    }
    if (state.riskState !== "open") {
      return save(holdUltimateRequest(route, state.riskState, gated.message || "안전을 먼저 확인해 주세요.", gated.helpPaths), state);
    }
    const target = destination(route, body, state.stage);
    if (!target) return save(blocked(state, "forbidden_transition", "현재 단계에서 이 요청을 진행할 수 없습니다."), state);
    if (body.decisionConsent === false) {
      state.consent = "declined";
      append(state, { type: "consent", value: "declined" });
    } else if (body.decisionConsent === true) {
      state.consent = "granted";
      append(state, { type: "consent", value: "granted" });
    }
    const response = await handler(req);
    if (route === "conclude" && response.ok) {
      try {
        const body = await response.clone().json();
        const options = body?.conclusion?.options;
        if (!Array.isArray(options) || options.length < 2 || options.length > 3
          || options.some((item) => typeof item?.direction !== "string" || !item.direction.trim())) {
          return save(blocked(state, "invalid_model_proposal", "결론의 선택지를 확인하지 못했습니다."), state);
        }
        state.choiceHashes = options.map((item) => choiceHash(item.direction));
      } catch { return save(blocked(state, "invalid_model_proposal", "결론을 읽지 못했습니다."), state); }
    }
    if (response.ok && target !== state.stage) {
      append(state, { type: "stage_transition", value: `${state.stage}->${target}` });
      state.stage = target;
    }
    return save(response, state);
  };
}

export async function confirmUltimateSafety(req: NextRequest): Promise<Response> {
  if (!configured) return missingConfiguration();
  let answer: "safe" | "unsafe" | "unclear";
  try {
    const body = await req.json();
    if (!["safe", "unsafe", "unclear"].includes(body?.answer)) throw new Error("invalid answer");
    answer = body.answer;
  } catch { return Response.json({ policy: { status: "blocked", reason: "invalid_confirmation" } }, { status: 400 }); }
  let state: State;
  try { state = await resolveState(req); }
  catch (error) { return stateFailure(error); }
  append(state, { type: "risk_confirmation", value: answer });
  const result = gateRiskAction(state.riskState, { type: "risk_confirmation", answer }, null);
  state.riskState = result.state;
  return save(Response.json({ policy: { status: result.state === "open" ? "safe_state" : "escalated",
    riskState: result.state, stage: state.stage, events: state.events }, message: result.message }), state);
}

export async function executeUltimateAction(req: NextRequest): Promise<Response> {
  if (!configured) return missingConfiguration();
  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid body");
    body = parsed as Record<string, unknown>;
  } catch { return Response.json({ policy: { status: "blocked", reason: "invalid_request" } }, { status: 400 }); }
  let state: State;
  try { state = await resolveState(req); }
  catch (error) { return stateFailure(error); }
  state.consent = body.decisionConsent === true ? "granted" : "declined";
  append(state, { type: "consent", value: state.consent });
  if (state.consent !== "granted") return save(blocked(state, "consent_required", "내가 동의하기 전에는 다음 행동을 정하지 않습니다."), state);
  const proposal = body.proposal;
  const commitment = body.commitment as Record<string, unknown> | undefined;
  if (!commitment || typeof commitment.action !== "string" || typeof commitment.deadline !== "string"
    || !/^\d{4}-\d{2}-\d{2}$/.test(commitment.deadline)) {
    return save(blocked(state, "invalid_commitment", "다음 행동과 기한을 확인해 주세요."), state);
  }
  if (!state.choiceHashes.includes(choiceHash(commitment.action))) {
    return save(blocked(state, "unoffered_action", "제시된 선택지 가운데 하나를 골라 주세요."), state);
  }
  append(state, { type: "model_proposal", value: createHmac("sha256", secret).update(JSON.stringify(proposal ?? null)).digest("hex") });
  const result = executeProposal({ stage: state.stage, riskState: state.riskState }, "none", proposal);
  append(state, { type: "policy_decision", value: result.status });
  if (result.status !== "executed" || result.action.action !== "propose_decision" || result.action.decision !== commitment.action) {
    state.riskState = result.session.riskState;
    return save(blocked(state, result.status === "blocked" ? result.reason : "risk_gate", "제안이 정책 검사를 통과하지 못했습니다."), state);
  }
  const advance = executeProposal(result.session, "none", { risk: "none", action: "advance_stage", targetStage: "next_action" });
  if (advance.status !== "executed") return save(blocked(state, "forbidden_transition", "다음 행동 단계로 이동할 수 없습니다."), state);
  append(state, { type: "stage_transition", value: `${state.stage}->next_action` });
  state.stage = "next_action";
  return save(Response.json({ policy: { status: "executed", stage: state.stage, events: state.events },
    nextAction: result.action.decision }), state);
}
