/**
 * GLM-5 응답 품질 검증 테스트 (15턴)
 *
 * 시나리오: 파악 건너뛰기, 쉬었음 청년 진로고민 페르소나, 대화형 15턴
 * 테마: 모험가의 숲
 * 모드: 직접 말할게 (Level 5, 대화형)
 *
 * 결과 저장:
 *   스크린샷: ~/study/main/pullim/tests/screenshots/quality-turn-{N}.png
 *   응답 로그: ~/study/main/pullim/tests/glm-quality-result.md
 */

import { test, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ── 경로 설정 ───────────────────────────────────────────────
const SCREENSHOT_DIR = path.resolve(__dirname, "../../../tests/screenshots");
const RESULT_PATH = path.resolve(__dirname, "../../../tests/glm-quality-result.md");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// ── 대화 시나리오 (15턴) ──────────────────────────────────
const TURNS = [
  "대학 졸업하고 1년째 쉬고 있는데 뭘 해야 할지 모르겠어",
  "취업도 생각해봤는데 막상 하고 싶은 게 없어서...",
  "주변은 다 자기 길 가는데 나만 멈춰있는 느낌",
  "그냥 뭐라도 하면 나아질까?",
  "고마워. 좀 정리가 된 것 같아",
  "근데 사실 쉬는 동안 유튜브만 봤거든... 자괴감이 들어",
  "부모님은 뭐라도 하라고 하시는데 그 말이 더 무겁게 느껴져",
  "친구가 스타트업 같이 하자고 했는데 자신이 없어",
  "내가 뭘 잘하는지도 모르겠어",
  "어렸을 때는 그림 그리는 걸 좋아했는데 그걸로 뭘 할 수 있을까",
  "디자인 쪽을 알아볼까 생각은 해봤어",
  "근데 나이가 벌써 26인데 지금 시작해도 되나",
  "주변에 비전공으로 디자인 시작한 사람 있긴 한데...",
  "일단 뭐라도 시작해보고 싶긴 해",
  "오늘 얘기해서 좀 정리된 것 같아. 고마워",
];

// ── 유틸 ─────────────────────────────────────────────────
async function shot(page: Page, name: string): Promise<void> {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath }).catch(() => {});
}

/**
 * 대화형 뷰에서 마지막 AI 응답 텍스트를 추출한다.
 */
async function getLastAiResponse(page: Page): Promise<string> {
  const msgs = page.locator("div.text-sm.leading-relaxed.font-rpg");
  const count = await msgs.count();
  if (count === 0) return "(응답 없음)";
  const last = msgs.last();
  return (await last.textContent()) || "(빈 응답)";
}

/**
 * 현재 레벨 감지: URL, 선택지 UI, 레벨 인디케이터 등으로 추정
 */
async function detectLevel(page: Page): Promise<string> {
  // Level 4: rpg-button 선택지
  const choice = await page.locator(".rpg-button").count().catch(() => 0);
  if (choice > 0) return "4 (선택지)";

  // Level 1: SensoryLevel — 2x2 감각 카드
  const sensory = await page.locator(".rpg-panel-light").count().catch(() => 0);
  if (sensory >= 4) return "1 (감각)";
  if (sensory === 2) return "2 (비교)";

  // Level 3: AnalysisLevel — 맞아/아닌데/모르겠어
  const analysis = await page
    .locator('button:has-text("맞아"), button:has-text("아닌데")')
    .count()
    .catch(() => 0);
  if (analysis > 0) return "3 (분석)";

  // Level 5: textarea
  const ta = await page.locator("textarea:visible").count().catch(() => 0);
  if (ta > 0) return "5 (자유입력)";

  return "알 수 없음";
}

/**
 * 도구 제안(분석/리서치) 여부 감지
 */
async function detectToolSuggestion(page: Page): Promise<string> {
  const research = await page
    .locator('button:has-text("📚"), button:has-text("리서치"), button:has-text("조사")')
    .isVisible()
    .catch(() => false);
  if (research) return "리서치 제안";

  const analysis = await page
    .locator('button:has-text("🔬"), button:has-text("분석")')
    .isVisible()
    .catch(() => false);
  if (analysis) return "분석 제안";

  return "없음";
}

/**
 * AI 응답이 완료될 때까지 대기한다.
 * 완료 기준: textarea:not([disabled]) 가 나타나거나, 로딩 인디케이터가 사라짐
 */
async function waitForAiResponse(page: Page, timeoutMs = 180_000): Promise<void> {
  // 1단계: 로딩 시작 대기 (최대 10초)
  try {
    await page.waitForSelector(".animate-pulse", { timeout: 10_000 });
  } catch {
    // 로딩 없이 바로 응답이 올 수도 있음
  }

  // 2단계: 로딩 완료 대기 — textarea가 활성화되거나 로딩 점이 사라질 때까지
  // TextInputLevel: isLoading=false가 되면 textarea disabled 해제
  try {
    await page.waitForSelector("textarea:not([disabled])", { timeout: timeoutMs });
    // textarea 활성화됨 = 응답 완료
  } catch {
    // textarea가 없는 경우(레벨 전환 등) — animate-pulse 사라질 때까지 대기
    try {
      await page.waitForSelector(".animate-pulse", {
        state: "detached",
        timeout: 10_000,
      });
    } catch {
      // 무시
    }
  }

  await page.waitForTimeout(500);
}

// ── 메인 테스트 ──────────────────────────────────────────
test("GLM-5 품질 검증 — 쉬었음 청년 진로고민 15턴", async ({ page }) => {
  const results: string[] = [];
  const startTime = new Date().toISOString();

  // ① 홈 진입 + localStorage 초기화
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await shot(page, "quality-00-홈");

  // ② 모험가의 숲 테마 카드 클릭
  const themeCard = page
    .locator('button.rpg-panel-light:has-text("모험가의 숲")')
    .first();
  await themeCard.waitFor({ state: "visible", timeout: 8_000 });
  await themeCard.click();
  await shot(page, "quality-01-테마선택");

  // ③ "바로 대화할래" 클릭 (파악 건너뛰기)
  const skipBtn = page.locator('button:has-text("바로 대화할래")').first();
  await skipBtn.waitFor({ state: "visible", timeout: 5_000 });
  await skipBtn.click();
  await shot(page, "quality-02-파악건너뜀");

  // ④ 세션 페이지 로드 대기
  await page.waitForURL(/\/adventure\//, { timeout: 15_000 });
  await shot(page, "quality-03-세션로드");

  // ⑤ 진입 옵션: "직접 말할게" 클릭
  const entryBtns = page.locator("button.rpg-panel-light");
  await entryBtns.first().waitFor({ state: "visible", timeout: 10_000 });
  await shot(page, "quality-04-진입옵션전");

  const directBtn = page.locator('button.rpg-panel-light:has-text("직접 말할게")').first();
  const directVisible = await directBtn.isVisible().catch(() => false);
  if (directVisible) {
    await directBtn.click();
  } else {
    await entryBtns.nth(1).click();
  }
  await shot(page, "quality-05-진입선택후");

  // ⑥ 첫 AI 응답 대기
  await page.waitForTimeout(2_000);
  await waitForAiResponse(page, 180_000);
  await shot(page, "quality-06-첫응답");

  // 대화형 뷰 전환 (카드형이면)
  const chatToggle = page.locator('button:has-text("💬 대화형")');
  if (await chatToggle.isVisible().catch(() => false)) {
    await chatToggle.click();
    await page.waitForTimeout(500);
    await shot(page, "quality-06b-대화형전환");
  }

  // ⑦ 15턴 대화
  for (let i = 0; i < TURNS.length; i++) {
    const turnNum = i + 1;
    const userMsg = TURNS[i];
    const pad = String(turnNum).padStart(2, "0");

    console.log(`\n[Turn ${turnNum}] 사용자: ${userMsg}`);

    // textarea 찾기
    const textarea = page.locator("textarea:visible").last();
    const taVisible = await textarea.isVisible().catch(() => false);

    if (!taVisible) {
      // textarea 없는 경우: 레벨이 바뀐 것 — 선택지 UI 확인
      const level = await detectLevel(page);
      console.log(`[Turn ${turnNum}] textarea 없음 (레벨: ${level}) — 대화형 전환 시도`);
      await shot(page, `quality-turn${pad}-no-textarea`);

      // 대화형 뷰로 전환 재시도
      const toggle = page.locator('button:has-text("💬 대화형")');
      if (await toggle.isVisible().catch(() => false)) {
        await toggle.click();
        await page.waitForTimeout(500);
      }

      // 재확인
      const taVisible2 = await page.locator("textarea:visible").last().isVisible().catch(() => false);
      if (!taVisible2) {
        console.log(`[Turn ${turnNum}] textarea 복구 불가 — 조기 종료`);
        results.push(
          `\n## Turn ${turnNum}\n**사용자**: ${userMsg}\n**AI**: (textarea 없음, 조기 종료)\n**레벨**: ${level}\n**제안**: -\n`
        );
        break;
      }
    }

    // 메시지 입력 + Enter
    await textarea.fill(userMsg);
    await page.keyboard.press("Enter");
    await shot(page, `quality-turn${pad}-전송`);

    // AI 응답 대기
    let timedOut = false;
    try {
      await waitForAiResponse(page, 180_000);
    } catch {
      timedOut = true;
      console.log(`[Turn ${turnNum}] 180초 타임아웃`);
      await shot(page, `quality-turn${pad}-timeout`);
      results.push(
        `\n## Turn ${turnNum}\n**사용자**: ${userMsg}\n**AI**: (180초 타임아웃)\n**레벨**: -\n**제안**: -\n`
      );
      break;
    }

    if (!timedOut) {
      // AI 응답 텍스트 추출
      const aiText = await getLastAiResponse(page);
      const level = await detectLevel(page);
      const suggestion = await detectToolSuggestion(page);

      console.log(`[Turn ${turnNum}] 레벨: ${level} | 제안: ${suggestion}`);
      console.log(`[Turn ${turnNum}] AI: ${aiText.slice(0, 300)}${aiText.length > 300 ? "..." : ""}`);

      await shot(page, `quality-turn${pad}-응답`);

      results.push(
        `\n## Turn ${turnNum}\n**사용자**: ${userMsg}\n**AI**: ${aiText}\n**레벨**: ${level}\n**제안**: ${suggestion}\n`
      );

      await page.waitForTimeout(800);
    }
  }

  // ⑧ 최종 스크린샷
  await shot(page, "quality-99-최종");

  // ⑨ 결과 파일 저장
  const resultMd = `# GLM-5 응답 품질 테스트 — 청년 진로고민 (15턴)
**날짜**: ${startTime.split("T")[0]}
**시간**: ${startTime}
**모델**: GLM-5 (z.ai 게이트웨이)
**테마**: 모험가의 숲
**모드**: 대화형 (직접 말할게 / Level 5)
**페르소나**: 대학 졸업 후 1년째 쉬는 청년, 진로고민 → 디자인 관심
${results.join("")}
---
*스크린샷: tests/screenshots/quality-*.png*
`;

  fs.writeFileSync(RESULT_PATH, resultMd, "utf-8");
  console.log(`\n결과 저장: ${RESULT_PATH}`);
});
