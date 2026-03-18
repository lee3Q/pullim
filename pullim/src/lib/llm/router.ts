import { getClient, ROUTING_MODEL } from "./claude";
import { ROUTING_PROMPT, SYSTEM_BASE } from "./prompts";
import { ModelType, RoutingScores } from "../types";

interface RoutingResult {
  scores: RoutingScores;
  model: ModelType;
  explanation: string;
}

export async function routeConcern(inputText: string): Promise<RoutingResult> {
  const client = getClient();

  const response = await client.messages.create({
    model: ROUTING_MODEL,
    max_tokens: 512,
    system: `${SYSTEM_BASE}\n\n${ROUTING_PROMPT}`,
    messages: [{ role: "user", content: inputText }],
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);
    return {
      scores: parsed.scores,
      model: parsed.model as ModelType,
      explanation: parsed.explanation,
    };
  } catch {
    return {
      scores: {
        reversibility: 0.5,
        info_sufficiency: 0.5,
        emotional_involvement: 0.5,
        time_pressure: 0.5,
      },
      model: "A",
      explanation:
        "고민을 여러 관점에서 꼼꼼히 따져볼게요. 천천히 함께 정리해봐요.",
    };
  }
}
