import { execSync } from "child_process";
import { resolve } from "path";

export default async function globalSetup() {
  console.log("\n[E2E] Seeding test database...");
  try {
    execSync("npx prisma db seed", {
      cwd: resolve(__dirname, "../.."),
      stdio: "inherit",
      timeout: 30_000,
    });
  } catch (err) {
    console.error("[E2E] Seed failed — continuing anyway:", err);
  }
}
