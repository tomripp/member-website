import { describe, it, expect, vi } from "vitest";
import { NextRequest } from "next/server";
import { SignJWT } from "jose";

vi.mock("@/lib/db", () => ({
  prisma: {
    session: { delete: vi.fn().mockResolvedValue(undefined) },
  },
}));

import { POST } from "@/app/api/auth/logout/route";
import { prisma } from "@/lib/db";

const SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

async function makeJwt(sessionToken: string) {
  return new SignJWT({ sub: "u1", sessionToken })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

function req(cookie?: string) {
  return new NextRequest("http://localhost/api/auth/logout", {
    method: "POST",
    headers: cookie ? { Cookie: `session=${cookie}` } : {},
  });
}

describe("POST /api/auth/logout", () => {
  it("deletes the session from DB when a valid cookie is present", async () => {
    const jwt = await makeJwt("sess-tok-abc");
    const res = await POST(req(jwt));

    expect(res.status).toBe(200);
    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { token: "sess-tok-abc" },
    });
  });

  it("clears the session cookie in the response", async () => {
    const jwt = await makeJwt("sess-tok");
    const res = await POST(req(jwt));

    const setCookie = res.headers.get("set-cookie") ?? "";
    expect(setCookie).toMatch(/session=;/);
    expect(setCookie).toMatch(/Max-Age=0/i);
  });

  it("returns 200 even when no cookie is present", async () => {
    const res = await POST(req());
    expect(res.status).toBe(200);
    expect(prisma.session.delete).not.toHaveBeenCalled();
  });

  it("returns 200 gracefully when the JWT is invalid", async () => {
    const res = await POST(req("garbage.jwt.value"));
    expect(res.status).toBe(200);
    expect(prisma.session.delete).not.toHaveBeenCalled();
  });
});
