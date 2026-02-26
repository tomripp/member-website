import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    session: { deleteMany: vi.fn() },
  },
}));
vi.mock("bcryptjs", () => ({
  default: { hash: vi.fn().mockResolvedValue("$newhashed") },
}));

import { POST } from "@/app/api/auth/reset-password/route";
import { prisma } from "@/lib/db";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const FUTURE = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
const PAST = new Date(Date.now() - 60 * 60 * 1000);  // 1 hour ago

const USER_WITH_VALID_TOKEN = {
  id: "u1",
  email: "alice@example.com",
  resetToken: "validresettoken",
  resetTokenExpiry: FUTURE,
};

describe("POST /api/auth/reset-password", () => {
  it("returns 200 and resets password for a valid token", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(USER_WITH_VALID_TOKEN as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 0 });

    const res = await POST(req({ token: "validresettoken", password: "NewPass1!" }));
    expect(res.status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          emailVerified: true,
          resetToken: null,
          resetTokenExpiry: null,
        }),
      })
    );
  });

  it("invalidates all existing sessions after password reset", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(USER_WITH_VALID_TOKEN as never);
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);
    vi.mocked(prisma.session.deleteMany).mockResolvedValue({ count: 2 });

    await POST(req({ token: "validresettoken", password: "NewPass1!" }));
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  it("returns 400 when token is not found", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await POST(req({ token: "badtoken", password: "NewPass1!" }));
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 when token has expired", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...USER_WITH_VALID_TOKEN,
      resetTokenExpiry: PAST,
    } as never);

    const res = await POST(req({ token: "validresettoken", password: "NewPass1!" }));
    expect(res.status).toBe(400);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid input (password too short)", async () => {
    const res = await POST(req({ token: "tok", password: "short" }));
    expect(res.status).toBe(400);
  });
});
