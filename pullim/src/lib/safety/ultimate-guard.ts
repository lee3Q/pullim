import { detectCrisis } from "./crisis-detector";
import { gateRiskAction, type RiskGateResult } from "./risk-gate";

export type UltimateRoute = "listen" | "research" | "judge" | "analyze" | "debate" | "conclude" | "ladder_research" | "ladder_analyze" | "behind_thought";

function userText(route: UltimateRoute, body: unknown): string {
  if (!body || typeof body !== "object") return "";
  const value = body as Record<string, unknown>;
  if (route === "listen") {
    const messages = value.messages;
    if (!Array.isArray(messages)) return "";
    const last = [...messages].reverse().find((item) => item && item.role === "user");
    return typeof last?.content === "string" ? last.content : "";
  }
  if (route === "ladder_research" || route === "ladder_analyze") {
    return typeof value.topicSummary === "string" ? value.topicSummary : "";
  }
  if (route === "behind_thought") {
    const messages = value.recentMessages;
    return Array.isArray(messages) ? messages.filter((item) => item?.role === "user")
      .map((item) => item.content).filter((item): item is string => typeof item === "string").join("\n") : "";
  }
  return [value.concern, value.listenSummary]
    .filter((part): part is string => typeof part === "string")
    .join("\n");
}

export function inspectUltimateInput(route: UltimateRoute, body: unknown): RiskGateResult | null {
  const result = detectCrisis(userText(route, body));
  if (result.tier === null) return null;
  return gateRiskAction("open", {
    type: "risk_signal",
    level: result.tier === "A" ? "imminent" : "ambiguous",
  }, "advance_stage");
}

export function guardUltimateRequest(route: UltimateRoute, body: unknown): Response | null {
  const result = inspectUltimateInput(route, body);
  if (!result || result.state === "open") return null;
  return holdUltimateRequest(route, result.state, result.message || "안전을 먼저 확인해 주세요.", result.helpPaths);
}

export function holdUltimateRequest(route: UltimateRoute, riskState: "awaiting_confirmation" | "emergency", message: string, helpPaths: { label: string; phone: string }[]): Response {
  const payload = {
    policy: { status: riskState === "emergency" ? "escalated" : "held", riskState,
      executedAction: null, event: "risk_signal" },
    crisis: true,
    text: message,
    message,
    hotlines: helpPaths.map((path) => ({ name: path.label, number: path.phone })),
  };
  if (route === "listen") {
    const encoder = new TextEncoder();
    return new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
    }}), { headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" } });
  }
  return Response.json(payload);
}
