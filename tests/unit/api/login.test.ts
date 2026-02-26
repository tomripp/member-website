import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    session: { create: vi.fn() },
  },
}));
vi.mock("bcryptjs", () => ({
  default: { compare: vi.fn() },
}));

import { POST } from "@/app/api/auth/login/route";
import { prisma } from "@/lib/db";
import bcryptjs from "bcryptjs";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VERIFIED_USER = {
  id: "u1",
  email: "alice@example.com",
  password: "$hashed",
  name: "Alice",
  emailVerified: true,
  verificationToken: null,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("POST /api/auth/login", () => {
  it("returns 200 and sets session cookie for valid credentials", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(VERIFIED_USER);
    vi.mocked(bcryptjs.compare).mockResolvedValue(true as never);
    vi.mocked(prisma.session.create).mockResolvedValue({} as never);

    const res = await POST(req({ email: "alice@example.com", password: "Password1" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user.email).toBe("alice@example.com");
    expect(res.headers.get("set-cookie")).toMatch(/session=/);
  });

  it("returns 401 when user does not exist", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await POST(req({ email: "nobody@example.com", password: "Password1" }));
    expect(res.status).toBe(401);
  });

  it("returns 401 when password is wrong", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(VERIFIED_USER);
    vi.mocked(bcryptjs.compare).mockResolvedValue(false as never);

    const res = await POST(req({ email: "alice@example.com", password: "wrong" }));
    expect(res.status).toBe(401);
  });

  it("returns 403 when email is not verified", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...VERIFIED_USER,
      emailVerified: false,
    });

    const res = await POST(req({ email: "alice@example.com", password: "Password1" }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toMatch(/verify/i);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(req({ email: "bad-email", password: "Password1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for empty password", async () => {
    const res = await POST(req({ email: "alice@example.com", password: "" }));
    expect(res.status).toBe(400);
  });
});
