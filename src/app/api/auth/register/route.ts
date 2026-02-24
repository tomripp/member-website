import { NextRequest, NextResponse } from "next/server";
import bcryptjs from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2).max(50),
  locale: z.enum(["en", "de"]).default("en"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, locale } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered." },
        { status: 400 }
      );
    }

    const hashedPassword = await bcryptjs.hash(password, 12);
    const verificationToken = generateToken();

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        verificationToken,
      },
    });

    await sendVerificationEmail(email, verificationToken, locale);

    return NextResponse.json(
      { message: "Registration successful. Please check your email." },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
