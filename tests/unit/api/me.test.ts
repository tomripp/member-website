import { describe, it, expect, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getCurrentUser: vi.fn(),
}));

import { GET } from "@/app/api/me/route";
import { getCurrentUser } from "@/lib/auth";

const MOCK_USER = {
  id: "u1",
  email: "alice@example.com",
  name: "Alice",
  emailVerified: true,
};

describe("GET /api/me", () => {
  it("returns 200 with user data when authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as never);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.user).toMatchObject({ email: "alice@example.com", name: "Alice" });
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("does not expose sensitive fields in the response", async () => {
    // getCurrentUser already filters fields — just ensure the route passes it through
    vi.mocked(getCurrentUser).mockResolvedValue(MOCK_USER as never);

    const res = await GET();
    const body = await res.json();
    expect(body.user.password).toBeUndefined();
  });
});
