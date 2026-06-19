import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "../lib/db";
import { accounts, categories, services, users } from "../lib/db/schema";
import {
  CHART_OF_ACCOUNTS,
  DEFAULT_CATEGORIES,
} from "../lib/constants/accounts";
import { DEFAULT_SERVICES } from "../lib/constants/business";
import { nowIso, nairaToKobo } from "../lib/utils";

async function seed() {
  const now = nowIso();
  const ownerEmail = (process.env.SEED_OWNER_EMAIL ?? "owner@tamsbeautyhub.com").toLowerCase();
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "changeme123";

  const existingOwner = await db.query.users.findFirst({
    where: eq(users.email, ownerEmail),
  });

  if (!existingOwner) {
    const passwordHash = await bcrypt.hash(ownerPassword, 12);
    await db.insert(users).values({
      id: crypto.randomUUID(),
      email: ownerEmail,
      passwordHash,
      name: "Tams Owner",
      role: "owner",
      isActive: 1,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`Created owner user: ${ownerEmail}`);
  } else {
    console.log(`Owner user already exists: ${ownerEmail}`);
  }

  for (const account of CHART_OF_ACCOUNTS) {
    const existing = await db.query.accounts.findFirst({
      where: eq(accounts.code, account.code),
    });
    if (!existing) {
      await db.insert(accounts).values({
        id: crypto.randomUUID(),
        code: account.code,
        name: account.name,
        type: account.type,
        normalBalance: account.normalBalance,
        balance: 0,
        isActive: 1,
        createdAt: now,
      });
    }
  }
  console.log("Chart of accounts seeded.");

  for (const category of DEFAULT_CATEGORIES) {
    const existing = await db.query.categories.findFirst({
      where: eq(categories.name, category.name),
    });
    if (!existing) {
      await db.insert(categories).values({
        id: crypto.randomUUID(),
        name: category.name,
        businessUnit: category.businessUnit,
        createdAt: now,
      });
    }
  }
  console.log("Default categories seeded.");

  for (const service of DEFAULT_SERVICES) {
    const existing = await db.query.services.findFirst({
      where: eq(services.name, service.name),
    });
    if (!existing) {
      await db.insert(services).values({
        id: crypto.randomUUID(),
        name: service.name,
        durationMinutes: service.durationMinutes,
        price: nairaToKobo(service.priceNaira),
        materialsConsumed: service.materialsConsumed,
        isActive: 1,
        createdAt: now,
      });
    }
  }
  console.log("Default nail services seeded.");
  console.log("\nSeed complete. Default owner password:", ownerPassword);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
