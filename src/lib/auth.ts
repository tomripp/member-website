import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";

const getJwtSecret = () =>
  new TextEncoder().encode(process.env.JWT_SECRET!);

const COOKIE_NAME = "session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function createSession(userId: string): Promise<string> {
  const sessionToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await prisma.session.create({
    data: { userId, token: sessionToken, expiresAt },
  });

  const jwt = await new SignJWT({ sub: userId, sessionToken })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(getJwtSecret());

  return jwt;
}

export async function verifyJwt(
  token: string
): Promise<{ userId: string; sessionToken: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return {
      userId: payload.sub!,
      sessionToken: payload.sessionToken as string,
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const jwt = cookieStore.get(COOKIE_NAME)?.value;
  if (!jwt) return null;

  const payload = await verifyJwt(jwt);
  if (!payload) return null;

  const session = await prisma.session.findUnique({
    where: { token: payload.sessionToken },
    include: {
      user: {
        select: { id: true, email: true, name: true, emailVerified: true },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) return null;

  return session.user;
}

export function sessionCookieOptions(maxAge = SESSION_DURATION_SECONDS) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

export { COOKIE_NAME };
