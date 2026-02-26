import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));
vi.mock("@/lib/email", () => ({ sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/tokens", () => ({ generateToken: vi.fn().mockReturnValue("b".repeat(64)) }));

import { POST } from "@/app/api/auth/forgot-password/route";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const EXISTING_USER = { id: "u1", email: "alice@example.com" };

describe("POST /api/auth/forgot-password", () => {
  it("returns 200 and sends reset email when user exists", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(EXISTING_USER as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const res = await POST(req({ email: "alice@example.com" }));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledOnce();
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      "alice@example.com",
      expect.any(String),
      expect.any(String)
    );
  });

  it("returns 200 even when email does not exist (no enumeration)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await POST(req({ email: "nobody@example.com" }));
    expect(res.status).toBe(200);
    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(req({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("stores a resetToken and expiry on the user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(EXISTING_USER as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    await POST(req({ email: "alice@example.com" }));
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resetToken: expect.any(String),
          resetTokenExpiry: expect.any(Date),
        }),
      })
    );
  });
});
