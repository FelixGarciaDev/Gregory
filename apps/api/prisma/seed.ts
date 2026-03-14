import { PrismaClient, UserRole } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derivedKey}`;
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@gregory.app";
  const password = process.env.SEED_ADMIN_PASS;

  if (!password) {
    throw new Error("SEED_ADMIN_PASS is required to seed the admin user.");
  }

  const passwordHash = hashPassword(password);

  await prisma.user.upsert({
    where: { email },
    update: {
      fullName: "Gregory Admin",
      role: UserRole.admin,
      isActive: true,
      passwordHash
    },
    create: {
      email,
      fullName: "Gregory Admin",
      role: UserRole.admin,
      isActive: true,
      passwordHash
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
