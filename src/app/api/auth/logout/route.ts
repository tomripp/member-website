import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyJwt, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const jwt = request.cookies.get(COOKIE_NAME)?.value;

  if (jwt) {
    const payload = await verifyJwt(jwt);
    if (payload?.sessionToken) {
      await prisma.session
        .delete({ where: { token: payload.sessionToken } })
        .catch(() => {
          // ignore if already deleted
        });
    }
  }

  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });

  return response;
}
