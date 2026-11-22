import { expect, test, type Page } from "@playwright/test";

function childBirthDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Clear break/intro gates; may need more than one pass between subtests. */
async function passSubtestGates(page: Page) {
  for (let i = 0; i < 6; i++) {
    const breakSkip = page.getByTestId("subtest-break-skip");
    if (await breakSkip.isVisible().catch(() => false)) {
      await breakSkip.click();
      await expect(breakSkip).toBeHidden({ timeout: 10_000 });
      continue;
    }
    const introStart = page.getByTestId("subtest-intro-start");
    if (await introStart.isVisible().catch(() => false)) {
      await introStart.click();
      await expect(introStart).toBeHidden({ timeout: 10_000 });
      continue;
    }
    break;
  }
}

async function waitForAssessItem(page: Page) {
  await expect(page.getByTestId("assess-segment-progress")).toBeVisible();
  // e2e pack: one item per index core → "· 1/1"
  await expect(page.getByTestId("assess-segment-progress")).toContainText(
    "1/1",
  );
  // Break/intro can appear after the previous item submits; keep clearing
  // until an interactive item surface is actually on screen.
  await expect
    .poll(
      async () => {
        await passSubtestGates(page);
        return page.evaluate(() => {
          const enabledChoice = document.querySelector(
            '[data-testid="mcq-choice"]:not([disabled])',
          );
          const digitPad = document.querySelector(
            '[data-testid="item-digit-span"] button:not([disabled])',
          );
          const symbolPad = document.querySelector(
            '[data-testid="item-symbol-search"] button:not([disabled])',
          );
          return Boolean(enabledChoice || digitPad || symbolPad);
        });
      },
      { timeout: 30_000 },
    )
    .toBe(true);
}

async function answerCurrentAssessmentItem(page: Page) {
  const mcq = page.getByTestId("item-mcq");
  if (await mcq.isVisible().catch(() => false)) {
    const fruit = page
      .getByTestId("mcq-choice")
      .filter({ hasText: "一种水果" });
    const ball = page.getByTestId("mcq-choice").filter({ hasText: "皮球" });
    const target = (await fruit.count())
      ? fruit
      : (await ball.count())
        ? ball
        : page.getByTestId("mcq-choice").first();
    await expect(target).toBeEnabled();
    await target.click();
    return;
  }

  const digit = page.getByTestId("item-digit-span");
  if (await digit.isVisible().catch(() => false)) {
    for (const d of ["1", "2", "3"]) {
      await digit.getByRole("button", { name: d, exact: true }).click();
    }
    await expect(page.getByTestId("digit-span-submit")).toBeEnabled();
    await page.getByTestId("digit-span-submit").click();
    return;
  }

  const symbol = page.getByTestId("item-symbol-search");
  if (await symbol.isVisible().catch(() => false)) {
    await page.getByTestId("symbol-count-2").click();
    await expect(page.getByTestId("symbol-search-submit")).toBeEnabled();
    await page.getByTestId("symbol-search-submit").click();
    return;
  }

  throw new Error("Unknown item type on assessment screen");
}

async function answerCurrentPracticeItem(page: Page) {
  await page.waitForFunction(() => {
    return Boolean(
      document.querySelector('[data-testid="mcq-choice"]:not([disabled])') ||
        document.querySelector('[data-testid="item-digit-span"]') ||
        document.querySelector('[data-testid="item-symbol-search"]'),
    );
  });

  if (await page.getByTestId("item-mcq").isVisible()) {
    const choice = page.getByTestId("mcq-choice").first();
    await expect(choice).toBeEnabled();
    await choice.click();
    return;
  }
  if (await page.getByTestId("item-digit-span").isVisible()) {
    await page
      .getByTestId("item-digit-span")
      .getByRole("button", { name: "1", exact: true })
      .click();
    await page.getByTestId("digit-span-submit").click();
    return;
  }
  if (await page.getByTestId("item-symbol-search").isVisible()) {
    await page.getByTestId("symbol-count-1").click();
    await page.getByTestId("symbol-search-submit").click();
    return;
  }
  throw new Error("Unknown item type on practice screen");
}

test("happy path: register → child profile → assess → report → practice", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const email = `e2e-${Date.now()}@iqtest.local`;
  const password = "password12";

  await page.goto("/legal/disclaimer");
  await expect(page.getByRole("heading", { name: "免责声明" })).toBeVisible();
  await expect(page.getByText("自研题库与常模（试运行）")).toBeVisible();
  await expect(
    page.getByRole("contentinfo").getByRole("link", { name: "免责声明" }),
  ).toBeVisible();

  await page.goto("/register?next=/profiles");
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole("button", { name: "注册并登录" }).click();
  await expect(page).toHaveURL(/\/profiles/);
  await expect(page.getByRole("heading", { name: "我的档案" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "创建第一个档案" })).toBeVisible();

  await page.locator('input[name="displayName"]').fill("E2E儿童");
  await page.locator('input[name="birthDate"]').fill(childBirthDate());
  await page.getByRole("button", { name: "创建第一个档案" }).click();
  await expect(page.getByText("E2E儿童")).toBeVisible();
  await expect(page.getByText("儿童").first()).toBeVisible();

  await page.getByRole("button", { name: "开始测评" }).click();
  await expect(page).toHaveURL(/\/assess\//);
  await expect(page.getByText("儿童短卷 fixture（e2e）")).toBeVisible();

  for (let i = 1; i <= 4; i++) {
    await waitForAssessItem(page);
    await answerCurrentAssessmentItem(page);
  }

  await expect(page.getByTestId("assess-done")).toBeVisible({ timeout: 60_000 });
  await page.getByTestId("view-report").click();
  await expect(page).toHaveURL(/\/report\//);
  await expect(page.getByRole("heading", { name: /的结果/ })).toBeVisible();
  await expect(page.getByText("试运行", { exact: true })).toBeVisible();
  await expect(page.getByText("总合成分")).toBeVisible();

  await page.getByTestId("index-card-VCI").click();
  await expect(page).toHaveURL(/\/practice\/VCI/);
  await expect(page.getByRole("heading", { name: /言语理解/ })).toBeVisible();

  await page.getByTestId("practice-start").click();
  // Practice rounds are 5 items with immediate feedback.
  for (let i = 0; i < 5; i++) {
    const done = page.getByTestId("practice-done");
    if (await done.isVisible().catch(() => false)) break;
    await answerCurrentPracticeItem(page);
  }
  await expect(page.getByTestId("practice-done")).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText("练习完成")).toBeVisible();
});
