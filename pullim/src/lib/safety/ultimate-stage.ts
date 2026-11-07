import type { DecisionStage } from "./proposal-policy";
import type { UltimateRoute } from "./ultimate-guard";

export function destination(route: UltimateRoute, body: Record<string, unknown>, current: DecisionStage): DecisionStage | null {
  if (route === "behind_thought") return current;
  // Ladder chat keeps calling listen after its research and analysis cards. A listen turn never moves the stage
  // forward from those stages, and the decision stages (provisional_decision, next_action) stay closed to it.
  if (route === "listen") return current === "check_in" ? "define_problem" : current === "define_problem" || current === "research" || current === "values" ? current : null;
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
