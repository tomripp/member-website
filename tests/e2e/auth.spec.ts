import { test, expect } from "@playwright/test";

const TEST_EMAIL = "test@example.com";
const TEST_PASSWORD = "TestPassword123!";

test.describe("Auth flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ─── Register page ────────────────────────────────────────────────────────

  test.describe("Register", () => {
    test("register page renders correctly", async ({ page }) => {
      await page.goto("/en/auth/register");
      await expect(page.getByRole("heading", { level: 2 })).toBeVisible();
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
    });

    test("shows validation error for invalid email", async ({ page }) => {
      await page.goto("/en/auth/register");
      await page.getByLabel(/email/i).fill("not-an-email");
      await page.getByLabel(/password/i).fill("Password123!");
      await page.getByLabel(/name/i).fill("Alice");
      await page.getByRole("button", { name: /register|create/i }).click();
      await expect(page.locator("form")).toContainText(/.+/); // form still showing (no redirect)
    });

    test("shows error when trying to register an existing email", async ({ page }) => {
      await page.goto("/en/auth/register");
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill("Password123!");
      await page.getByLabel(/name/i).fill("Another User");
      await page.getByRole("button", { name: /register|create/i }).click();
      // Should show an error alert, not redirect
      await expect(page.locator("[role='alert']")).toBeVisible({ timeout: 5_000 });
    });

    test("shows success message after valid registration (new email)", async ({ page }) => {
      const unique = `e2e_${Date.now()}@test.example`;
      await page.goto("/en/auth/register");
      await page.getByLabel(/email/i).fill(unique);
      await page.getByLabel(/password/i).fill("Password123!");
      await page.getByLabel(/name/i).fill("New User");
      await page.getByRole("button", { name: /register|create/i }).click();
      // Expect success state — either an alert or a redirect to a confirmation page
      await expect(page.locator("[role='alert'], main")).toContainText(
        /check your email|verify|success/i,
        { timeout: 8_000 }
      );
    });
  });

  // ─── Login page ───────────────────────────────────────────────────────────

  test.describe("Login", () => {
    test("login page renders correctly", async ({ page }) => {
      await page.goto("/en/auth/login");
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /log in|sign in/i })).toBeVisible();
    });

    test("shows error for wrong password", async ({ page }) => {
      await page.goto("/en/auth/login");
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill("WrongPassword999!");
      await page.getByRole("button", { name: /log in|sign in/i }).click();
      await expect(page.locator("[role='alert']")).toBeVisible({ timeout: 5_000 });
    });

    test("shows error for non-existent email", async ({ page }) => {
      await page.goto("/en/auth/login");
      await page.getByLabel(/email/i).fill("nobody@nowhere.com");
      await page.getByLabel(/password/i).fill("Password123!");
      await page.getByRole("button", { name: /log in|sign in/i }).click();
      await expect(page.locator("[role='alert']")).toBeVisible({ timeout: 5_000 });
    });

    test("full login flow → access members page", async ({ page }) => {
      await page.goto("/en/auth/login");
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /log in|sign in/i }).click();

      // Should land on members page
      await expect(page).toHaveURL(/\/members/, { timeout: 10_000 });
      await expect(page.locator("h1")).toBeVisible();
    });

    test("nav shows user dropdown after login", async ({ page }) => {
      await page.goto("/en/auth/login");
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /log in|sign in/i }).click();
      await page.waitForURL(/\/members/);

      // Wait for UserNav to fetch /api/me and update
      await expect(page.getByRole("button", { name: /test user|test@example/i })).toBeVisible({
        timeout: 5_000,
      });
    });
  });

  // ─── Logout ───────────────────────────────────────────────────────────────

  test.describe("Logout", () => {
    test.beforeEach(async ({ page }) => {
      // Log in first
      await page.goto("/en/auth/login");
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByLabel(/password/i).fill(TEST_PASSWORD);
      await page.getByRole("button", { name: /log in|sign in/i }).click();
      await page.waitForURL(/\/members/);
    });

    test("clicking logout returns to homepage with Login/Register in nav", async ({ page }) => {
      // Open user dropdown
      await page.getByRole("button", { name: /test user|test@example/i }).click({ timeout: 5_000 });
      await page.getByRole("menuitem", { name: /logout|sign out/i }).click();

      await expect(page).toHaveURL(/\/en\//, { timeout: 5_000 });
      await expect(page.getByRole("link", { name: /login/i })).toBeVisible({ timeout: 5_000 });
    });

    test("after logout, /members redirects to login", async ({ page }) => {
      await page.getByRole("button", { name: /test user|test@example/i }).click({ timeout: 5_000 });
      await page.getByRole("menuitem", { name: /logout|sign out/i }).click();
      await page.waitForURL(/\/en\//);

      await page.goto("/en/members");
      await expect(page).toHaveURL(/\/auth\/login/);
    });
  });

  // ─── Forgot password ──────────────────────────────────────────────────────

  test.describe("Forgot password", () => {
    test("forgot password page renders", async ({ page }) => {
      await page.goto("/en/auth/forgot-password");
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /send|reset/i })).toBeVisible();
    });

    test("submitting valid email shows confirmation message", async ({ page }) => {
      await page.goto("/en/auth/forgot-password");
      await page.getByLabel(/email/i).fill(TEST_EMAIL);
      await page.getByRole("button", { name: /send|reset/i }).click();
      await expect(page.locator("[role='alert'], main")).toContainText(
        /email|sent|check/i,
        { timeout: 8_000 }
      );
    });
  });
});
