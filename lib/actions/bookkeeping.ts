"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import {
  accounts,
  journalEntries,
  journalEntryLines,
} from "@/lib/db/schema";
import { ledgerFilterSchema } from "@/lib/validations/appointments";
import { and, asc, count, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { UserRole } from "@/lib/db/schema";

export type LedgerLine = {
  id: string;
  entryDate: string;
  entryNumber: string;
  description: string;
  referenceType: string;
  accountCode: string;
  accountName: string;
  entryType: "debit" | "credit";
  amount: number;
  lineDescription: string | null;
};

async function requireFinanceAccess() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const role = session.user.role as UserRole;
  if (role !== "owner" && role !== "accountant") {
    throw new Error("Forbidden");
  }
  return session;
}

export async function getAccounts() {
  await requireFinanceAccess();
  return db.query.accounts.findMany({
    where: eq(accounts.isActive, 1),
    orderBy: [asc(accounts.code)],
  });
}

export async function getLedger(input: unknown = {}) {
  await requireFinanceAccess();

  const parsed = ledgerFilterSchema.safeParse(input);
  const { from, to, accountId, page, limit } = parsed.success
    ? parsed.data
    : { from: undefined, to: undefined, accountId: undefined, page: 1, limit: 30 };

  const conditions = [];
  if (from) conditions.push(gte(journalEntries.entryDate, from));
  if (to) conditions.push(lte(journalEntries.entryDate, to));
  if (accountId) conditions.push(eq(journalEntryLines.accountId, accountId));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * limit;

  const [rows, totalResult] = await Promise.all([
    db
      .select({
        id: journalEntryLines.id,
        entryDate: journalEntries.entryDate,
        entryNumber: journalEntries.entryNumber,
        description: journalEntries.description,
        referenceType: journalEntries.referenceType,
        accountCode: accounts.code,
        accountName: accounts.name,
        entryType: journalEntryLines.entryType,
        amount: journalEntryLines.amount,
        lineDescription: journalEntryLines.description,
      })
      .from(journalEntryLines)
      .innerJoin(
        journalEntries,
        eq(journalEntryLines.journalEntryId, journalEntries.id),
      )
      .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
      .where(whereClause)
      .orderBy(desc(journalEntries.entryDate), desc(journalEntries.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ value: count() })
      .from(journalEntryLines)
      .innerJoin(
        journalEntries,
        eq(journalEntryLines.journalEntryId, journalEntries.id),
      )
      .where(whereClause),
  ]);

  const total = totalResult[0]?.value ?? 0;

  return {
    lines: rows as LedgerLine[],
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getAccountSummary() {
  await requireFinanceAccess();

  const rows = await db
    .select({
      id: accounts.id,
      code: accounts.code,
      name: accounts.name,
      type: accounts.type,
      debitTotal: sql<number>`coalesce(sum(case when ${journalEntryLines.entryType} = 'debit' then ${journalEntryLines.amount} else 0 end), 0)`,
      creditTotal: sql<number>`coalesce(sum(case when ${journalEntryLines.entryType} = 'credit' then ${journalEntryLines.amount} else 0 end), 0)`,
    })
    .from(accounts)
    .leftJoin(journalEntryLines, eq(journalEntryLines.accountId, accounts.id))
    .where(eq(accounts.isActive, 1))
    .groupBy(accounts.id)
    .orderBy(asc(accounts.code));

  return rows.map((row) => ({
    ...row,
    balance:
      row.type === "asset" || row.type === "cogs" || row.type === "expense"
        ? row.debitTotal - row.creditTotal
        : row.creditTotal - row.debitTotal,
  }));
}
