import { describe, it, expect, vi, beforeEach } from "vitest";

// vi.hoisted() runs in the same hoisted context as vi.mock(), so mockSend
// is defined before the factory runs and can be referenced inside it.
const mockSend = vi.hoisted(() =>
  vi.fn().mockResolvedValue({ data: { id: "email-1" }, error: null })
);

vi.mock("resend", () => ({
  // Regular function (not arrow) so it works as a `new` constructor
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

import { sendVerificationEmail, sendPasswordResetEmail } from "@/lib/email";

beforeEach(() => {
  process.env.NEXT_PUBLIC_BASE_URL = "http://localhost:3000";
});

// ─── sendVerificationEmail ────────────────────────────────────────────────────

describe("sendVerificationEmail", () => {
  it("sends to the correct recipient", async () => {
    await sendVerificationEmail("user@example.com", "tok123", "en");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ to: "user@example.com" })
    );
  });

  it("uses English subject for locale 'en'", async () => {
    await sendVerificationEmail("user@example.com", "tok", "en");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Verify your email address" })
    );
  });

  it("uses German subject for locale 'de'", async () => {
    await sendVerificationEmail("user@example.com", "tok", "de");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "E-Mail-Adresse bestätigen" })
    );
  });

  it("includes the verification URL with the token in the HTML body", async () => {
    // BASE_URL is a module-level constant (captured at import), so we test
    // against the default set in setup.ts
    await sendVerificationEmail("user@example.com", "mytoken", "en");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("/en/auth/verify-email?token=mytoken"),
      })
    );
  });

  it("defaults to English when no locale is given", async () => {
    await sendVerificationEmail("user@example.com", "tok");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Verify your email address" })
    );
  });
});

// ─── sendPasswordResetEmail ───────────────────────────────────────────────────

describe("sendPasswordResetEmail", () => {
  it("uses English subject for locale 'en'", async () => {
    await sendPasswordResetEmail("user@example.com", "tok", "en");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Reset your password" })
    );
  });

  it("uses German subject for locale 'de'", async () => {
    await sendPasswordResetEmail("user@example.com", "tok", "de");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({ subject: "Passwort zurücksetzen" })
    );
  });

  it("includes the reset URL with the token in the HTML body", async () => {
    await sendPasswordResetEmail("user@example.com", "reset-tok", "en");
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        html: expect.stringContaining("/en/auth/reset-password?token=reset-tok"),
      })
    );
  });
});
