import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { GET } from "@/app/api/auth/verify-email/route";
import { prisma } from "@/lib/db";

function req(token?: string) {
  const url = token
    ? `http://localhost/api/auth/verify-email?token=${token}`
    : "http://localhost/api/auth/verify-email";
  return new NextRequest(url);
}

const UNVERIFIED_USER = {
  id: "u1",
  email: "alice@example.com",
  emailVerified: false,
  verificationToken: "validtoken",
};

describe("GET /api/auth/verify-email", () => {
  it("returns 400 when token query param is missing", async () => {
    const res = await GET(req());
    expect(res.status).toBe(400);
  });

  it("returns 400 when token is not found in DB", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await GET(req("unknowntoken"));
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 200 and sets emailVerified=true for a valid token", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(UNVERIFIED_USER as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    const res = await GET(req("validtoken"));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { emailVerified: true, verificationToken: null },
      })
    );
  });

  it("returns 200 when email is already verified (idempotent)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...UNVERIFIED_USER,
      emailVerified: true,
    } as never);

    const res = await GET(req("validtoken"));
    expect(res.status).toBe(200);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});
