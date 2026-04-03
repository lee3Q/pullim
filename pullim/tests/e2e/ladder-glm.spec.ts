/**
 * GLM-5 사다리 세션 E2E 테스트
 *
 * 실제 DOM 셀렉터 (LadderSession.tsx 기반):
 *   Level 4 선택지  → button.rpg-button
 *   Level 1 Sensory  → button.rpg-panel-light (2×2 grid)
 *   Level 2 Comparison → button.rpg-panel-light (2×2 grid)
 *   Level 3 Analysis  → button.rpg-panel-light (맞아/아닌데/모르겠어 flex)
 *   Level 5 / 폴백   → input / textarea
 *   홈 테마 카드     → button.rpg-panel-light (세션 진입 후 사라짐)
 *   진입 옵션       → button.rpg-panel-light (이야기로풀어볼래 / 직접말할게)
 *
 * 스크린샷 저장 위치: ~/study/main/pullim/tests/screenshots/
 */

import { test, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ── 스크린샷 경로 ──────────────────────────────────────────
// __dirname = ~/study/main/pullim/pullim/tests/e2e
// ../../../  = ~/study/main/pullim/
const SCREENSHOT_DIR = path.resolve(__dirname, "../../../tests/screenshots");
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

// ── 셀렉터 상수 ────────────────────────────────────────────
const SEL_CHOICE = ".rpg-button";           // Level 4 선택지
const SEL_PANEL  = "button.rpg-panel-light"; // Level 1/2/3 버튼
const SEL_ANY    = `${SEL_CHOICE}, ${SEL_PANEL}`;

// ── 테마 정의 (page.tsx THEME_CARDS 기준) ─────────────────
const THEMES = [
  { label: "모험가",   cardText: "모험가의 숲" },
  { label: "전략실",   cardText: "전략실" },
  { label: "달빛정원", cardText: "달빛정원" },
  { label: "천문대",   cardText: "천문대" },
  { label: "종말",     cardText: "종말" },
] as const;

// ── 유틸 ───────────────────────────────────────────────────
async function shot(page: Page, name: string): Promise<void> {
  const filepath = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: filepath }).catch(() => {});
}

/**
 * 현재 화면에서 클릭 가능한 응답 버튼을 선택.
 * 우선순위: Level4(rpg-button) → Level1/2/3(rpg-panel-light) → 텍스트 입력
 */
async function clickOption(page: Page): Promise<"clicked" | "text" | "none"> {
  // Level 4 선택지
  const choiceBtn = page.locator(SEL_CHOICE).first();
  if (await choiceBtn.isVisible().catch(() => false)) {
    await choiceBtn.click();
    return "clicked";
  }
  // Level 1/2/3 패널 버튼
  const panelBtn = page.locator(SEL_PANEL).first();
  if (await panelBtn.isVisible().catch(() => false)) {
    await panelBtn.click();
    return "clicked";
  }
  // 텍스트 입력 폴백
  const input = page.locator("input:visible, textarea:visible").last();
  if (await input.isVisible().catch(() => false)) {
    await input.fill("잘 모르겠어");
    await page.keyboard.press("Enter");
    return "text";
  }
  return "none";
}

// ── 테스트 루프 ────────────────────────────────────────────
for (const theme of THEMES) {
  test(`GLM 사다리 세션 — ${theme.label}`, async ({ page }) => {

    // ① 홈 진입 + localStorage 초기화 (약속/프로필 제거)
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.goto("/");
    await shot(page, `glm-${theme.label}-01-홈`);

    // ② 테마 카드 클릭 (cardText 기준)
    const themeCard = page
      .locator(`button.rpg-panel-light:has-text("${theme.cardText}")`)
      .first();
    await themeCard.waitFor({ state: "visible", timeout: 5_000 });
    await themeCard.click();
    await shot(page, `glm-${theme.label}-02-테마선택`);

    // ③ "바로 대화할래" 클릭
    const startBtn = page.locator('button:has-text("바로 대화할래")').first();
    await startBtn.waitFor({ state: "visible", timeout: 5_000 });
    await startBtn.click();

    // ④ 세션 페이지 로드 대기
    await page.waitForURL(
      /\/(adventure|garden|strategy|stargazer|apocalypse)\//,
      { timeout: 15_000 }
    );
    await shot(page, `glm-${theme.label}-03-세션페이지`);

    // ⑤ 진입 옵션 선택 (entry phase: rpg-panel-light 첫 번째 = 이야기로 풀어볼래)
    const entryBtn = page.locator(SEL_PANEL).first();
    await entryBtn.waitFor({ state: "visible", timeout: 10_000 });
    await shot(page, `glm-${theme.label}-04-진입선택전`);
    await entryBtn.click();
    await shot(page, `glm-${theme.label}-05-진입선택후`);

    // ⑥ 5턴 반복
    for (let turn = 1; turn <= 5; turn++) {
      const pad = String(turn + 5).padStart(2, "0");

      // React 상태 갱신 대기 (이전 버튼 사라지는 시간)
      await page.waitForTimeout(1_500);

      // GLM 응답 대기 (최대 90초 — z.ai 게이트웨이 특성)
      try {
        await page.waitForSelector(SEL_ANY, { timeout: 90_000 });
      } catch {
        await shot(page, `glm-${theme.label}-${pad}-${turn}턴-타임아웃`);
        console.log(`[${theme.label}] Turn ${turn}: 90초 타임아웃`);
        break;
      }

      await shot(page, `glm-${theme.label}-${pad}-${turn}턴`);

      const result = await clickOption(page);
      if (result === "none") {
        await shot(page, `glm-${theme.label}-${pad}-${turn}턴-버튼없음`);
        console.log(`[${theme.label}] Turn ${turn}: 클릭할 버튼 없음`);
        break;
      }
      console.log(`[${theme.label}] Turn ${turn}: ${result}`);

      // 세션 종료 감지
      const ended = await page
        .locator("text=/요약|완료|결과|마무리/")
        .isVisible()
        .catch(() => false);
      if (ended) {
        await shot(page, `glm-${theme.label}-99-종료`);
        console.log(`[${theme.label}] 세션 종료 감지`);
        break;
      }
    }

    await shot(page, `glm-${theme.label}-99-최종`);
  });
}
