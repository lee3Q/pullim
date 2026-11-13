import http, { type IncomingMessage, type ServerResponse } from "node:http";
import { renderWorkbenchHtml } from "./workbench-ui.ts";
import {
  runUnravelWithGateway,
  type ProviderConfig,
} from "../lib/core/llm-gateway.ts";
import {
  detectBreakthroughInsight,
  type PerspectiveLensId,
} from "../lib/core/unravel-engine.ts";
import {
  createLadderSession,
  buildLadderStepCard,
  advanceLadderSession,
  type LadderSessionState,
  type LadderTurnAction,
} from "../lib/core/ladder-engine.ts";
import { exportUnravelToMarkdown } from "../lib/core/journal-portability.ts";
import { detectCrisis } from "../lib/safety/crisis-detector.ts";
import { getSessionSaveAccess } from "../lib/supabase/session-save-auth.ts";

async function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
  }
  const raw = Buffer.concat(chunks).toString("utf8").trim();
  if (!raw) return {};
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Invalid JSON object");
  }
  return parsed as Record<string, unknown>;
}

function sendJson(res: ServerResponse, status: number, payload: unknown): void {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(body);
}

function sendHtml(res: ServerResponse, status: number, html: string): void {
  res.writeHead(status, {
    "Content-Type": "text/html; charset=utf-8",
    "Cache-Control": "no-store",
  });
  res.end(html);
}

const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="utf-8"><title>풀림 (Pullim) — 개인정보 및 로컬 데이터 안내</title></head>
<body style="font-family:sans-serif; max-width:720px; margin:40px auto; line-height:1.7; padding:0 20px;">
  <h1>풀림 (Pullim) 로컬 우선(Local-First) 개인정보 안내</h1>
  <ul>
    <li><strong>계정 및 클라우드 강제 없음</strong>: 오픈소스 풀림은 회원가입 없이 브라우저의 <code>localStorage</code>에 확정 행동, If-Then 약속, 핵심 통찰, 자기이해 분포를 저장합니다.</li>
    <li><strong>완전한 데이터 주권 (JSON/Markdown 내보내기 및 복원)</strong>: 언제든 본인의 데이터를 JSON 파일로 백업하거나 다른 브라우저에 복원할 수 있으며, Markdown 파일로 내려받아 개인 노트(Obsidian, Notion 등)에 보관할 수 있습니다.</li>
    <li><strong>AI 엔진 선택권</strong>: 기본 내장 소크라테스 엔진은 외부 AI 서버로 고민 원문을 전송하지 않습니다. 사용자가 직접 로컬 Ollama 또는 개인 API 키(BYOK)를 설정한 경우에만 해당 엔드포인트로 요청이 전송됩니다.</li>
    <li><strong>위기 안전 원칙</strong>: 즉각적인 자해·자살 위기 신호(Tier A)가 감지되면 외부 모델 호출을 즉시 차단하고 24시간 전문 상담 기관(109, 1577-0199)을 안내합니다.</li>
  </ul>
  <p><a href="/">← 워크벤치로 돌아가기</a></p>
</body>
</html>`;

export function createPullimServer(): http.Server {
  return http.createServer(async (req, res) => {
    const method = req.method || "GET";
    const url = new URL(req.url || "/", "http://127.0.0.1");
    const pathname = url.pathname;

    try {
      if (method === "GET" && pathname === "/") {
        sendHtml(res, 200, renderWorkbenchHtml("unravel"));
        return;
      }
      if (method === "GET" && pathname === "/ladder") {
        sendHtml(res, 200, renderWorkbenchHtml("ladder"));
        return;
      }
      if (method === "GET" && pathname === "/history") {
        sendHtml(res, 200, renderWorkbenchHtml("journal"));
        return;
      }
      if (method === "GET" && (pathname === "/privacy" || pathname === "/terms")) {
        sendHtml(res, 200, PRIVACY_HTML);
        return;
      }
      if (method === "GET" && pathname === "/api/health") {
        sendJson(res, 200, {
          ok: true,
          name: "pullim",
          version: "1.0.0",
          license: "MIT",
          mode: "open-source-local-first",
        });
        return;
      }

      if (method === "POST" && pathname === "/api/unravel") {
        const body = await readJsonBody(req);
        const concern = typeof body.concern === "string" ? body.concern.trim() : "";
        if (!concern) {
          sendJson(res, 400, { error: "concern text is required" });
          return;
        }
        const lens: PerspectiveLensId =
          body.lens === "grounding" ||
          body.lens === "structural" ||
          body.lens === "exploratory"
            ? body.lens
            : "structural";
        const rawConfig =
          body.config && typeof body.config === "object"
            ? (body.config as Partial<ProviderConfig>)
            : {};
        const config: ProviderConfig = {
          provider:
            rawConfig.provider === "ollama" ||
            rawConfig.provider === "openai" ||
            rawConfig.provider === "anthropic" ||
            rawConfig.provider === "gemini"
              ? rawConfig.provider
              : "builtin",
          apiKey: typeof rawConfig.apiKey === "string" ? rawConfig.apiKey : undefined,
          baseUrl: typeof rawConfig.baseUrl === "string" ? rawConfig.baseUrl : undefined,
          model: typeof rawConfig.model === "string" ? rawConfig.model : undefined,
        };

        const gatewayResult = await runUnravelWithGateway(concern, lens, config);
        const markdown = exportUnravelToMarkdown(gatewayResult.result);
        sendJson(res, 200, {
          ...gatewayResult,
          markdown,
        });
        return;
      }

      if (method === "POST" && pathname === "/api/ladder/start") {
        const body = await readJsonBody(req);
        const concern =
          typeof body.concern === "string" && body.concern.trim()
            ? body.concern.trim()
            : "머릿속이 복잡해서 어디서부터 시작할지 모르겠어요.";
        const direction =
          body.direction === "down" || body.direction === "up"
            ? body.direction
            : undefined;
        const lens: PerspectiveLensId =
          body.lens === "grounding" ||
          body.lens === "structural" ||
          body.lens === "exploratory"
            ? body.lens
            : "structural";

        const session = createLadderSession(concern, { direction, lens });
        const stepCard = buildLadderStepCard(
          session.currentLevel,
          session.concern,
          session.direction,
          session.lens,
          session.flipCount,
        );
        sendJson(res, 200, { session, stepCard });
        return;
      }

      if (method === "POST" && pathname === "/api/ladder/step") {
        const body = await readJsonBody(req);
        if (!body.state || typeof body.state !== "object" || !body.action || typeof body.action !== "object") {
          sendJson(res, 400, { error: "state and action are required" });
          return;
        }
        const nextSession = advanceLadderSession(
          body.state as LadderSessionState,
          body.action as LadderTurnAction,
        );
        const stepCard = buildLadderStepCard(
          nextSession.currentLevel,
          nextSession.concern,
          nextSession.direction,
          nextSession.lens,
          nextSession.flipCount,
        );
        sendJson(res, 200, { session: nextSession, stepCard });
        return;
      }

      if (method === "POST" && pathname === "/api/insight-check") {
        const body = await readJsonBody(req);
        const text = typeof body.text === "string" ? body.text : "";
        sendJson(res, 200, detectBreakthroughInsight(text));
        return;
      }

      if (method === "POST" && pathname === "/api/crisis-check") {
        const body = await readJsonBody(req);
        const text = typeof body.text === "string" ? body.text : "";
        sendJson(res, 200, detectCrisis(text));
        return;
      }

      if (method === "POST" && pathname === "/api/session-save") {
        const body = await readJsonBody(req);
        if (typeof body.user_id !== "string" || !body.user_id) {
          sendJson(res, 400, { error: "user_id required" });
          return;
        }
        const authHeader =
          typeof req.headers.authorization === "string"
            ? req.headers.authorization
            : null;
        const access = await getSessionSaveAccess(authHeader, body.user_id);
        if (access.kind === "local") {
          sendJson(res, 200, { ok: true, storage: "local" });
          return;
        }
        if (access.kind === "error") {
          sendJson(res, access.status, { error: access.message });
          return;
        }
        sendJson(res, 200, { ok: true, storage: "supabase" });
        return;
      }

      sendJson(res, 404, { error: "Not found" });
    } catch (err) {
      sendJson(res, 400, {
        error: err instanceof Error ? err.message : "Bad request",
      });
    }
  });
}
