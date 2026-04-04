/**
 * UI 리뉴얼 테스트 — 글래스모피즘 + 전체 배경 + 파티클 + 15턴 대화
 *
 * 시나리오: 모험가의 숲 테마, 대화형 (직접 말할게), 쉬었음 청년 진로고민 15턴
 *
 * UI 검증 항목 (첫 턴):
 *   - 전체 화면 배경 (fixed inset-0)
 *   - 파티클 요소 (particle-firefly 등)
 *   - 글래스모피즘: glass-btn, glass-input, glass-bubble-ai, glass-bubble-user
 *
 * 결과 저장:
 *   스크린샷: ~/study/main/pullim/tests/screenshots/renewal-turn-{N}.png
 *   결과:    ~/study/main/pullim/tests/ui-renewal-result.md
 */

import { test, expect, type Page } from "@playwright/test";
import * as path from "path";
import * as fs from "fs";

// ── 경로 설정 ───────────────────────────────────────────────
const SCREENSHOT_DIR = path.resolve(__dirname, "../../../tests/screenshots");
const RESULT_PATH = path.resolve(__dirname, "../../../tests/ui-renewal-result.md");

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
 * glass-bubble-ai 클래스 기반으로 탐색
 */
async function getLastAiResponse(page: Page): Promise<string> {
  // glass-bubble-ai 우선, 폴백으로 font-rpg 텍스트
  const bubbles = page.locator(".glass-bubble-ai");
  const count = await bubbles.count();
  if (count > 0) {
    const last = bubbles.last();
    return (await last.textContent()) || "(빈 응답)";
  }
  // 폴백: 기존 셀렉터
  const msgs = page.locator("div.text-sm.leading-relaxed.font-rpg");
  const msgCount = await msgs.count();
  if (msgCount === 0) return "(응답 없음)";
  return (await msgs.last().textContent()) || "(빈 응답)";
}

/**
 * AI 응답이 완료될 때까지 대기한다.
 * textarea:not([disabled]) 나타남 또는 로딩 인디케이터 사라짐
 */
async function waitForAiResponse(page: Page, timeoutMs = 180_000): Promise<void> {
  // 로딩 시작 대기 (최대 10초)
  try {
    await page.waitForSelector(".animate-pulse", { timeout: 10_000 });
  } catch {
    // 로딩 없이 바로 응답 올 수 있음
  }

  // 로딩 완료 대기 — textarea 활성화
  try {
    await page.waitForSelector("textarea:not([disabled])", { timeout: timeoutMs });
  } catch {
    // textarea 없는 경우 — animate-pulse 사라질 때까지
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

// ── UI 리뉴얼 검증 ──────────────────────────────────────
interface UiCheckResult {
  fullBackground: string;
  particles: string;
  glassBtn: string;
  glassInput: string;
  glassBubbleAi: string;
  glassBubbleUser: string;
}

async function checkUiRenewal(page: Page): Promise<UiCheckResult> {
  // 1) 전체 배경: fixed inset-0 요소 존재
  const bgEl = page.locator(".fixed.inset-0").first();
  const bgExists = await bgEl.isVisible().catch(() => false);
  const fullBackground = bgExists ? "OK" : "FAIL";

  // 2) 파티클: particle- 클래스 요소 존재
  const particleCount = await page
    .locator('[class*="particle-"]')
    .count()
    .catch(() => 0);
  const particles = particleCount > 0 ? `OK (${particleCount}개)` : "FAIL";

  // 3) glass-btn: 버튼 존재
  const glassBtnCount = await page
    .locator(".glass-btn")
    .count()
    .catch(() => 0);
  const glassBtn = glassBtnCount > 0 ? `OK (${glassBtnCount}개)` : "FAIL";

  // 4) glass-input: textarea 존재
  const glassInputCount = await page
    .locator(".glass-input")
    .count()
    .catch(() => 0);
  const glassInput = glassInputCount > 0 ? `OK (${glassInputCount}개)` : "FAIL";

  // 5) glass-bubble-ai
  const bubbleAiCount = await page
    .locator(".glass-bubble-ai")
    .count()
    .catch(() => 0);
  const glassBubbleAi = bubbleAiCount > 0 ? `OK (${bubbleAiCount}개)` : "FAIL";

  // 6) glass-bubble-user: 첫 턴에서는 사용자 메시지 보냈을 때 확인
  const bubbleUserCount = await page
    .locator(".glass-bubble-user")
    .count()
    .catch(() => 0);
  const glassBubbleUser = bubbleUserCount > 0 ? `OK (${bubbleUserCount}개)` : "FAIL (첫 턴 전일 수 있음)";

  return { fullBackground, particles, glassBtn, glassInput, glassBubbleAi, glassBubbleUser };
}

// ── 메인 테스트 ──────────────────────────────────────────
test("UI 리뉴얼 테스트 — 모험가 대화형 15턴", async ({ page }) => {
  test.setTimeout(50 * 60 * 1000); // 50분

  const turnResults: Array<{
    turn: number;
    user: string;
    ai: string;
    note: string;
  }> = [];
  let uiCheck: UiCheckResult | null = null;
  const startTime = new Date().toISOString();

  // ① 홈 진입 + localStorage 초기화
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.goto("/");
  await shot(page, "renewal-00-홈");

  // ② 모험가의 숲 테마 카드 클릭
  const themeCard = page
    .locator('button.rpg-panel-light:has-text("모험가의 숲")')
    .first();
  await themeCard.waitFor({ state: "visible", timeout: 8_000 });
  await themeCard.click();
  await shot(page, "renewal-01-테마선택");

  // ③ "바로 대화할래" 클릭
  const skipBtn = page.locator('button:has-text("바로 대화할래")').first();
  await skipBtn.waitFor({ state: "visible", timeout: 5_000 });
  await skipBtn.click();
  await shot(page, "renewal-02-바로대화");

  // ④ 세션 페이지 로드 대기
  await page.waitForURL(/\/adventure\//, { timeout: 15_000 });
  await shot(page, "renewal-03-세션로드");

  // ⑤ "직접 말할게" 클릭
  const entryBtns = page.locator("button.rpg-panel-light");
  await entryBtns.first().waitFor({ state: "visible", timeout: 10_000 });

  const directBtn = page
    .locator('button.rpg-panel-light:has-text("직접 말할게")')
    .first();
  const directVisible = await directBtn.isVisible().catch(() => false);
  if (directVisible) {
    await directBtn.click();
  } else {
    // 폴백: 두 번째 버튼 (직접 말할게)
    await entryBtns.nth(1).click();
  }
  await shot(page, "renewal-04-직접말할게");

  // ⑥ 첫 AI 응답 대기
  await page.waitForTimeout(2_000);
  await waitForAiResponse(page, 180_000);
  await shot(page, "renewal-05-첫응답");

  // 대화형 뷰 전환 (카드형이면)
  const chatToggle = page.locator('button:has-text("💬 대화형")');
  if (await chatToggle.isVisible().catch(() => false)) {
    await chatToggle.click();
    await page.waitForTimeout(500);
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
      console.log(`[Turn ${turnNum}] textarea 없음 — 대화형 전환 시도`);
      await shot(page, `renewal-turn-${pad}-no-textarea`);

      const toggle = page.locator('button:has-text("💬 대화형")');
      if (await toggle.isVisible().catch(() => false)) {
        await toggle.click();
        await page.waitForTimeout(500);
      }

      const taVisible2 = await page
        .locator("textarea:visible")
        .last()
        .isVisible()
        .catch(() => false);
      if (!taVisible2) {
        console.log(`[Turn ${turnNum}] textarea 복구 불가 — 조기 종료`);
        turnResults.push({
          turn: turnNum,
          user: userMsg,
          ai: "(textarea 없음, 조기 종료)",
          note: "조기 종료",
        });
        break;
      }
    }

    // 메시지 입력 + Enter
    await page.locator("textarea:visible").last().fill(userMsg);
    await page.keyboard.press("Enter");
    await shot(page, `renewal-turn-${pad}-전송`);

    // AI 응답 대기
    let timedOut = false;
    try {
      await waitForAiResponse(page, 180_000);
    } catch {
      timedOut = true;
      console.log(`[Turn ${turnNum}] 180초 타임아웃`);
      await shot(page, `renewal-turn-${pad}-timeout`);
      turnResults.push({
        turn: turnNum,
        user: userMsg,
        ai: "(180초 타임아웃)",
        note: "타임아웃",
      });
      break;
    }

    if (!timedOut) {
      // AI 응답 텍스트 추출
      const aiText = await getLastAiResponse(page);
      console.log(
        `[Turn ${turnNum}] AI: ${aiText.slice(0, 300)}${aiText.length > 300 ? "..." : ""}`
      );

      await shot(page, `renewal-turn-${pad}`);

      // 첫 턴에서 UI 리뉴얼 검증
      if (turnNum === 1) {
        uiCheck = await checkUiRenewal(page);
        console.log(`\n[UI 검증]`);
        console.log(`  전체 배경: ${uiCheck.fullBackground}`);
        console.log(`  파티클: ${uiCheck.particles}`);
        console.log(`  glass-btn: ${uiCheck.glassBtn}`);
        console.log(`  glass-input: ${uiCheck.glassInput}`);
        console.log(`  glass-bubble-ai: ${uiCheck.glassBubbleAi}`);
        console.log(`  glass-bubble-user: ${uiCheck.glassBubbleUser}`);
        await shot(page, "renewal-06-ui검증");

        // glass-bubble-user 재확인 (첫 메시지 보낸 후이므로 있어야 함)
        const userBubbleCount = await page
          .locator(".glass-bubble-user")
          .count()
          .catch(() => 0);
        if (userBubbleCount > 0) {
          uiCheck.glassBubbleUser = `OK (${userBubbleCount}개)`;
        }
      }

      turnResults.push({
        turn: turnNum,
        user: userMsg,
        ai: aiText,
        note: "",
      });

      await page.waitForTimeout(800);
    }
  }

  // ⑧ 최종 스크린샷
  await shot(page, "renewal-99-최종");

  // ⑨ 결과 파일 저장
  const ui = uiCheck || {
    fullBackground: "미확인",
    particles: "미확인",
    glassBtn: "미확인",
    glassInput: "미확인",
    glassBubbleAi: "미확인",
    glassBubbleUser: "미확인",
  };

  const turnTable = turnResults
    .map((r) => {
      const aiShort =
        r.ai.length > 200
          ? r.ai.slice(0, 200).replace(/\n/g, " ") + "..."
          : r.ai.replace(/\n/g, " ");
      return `| ${r.turn} | ${r.user} | ${aiShort} | ${r.note} |`;
    })
    .join("\n");

  const resultMd = `# UI 리뉴얼 테스트 결과 — 모험가 대화형 15턴
**날짜**: ${startTime.split("T")[0]}
**시간**: ${startTime}
**테마**: 모험가의 숲
**모드**: 대화형 (직접 말할게)
**페르소나**: 대학 졸업 후 1년째 쉬는 청년, 진로고민
**UI 상태**: 전체 배경(${ui.fullBackground}) / 파티클(${ui.particles}) / 글래스모피즘(glass-btn: ${ui.glassBtn})

## UI 검증
- 전체 배경: ${ui.fullBackground}
- 파티클: ${ui.particles}
- glass-btn: ${ui.glassBtn}
- glass-input: ${ui.glassInput}
- glass-bubble-ai: ${ui.glassBubbleAi}
- glass-bubble-user: ${ui.glassBubbleUser}

## 턴별 결과
| Turn | 사용자 | AI 응답 | 비고 |
|------|--------|---------|------|
${turnTable}

---
*스크린샷: tests/screenshots/renewal-*.png*
`;

  fs.writeFileSync(RESULT_PATH, resultMd, "utf-8");
  console.log(`\n결과 저장: ${RESULT_PATH}`);
});
