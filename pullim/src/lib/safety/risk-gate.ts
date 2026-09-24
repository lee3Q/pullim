/** The risk gate owns permission to advance a decision session. */
export type RiskGateState = "open" | "awaiting_confirmation" | "emergency";
export type SessionAction = "propose_decision" | "advance_stage";

export type RiskEvent =
  | { type: "risk_signal"; level: "none" | "ambiguous" | "imminent" }
  | { type: "risk_confirmation"; answer: "safe" | "unsafe" | "unclear" };

export interface HelpPath {
  label: string;
  phone: string;
}

export interface RiskGateResult {
  state: RiskGateState;
  executedAction: SessionAction | null;
  message: string | null;
  helpPaths: HelpPath[];
}

const EMERGENCY_HELP: HelpPath[] = [
  { label: "긴급 구조", phone: "119" },
  { label: "자살예방상담전화", phone: "109" },
];

const CONFIRMATION_QUESTION =
  "안전을 먼저 확인하고 싶어요. 지금 자신을 다치게 할 생각이나 계획이 있나요?";

/**
 * Apply a user risk event before executing any proposed session action.
 * An emergency is sticky for this session. An ambiguous signal pauses the
 * session until the user explicitly confirms safety or discloses danger.
 */
export function gateRiskAction(
  state: RiskGateState,
  event: RiskEvent,
  proposedAction: SessionAction | null,
): RiskGateResult {
  let nextState = state;

  if (event.type === "risk_signal") {
    if (event.level === "imminent") nextState = "emergency";
    else if (event.level === "ambiguous" && state === "open") {
      nextState = "awaiting_confirmation";
    }
  } else if (state === "awaiting_confirmation") {
    if (event.answer === "unsafe") nextState = "emergency";
    else if (event.answer === "safe") nextState = "open";
  }

  if (nextState === "emergency") {
    return {
      state: nextState,
      executedAction: null,
      message:
        "지금은 결정을 멈추고 안전을 먼저 챙겨야 해요. 즉각적인 위험이 있다면 119에 연락하거나 가까운 응급실로 가세요. 109에서도 상담받을 수 있어요.",
      helpPaths: EMERGENCY_HELP,
    };
  }

  if (nextState === "awaiting_confirmation") {
    return {
      state: nextState,
      executedAction: null,
      message: CONFIRMATION_QUESTION,
      helpPaths: [],
    };
  }

  // A confirmation resolves the hold; it must not replay an action proposed
  // while the session was paused. Evaluate a new action on the next turn.
  if (event.type === "risk_confirmation") {
    return {
      state: "open",
      executedAction: null,
      message: null,
      helpPaths: [],
    };
  }

  return {
    state: "open",
    executedAction: proposedAction,
    message: null,
    helpPaths: [],
  };
}
