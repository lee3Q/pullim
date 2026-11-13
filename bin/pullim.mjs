#!/usr/bin/env node
import {
  unravelConcern,
  detectBreakthroughInsight,
} from "../src/lib/core/unravel-engine.ts";
import {
  createLadderSession,
  buildLadderStepCard,
  advanceLadderSession,
} from "../src/lib/core/ladder-engine.ts";
import { exportUnravelToMarkdown } from "../src/lib/core/journal-portability.ts";
import { detectCrisis } from "../src/lib/safety/crisis-detector.ts";

function printHelp() {
  console.log(`Pullim (풀림) v1.0.0 — Open-Source Cognitive Unraveling & Socratic Decision Workbench

Usage:
  pullim unravel "<concern>" [--lens grounding|structural|exploratory] [--markdown | --json]
  pullim ladder "<concern>" [--direction up|down] [--json]
  pullim insight "<sentence>" [--json]
  pullim crisis-check "<text>" [--json]
  pullim demo
  pullim --help

Examples:
  node bin/pullim.mjs demo
  node bin/pullim.mjs unravel "이직 제안을 받았는데 머리로는 조건이 좋은 걸 알지만 지금 팀을 떠나기가 불안해서 결정을 못 하겠어요."
  node bin/pullim.mjs unravel "사이드 프로젝트를 다 갈아엎고 오픈소스로 공개할지 고민입니다." --markdown
  node bin/pullim.mjs ladder "할 일이 너무 많아서 어디서부터 손대야 할지 막막해요." --direction up
`);
}

function parseFlags(args) {
  const positional = [];
  const flags = {
    lens: "structural",
    direction: undefined,
    json: false,
    markdown: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
    } else if (arg === "--json") {
      flags.json = true;
    } else if (arg === "--markdown" || arg === "--md") {
      flags.markdown = true;
    } else if (arg === "--lens" && args[i + 1]) {
      flags.lens = args[++i];
    } else if (arg === "--direction" && args[i + 1]) {
      flags.direction = args[++i];
    } else {
      positional.push(arg);
    }
  }
  return { positional, flags };
}

function formatTerminalUnravel(result) {
  if (result.haltedByCrisis && result.crisisResponse) {
    const lines = [
      "============================================================",
      "⚠️  [긴급 위기 보호 가드 작동 — 즉시 대화/분석 중단]",
      "============================================================",
      result.crisisResponse.userMessage,
      "",
      "[전문 상담 및 긴급 도움 기관]",
      ...result.crisisResponse.hotlines.map(
        (h) => `  • ${h.name}: ${h.number} (${h.description})`,
      ),
      "============================================================",
    ];
    return lines.join("\n");
  }

  const lines = [
    "============================================================",
    "🌿 풀림 (Pullim) — 사고 구조화 & 소크라테스 의사결정 워크벤치",
    "============================================================",
    `• 도메인: ${result.topicDomain} | 권장 사다리: ${
      result.recommendedLadderDirection === "down"
        ? "🔽 내려가기 (Level 5→1 감각 점검)"
        : "🔼 올라가기 (Level 1→5 단계별 구체화)"
    }`,
    `• 사다리 안내: ${result.ladderDirectionReason}`,
    "",
    `[1] 핵심 갈등 & 재정의된 질문`,
    `  • 갈등: ${result.coreTension}`,
    `  • 질문: ${result.reframedQuestion}`,
    "",
    `[2] 사실(Facts) vs 가정(Assumptions) 분리`,
    ...result.facts.map((f) => `  ✓ [사실] ${f}`),
    ...result.assumptions.map(
      (a) =>
        `  ? [가정] ${a.statement}\n      ↳ 점검 질문: ${a.checkQuestion}`,
    ),
    "",
    `[3] 포착된 인지적 함정 (Cognitive Traps)`,
    ...result.cognitiveTraps.map(
      (t) => `  • ${t.name}: ${t.evidence}\n      ↳ 전환 질문: ${t.reframeQuestion}`,
    ),
    "",
    `[4] 세 가지 시선 (3 Perspective Lenses)`,
    ...result.lenses.map(
      (l) => `  ${l.badge} ${l.title}\n    - ${l.summary}\n    - 질문: ${l.socraticQuestion}`,
    ),
    "",
    `[5] 되돌릴 수 있는 작은 실험 (Reversible Options)`,
    ...result.options.map(
      (o) =>
        `  ${o.recommended ? "✦ [추천]" : "  [선택]"} ${o.title} (${o.costMinutes}분)\n      ↳ ${o.description}`,
    ),
    "",
    `[6] If-Then 실행 약속 (Implementation Intention)`,
    `  • 만약 (Trigger): ${result.ifThenPlan.trigger}`,
    `  • 행동 (Action) : ${result.ifThenPlan.action}`,
    `  • 대안 (Fallback): ${result.ifThenPlan.fallback}`,
    "============================================================",
  ];
  return lines.join("\n");
}

function main() {
  const { positional, flags } = parseFlags(process.argv.slice(2));
  const command = positional[0];

  if (flags.help || !command || command === "help") {
    printHelp();
    return;
  }

  if (command === "demo") {
    const sampleConcern =
      "내 레포를 어떻게 해야 사람들이 쓸만한 오픈소스로 변화시킬지 고민이야. 머리로는 구조와 기능 분석을 다 해봤는데, 기존에 만든 것들이 아까워서 싹 갈아엎기가 망설여져.";
    const result = unravelConcern(sampleConcern, { preferredLens: "structural" });
    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    if (flags.markdown) {
      console.log(exportUnravelToMarkdown(result));
      return;
    }
    console.log(formatTerminalUnravel(result));
    return;
  }

  if (command === "unravel") {
    const concern = positional.slice(1).join(" ").trim();
    if (!concern) {
      console.error("오류: 고민 문장을 입력해 주세요. 예: pullim unravel \"고민 내용\"");
      process.exitCode = 1;
      return;
    }
    const lens = ["grounding", "structural", "exploratory"].includes(flags.lens)
      ? flags.lens
      : "structural";
    const result = unravelConcern(concern, {
      preferredLens: lens,
      entryDirection: flags.direction,
    });
    if (flags.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (flags.markdown) {
      console.log(exportUnravelToMarkdown(result));
    } else {
      console.log(formatTerminalUnravel(result));
    }
    return;
  }

  if (command === "ladder") {
    const concern =
      positional.slice(1).join(" ").trim() ||
      "머릿속이 복잡해서 어디서부터 시작할지 모르겠어요.";
    let session = createLadderSession(concern, {
      direction: flags.direction,
      lens: flags.lens,
    });
    const steps = [];
    for (let i = 0; i < 5; i++) {
      const card = buildLadderStepCard(
        session.currentLevel,
        session.concern,
        session.direction,
        session.lens,
        session.flipCount,
      );
      steps.push(card);
      const rec = card.options.find((o) => o.recommended) ?? card.options[0];
      session = advanceLadderSession(session, {
        type: "select_option",
        optionId: rec.id,
      });
      if (session.completed && i >= 1) break;
    }
    if (flags.json) {
      console.log(
        JSON.stringify(
          {
            sessionId: session.sessionId,
            direction: steps[0]?.direction,
            steps,
            finalProfile: session.profile,
          },
          null,
          2,
        ),
      );
      return;
    }
    console.log("============================================================");
    console.log(
      `🪜 풀림 양방향 5단계 인지 사다리 (${steps[0]?.direction === "down" ? "내려가기 L5→L1" : "올라가기 L1→L5"})`,
    );
    console.log("============================================================");
    for (const step of steps) {
      console.log(`\n[${step.levelName}]`);
      console.log(`  Q. ${step.question}`);
      for (const opt of step.options) {
        console.log(
          `    ${opt.recommended ? "✦ [추천]" : "  •"} ${opt.label} — ${opt.subtext}`,
        );
      }
    }
    return;
  }

  if (command === "insight") {
    const sentence = positional.slice(1).join(" ").trim();
    const check = detectBreakthroughInsight(sentence);
    if (flags.json) {
      console.log(JSON.stringify(check, null, 2));
    } else {
      console.log(
        `${check.isBreakthrough ? "✦ [명예의 전당 등재 가능]" : "• [일반 성찰 메모]"} (점수: ${check.score})\n  문장: "${check.coreSentence}"\n  해설: ${check.reason}`,
      );
    }
    return;
  }

  if (command === "crisis-check") {
    const text = positional.slice(1).join(" ").trim();
    const res = detectCrisis(text);
    if (flags.json) {
      console.log(JSON.stringify(res, null, 2));
    } else if (res.tier === null) {
      console.log("✓ [GREEN / 안전] 위기 키워드가 감지되지 않았습니다.");
    } else {
      console.log(
        `⚠️ [Tier ${res.tier}] ${res.response?.userMessage}\n연락처: ${res.response?.hotlines.map((h) => `${h.name}(${h.number})`).join(", ")}`,
      );
    }
    return;
  }

  console.error(`알 수 없는 명령어입니다: ${command}`);
  printHelp();
  process.exitCode = 1;
}

main();
