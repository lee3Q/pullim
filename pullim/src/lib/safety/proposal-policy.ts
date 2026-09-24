const STAGES = [
  "check_in",
  "define_problem",
  "research",
  "values",
  "provisional_decision",
  "next_action",
] as const;

export type DecisionStage = (typeof STAGES)[number];
export type RiskLevel = "none" | "ambiguous" | "imminent";
type RiskGateState = "open" | "awaiting_confirmation" | "emergency";

export interface PolicySession {
  stage: DecisionStage;
  riskState: RiskGateState;
}

type Proposal =
  | { risk: RiskLevel; action: "advance_stage"; targetStage: DecisionStage }
  | { risk: RiskLevel; action: "propose_decision"; decision: string };

export type PolicyResult =
  | { status: "executed"; session: PolicySession; action: Proposal }
  | {
      status: "blocked" | "held" | "escalated";
      session: PolicySession;
      action: null;
      reason: "invalid_proposal" | "risk_mismatch" | "forbidden_transition" | "risk_gate";
    };

function parseProposal(raw: unknown): Proposal | null {
  let value: unknown = raw;
  if (typeof raw === "string") {
    try {
      value = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (value === null || typeof value !== "object" || Array.isArray(value)) return null;

  const candidate = value as Record<string, unknown>;
  if (!["none", "ambiguous", "imminent"].includes(candidate.risk as string)) return null;

  if (candidate.action === "advance_stage") {
    if (
      Object.keys(candidate).sort().join(",") !== "action,risk,targetStage" ||
      !STAGES.includes(candidate.targetStage as DecisionStage)
    ) return null;
    return candidate as Proposal;
  }
  if (candidate.action === "propose_decision") {
    if (
      Object.keys(candidate).sort().join(",") !== "action,decision,risk" ||
      typeof candidate.decision !== "string" ||
      candidate.decision.trim().length === 0
    ) return null;
    return candidate as Proposal;
  }
  return null;
}

/** Model output is a proposal; only this policy returns an executable action. */
export function executeProposal(
  session: PolicySession,
  observedRisk: RiskLevel,
  rawProposal: unknown,
): PolicyResult {
  const riskState: RiskGateState =
    session.riskState === "emergency" || observedRisk === "imminent"
      ? "emergency"
      : session.riskState === "awaiting_confirmation" || observedRisk === "ambiguous"
        ? "awaiting_confirmation"
        : "open";
  const safeSession = { ...session, riskState };
  if (riskState !== "open") {
    return {
      status: riskState === "emergency" ? "escalated" : "held",
      session: safeSession,
      action: null,
      reason: "risk_gate",
    };
  }

  const proposal = parseProposal(rawProposal);
  if (!proposal) {
    return { status: "blocked", session: safeSession, action: null, reason: "invalid_proposal" };
  }
  if (proposal.risk !== observedRisk) {
    return { status: "blocked", session: safeSession, action: null, reason: "risk_mismatch" };
  }

  if (proposal.action === "advance_stage") {
    const nextStage = STAGES[STAGES.indexOf(session.stage) + 1];
    if (proposal.targetStage !== nextStage) {
      return { status: "blocked", session: safeSession, action: null, reason: "forbidden_transition" };
    }
    return {
      status: "executed",
      session: { ...safeSession, stage: nextStage },
      action: proposal,
    };
  }

  if (session.stage !== "provisional_decision") {
    return { status: "blocked", session: safeSession, action: null, reason: "forbidden_transition" };
  }
  return { status: "executed", session: safeSession, action: proposal };
}
