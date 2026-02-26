import { test, expect } from "@playwright/test";

const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "TestPassword123!";

async function login(page: import("@playwright/test").Page) {
  await page.context().clearCookies();
  await page.goto("/en/auth/login");
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /log in|sign in/i }).click();
  await page.waitForURL(/\/members/, { timeout: 10_000 });
}

test.describe("Members page", () => {
  test("unauthenticated request is redirected to /auth/login", async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/en/members");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("authenticated user can access /members", async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/en\/members/);
    await expect(page.locator("h1")).toBeVisible();
  });

  test("welcome banner shows the logged-in user's name", async ({ page }) => {
    await login(page);
    // WelcomeBanner client component fetches /api/me — give it a moment
    await expect(page.locator("h1")).toContainText(/test user|test@example/i, { timeout: 5_000 });
  });

  test("members page shows content cards", async ({ page }) => {
    await login(page);
    await expect(page.locator("[data-slot='card']").first()).toBeVisible();
  });

  test("German locale members page loads", async ({ page }) => {
    await page.context().clearCookies();
    // Login via English, then switch locale
    await login(page);
    await page.goto("/de/members");
    await expect(page).toHaveURL(/\/de\/members/);
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
  });
});
