import { expect, test, type Page } from "@playwright/test";

function childBirthDate(): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

async function waitForAssessProgress(page: Page, n: number) {
  await expect(page.getByText(`进度 ${n} / 4`)).toBeVisible();
}

async function answerCurrentAssessmentItem(page: Page) {
  // Wait until a non-disabled item surface is interactive (post-submit unlock).
  await page.waitForFunction(() => {
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

  if (await page.getByTestId("item-mcq").isVisible()) {
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

  if (await page.getByTestId("item-digit-span").isVisible()) {
    for (const d of ["1", "2", "3"]) {
      await page
        .getByTestId("item-digit-span")
        .getByRole("button", { name: d, exact: true })
        .click();
    }
    await expect(page.getByTestId("digit-span-submit")).toBeEnabled();
    await page.getByTestId("digit-span-submit").click();
    return;
  }

  if (await page.getByTestId("item-symbol-search").isVisible()) {
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
  await expect(page.getByRole("heading", { name: "我的测评档案" })).toBeVisible();

  await page.locator('input[name="displayName"]').fill("E2E儿童");
  await page.locator('input[name="birthDate"]').fill(childBirthDate());
  await page.getByRole("button", { name: "保存档案" }).click();
  await expect(page.getByText("E2E儿童")).toBeVisible();
  await expect(page.getByText(/CHILD/)).toBeVisible();

  await page.getByRole("button", { name: "开始测评" }).click();
  await expect(page).toHaveURL(/\/assess\//);
  await expect(page.getByText("儿童短卷 fixture（e2e）")).toBeVisible();

  for (let i = 1; i <= 4; i++) {
    await waitForAssessProgress(page, i);
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
  await answerCurrentPracticeItem(page);
  await expect(page.getByTestId("practice-done")).toBeVisible({
    timeout: 60_000,
  });
  await expect(page.getByText("练习完成")).toBeVisible();
});
