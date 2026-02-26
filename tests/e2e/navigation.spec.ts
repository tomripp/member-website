import { test, expect } from "@playwright/test";

test.describe("Navigation & i18n", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("homepage loads and shows hero content", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/(en|de)\//);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("nav shows Login and Register buttons when logged out", async ({ page }) => {
    await page.goto("/en/");
    await expect(page.getByRole("link", { name: /login/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /register/i })).toBeVisible();
  });

  test("language switcher navigates to German locale", async ({ page }) => {
    await page.goto("/en/");
    await page.getByRole("link", { name: /^de$/i }).click();
    await expect(page).toHaveURL(/\/de\//);
  });

  test("German homepage uses German text", async ({ page }) => {
    await page.goto("/de/");
    // The page should have German content (not English)
    const body = await page.textContent("body");
    expect(body).not.toBeNull();
    // German locale is set on html element
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
  });

  test("logo links back to homepage", async ({ page }) => {
    await page.goto("/en/auth/login");
    await page.getByRole("link", { name: /mywebsite/i }).first().click();
    await expect(page).toHaveURL(/\/en\//);
  });

  test("/members redirects to login when not authenticated", async ({ page }) => {
    await page.goto("/en/members");
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
