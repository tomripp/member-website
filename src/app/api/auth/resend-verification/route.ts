import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  locale: z.enum(["en", "de"]).default("en"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, locale } = schema.parse(body);

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (user && !user.emailVerified) {
      const verificationToken = generateToken();

      await prisma.user.update({
        where: { id: user.id },
        data: { verificationToken },
      });

      await sendVerificationEmail(email, verificationToken, locale);
    }

    return NextResponse.json({
      message: "If that email exists and is unverified, a new link has been sent.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    console.error("Resend verification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
