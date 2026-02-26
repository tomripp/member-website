import { describe, it, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";

vi.mock("@/lib/db", () => ({
  prisma: {
    session: {
      create: vi.fn(),
    },
  },
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { verifyJwt, sessionCookieOptions, createSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const SECRET = process.env.JWT_SECRET!;

function makeJwt(claims: object, expiresIn = "7d") {
  return new SignJWT(claims as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(new TextEncoder().encode(SECRET));
}

// ─── verifyJwt ────────────────────────────────────────────────────────────────

describe("verifyJwt", () => {
  it("returns userId + sessionToken for a valid JWT", async () => {
    const jwt = await makeJwt({ sub: "user-1", sessionToken: "tok-abc" });
    const result = await verifyJwt(jwt);
    expect(result).toEqual({ userId: "user-1", sessionToken: "tok-abc" });
  });

  it("returns null for a garbage token", async () => {
    expect(await verifyJwt("not.a.jwt")).toBeNull();
  });

  it("returns null for an expired JWT", async () => {
    const jwt = await makeJwt({ sub: "user-1", sessionToken: "tok" }, "-1s");
    expect(await verifyJwt(jwt)).toBeNull();
  });

  it("returns null when signed with wrong secret", async () => {
    const jwt = await new SignJWT({ sub: "user-1", sessionToken: "tok" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .sign(new TextEncoder().encode("wrong-secret-that-is-long-enough!!"));
    expect(await verifyJwt(jwt)).toBeNull();
  });
});

// ─── sessionCookieOptions ─────────────────────────────────────────────────────

describe("sessionCookieOptions", () => {
  it("returns httpOnly + sameSite lax + path /", () => {
    const opts = sessionCookieOptions();
    expect(opts).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/" });
  });

  it("defaults maxAge to 7 days", () => {
    const opts = sessionCookieOptions();
    expect(opts.maxAge).toBe(60 * 60 * 24 * 7);
  });

  it("accepts a custom maxAge", () => {
    expect(sessionCookieOptions(3600).maxAge).toBe(3600);
  });

  it("secure is false outside production", () => {
    // NODE_ENV is 'test' in setup.ts
    expect(sessionCookieOptions().secure).toBe(false);
  });
});

// ─── createSession ────────────────────────────────────────────────────────────

describe("createSession", () => {
  beforeEach(() => {
    vi.mocked(prisma.session.create).mockResolvedValue({
      id: "sess-1",
      userId: "user-1",
      token: "any",
      expiresAt: new Date(),
      createdAt: new Date(),
    });
  });

  it("creates a session row in the DB", async () => {
    await createSession("user-1");
    expect(prisma.session.create).toHaveBeenCalledOnce();
    expect(prisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ userId: "user-1" }) })
    );
  });

  it("returns a valid JWT containing the userId", async () => {
    const jwt = await createSession("user-1");
    const payload = await verifyJwt(jwt);
    expect(payload?.userId).toBe("user-1");
  });
});
