import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/db", () => ({
  prisma: {
    user: { findUnique: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/email", () => ({ sendVerificationEmail: vi.fn().mockResolvedValue(undefined) }));
vi.mock("@/lib/tokens", () => ({ generateToken: vi.fn().mockReturnValue("a".repeat(64)) }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("$hashed") } }));

import { POST } from "@/app/api/auth/register/route";
import { prisma } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";

function req(body: unknown) {
  return new NextRequest("http://localhost/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID = { email: "new@example.com", password: "Password1", name: "Alice", locale: "en" };

describe("POST /api/auth/register", () => {
  it("returns 201 and sends verification email on valid input", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({} as never);

    const res = await POST(req(VALID));
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.message).toMatch(/check your email/i);
    expect(prisma.user.create).toHaveBeenCalledOnce();
    expect(sendVerificationEmail).toHaveBeenCalledWith("new@example.com", expect.any(String), "en");
  });

  it("returns 400 when email is already registered", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "x" } as never);

    const res = await POST(req(VALID));
    expect(res.status).toBe(400);
    expect(prisma.user.create).not.toHaveBeenCalled();
    expect(sendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns 400 for invalid email format", async () => {
    const res = await POST(req({ ...VALID, email: "not-an-email" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when password is shorter than 8 characters", async () => {
    const res = await POST(req({ ...VALID, password: "short" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when name is shorter than 2 characters", async () => {
    const res = await POST(req({ ...VALID, name: "A" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when locale is invalid", async () => {
    const res = await POST(req({ ...VALID, locale: "fr" }));
    expect(res.status).toBe(400);
  });

  it("sends email with German locale when locale is 'de'", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    vi.mocked(prisma.user.create).mockResolvedValue({} as never);

    await POST(req({ ...VALID, locale: "de" }));
    expect(sendVerificationEmail).toHaveBeenCalledWith(expect.any(String), expect.any(String), "de");
  });
});
