import { NextRequest } from "next/server";
import { getClient, PIPELINE_MODEL } from "@/lib/llm/claude";
import { buildLandPrompt } from "@/lib/llm/prompts-v2";
import { ExpertAnalysis } from "@/lib/types-v2";

export async function POST(req: NextRequest) {
  const { listenSummary, expertAnalyses, debateResult, debateSynthesis, toneSetting } =
    (await req.json()) as {
      listenSummary: string;
      expertAnalyses: ExpertAnalysis[];
      debateResult: string;
      debateSynthesis: string;
      toneSetting: "반말" | "해요체";
    };

  const encoder = new TextEncoder();

  if (!listenSummary || !expertAnalyses || !debateResult) {
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "필수 데이터가 부족합니다." })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(errorStream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  let client;
  try {
    client = getClient();
  } catch (error) {
    void error;
    const errorStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "AI 서비스에 일시적인 문제가 있습니다." })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(errorStream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  }

  const combinedDebate = debateResult + (debateSynthesis ? `\n\n[종합]\n${debateSynthesis}` : "");
  const systemPrompt = buildLandPrompt(listenSummary, expertAnalyses, combinedDebate, toneSetting);

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: PIPELINE_MODEL,
          max_tokens: 2048,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: "토론이 끝났어. 이제 정리해줘.",
            },
          ],
        });

        stream.on("text", (text) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
          );
        });

        await stream.finalMessage();
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      } catch (error) {
        void error;
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ text: "정리 중 오류가 발생했습니다.", error: true })}\n\n`
          )
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
