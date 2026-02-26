import { beforeEach, vi } from "vitest";

// Set required env vars for all tests
process.env.JWT_SECRET = "test-secret-at-least-32-characters-long!!";
process.env.RESEND_API_KEY = "re_test_key";
process.env.RESEND_FROM_EMAIL = "noreply@test.com";
process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";

// Clear all mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

// Suppress console.error noise from error path tests
vi.spyOn(console, "error").mockImplementation(() => {});
