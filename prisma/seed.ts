import { config } from "dotenv";
config({ path: ".env.local" }); // load local env vars

import { PrismaClient } from "@prisma/client";
import bcryptjs from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcryptjs.hash("TestPassword123!", 12);

  const user = await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: { password, emailVerified: true, name: "Test User" },
    create: {
      email: "test@example.com",
      name: "Test User",
      password,
      emailVerified: true,
    },
  });

  console.log(`✓ Seeded test user: ${user.email}`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
