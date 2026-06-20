"use server";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { createExportJob } from "@/lib/actions/exports";
import { financeDateRangeSchema, exportStatementSchema } from "@/lib/validations/finance";
import { accounts, journalEntries, journalEntryLines } from "@/lib/db/schema";
import { ACCOUNT_CODES } from "@/lib/accounting/accounts";
import { and, asc, eq, gte, inArray, lte, sql } from "drizzle-orm";

async function requireFinanceAccess() {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }
  const role = session.user.role;
  if (role !== "owner" && role !== "accountant") {
    throw new Error("Forbidden");
  }
  return session;
}

function normalizeAccountBalance(type: string, debitTotal: number, creditTotal: number) {
  if (type === "asset" || type === "cogs" || type === "expense") {
    return debitTotal - creditTotal;
  }
  return creditTotal - debitTotal;
}

function buildStatementRow(row: {
  id: string;
  code: string;
  name: string;
  type: string;
  debitTotal: number;
  creditTotal: number;
}) {
  return {
    id: row.id,
    code: row.code,
    name: row.name,
    type: row.type,
    debitTotal: row.debitTotal,
    creditTotal: row.creditTotal,
    balance: normalizeAccountBalance(row.type, row.debitTotal, row.creditTotal),
  };
}

async function getAccountBalances(from?: string, to?: string) {
  const conditions: Array<ReturnType<typeof gte> | ReturnType<typeof lte>> = [];
  if (from) conditions.push(gte(journalEntries.entryDate, from));
  if (to) conditions.push(lte(journalEntries.entryDate, to));

  const whereClause = conditions.length ? and(...conditions) : undefined;

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
    .leftJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(whereClause)
    .groupBy(accounts.id)
    .orderBy(asc(accounts.code));

  return rows.map(buildStatementRow);
}

export async function computePnL(input: unknown) {
  await requireFinanceAccess();

  const parsed = financeDateRangeSchema.safeParse(input);
  const { from, to, compareFrom, compareTo } = parsed.success
    ? parsed.data
    : { from: undefined, to: undefined, compareFrom: undefined, compareTo: undefined };

  const rows = await getAccountBalances(from, to);
  const revenue = rows.filter((row) => row.type === "income");
  const cogs = rows.filter((row) => row.type === "cogs");
  const expenses = rows.filter((row) => row.type === "expense");

  const revenueTotal = revenue.reduce((sum, row) => sum + row.balance, 0);
  const cogsTotal = cogs.reduce((sum, row) => sum + row.balance, 0);
  const expensesTotal = expenses.reduce((sum, row) => sum + row.balance, 0);
  const grossProfit = revenueTotal - cogsTotal;
  const netProfit = grossProfit - expensesTotal;

  const result: {
    revenue: typeof revenue;
    cogs: typeof cogs;
    expenses: typeof expenses;
    revenueTotal: number;
    cogsTotal: number;
    expensesTotal: number;
    grossProfit: number;
    netProfit: number;
    comparison?: {
      revenueTotal: number;
      cogsTotal: number;
      expensesTotal: number;
      grossProfit: number;
      netProfit: number;
    };
  } = {
    revenue,
    cogs,
    expenses,
    revenueTotal,
    cogsTotal,
    expensesTotal,
    grossProfit,
    netProfit,
  };

  if (compareFrom && compareTo) {
    const comparisonRows = await getAccountBalances(compareFrom, compareTo);
    const comparisonRevenue = comparisonRows.filter((row) => row.type === "income");
    const comparisonCogs = comparisonRows.filter((row) => row.type === "cogs");
    const comparisonExpenses = comparisonRows.filter((row) => row.type === "expense");
    const comparisonRevenueTotal = comparisonRevenue.reduce((sum, row) => sum + row.balance, 0);
    const comparisonCogsTotal = comparisonCogs.reduce((sum, row) => sum + row.balance, 0);
    const comparisonExpensesTotal = comparisonExpenses.reduce((sum, row) => sum + row.balance, 0);
    const comparisonGrossProfit = comparisonRevenueTotal - comparisonCogsTotal;
    const comparisonNetProfit = comparisonGrossProfit - comparisonExpensesTotal;

    result.comparison = {
      revenueTotal: comparisonRevenueTotal,
      cogsTotal: comparisonCogsTotal,
      expensesTotal: comparisonExpensesTotal,
      grossProfit: comparisonGrossProfit,
      netProfit: comparisonNetProfit,
    };
  }

  return result;
}

export async function computeBalanceSheet(input: unknown) {
  await requireFinanceAccess();

  const parsed = financeDateRangeSchema.safeParse(input);
  const date = parsed.success ? parsed.data.date : undefined;

  const conditions: Array<ReturnType<typeof lte>> = [];
  if (date) {
    conditions.push(lte(journalEntries.entryDate, date));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;

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
    .leftJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .where(whereClause ? and(eq(accounts.isActive, 1), whereClause) : eq(accounts.isActive, 1))
    .groupBy(accounts.id)
    .orderBy(asc(accounts.code));

  const assets = rows
    .filter((row) => row.type === "asset")
    .map(buildStatementRow);
  const liabilities = rows
    .filter((row) => row.type === "liability")
    .map(buildStatementRow);
  const equity = rows
    .filter((row) => row.type === "equity")
    .map(buildStatementRow);

  const assetsTotal = assets.reduce((sum, row) => sum + row.balance, 0);
  const liabilitiesTotal = liabilities.reduce((sum, row) => sum + row.balance, 0);
  const equityTotal = equity.reduce((sum, row) => sum + row.balance, 0);

  const balanced = assetsTotal === liabilitiesTotal + equityTotal;
  if (!balanced) {
    throw new Error("Balance sheet does not balance for the selected date range");
  }

  return {
    assets,
    liabilities,
    equity,
    assetsTotal,
    liabilitiesTotal,
    equityTotal,
    balanced,
  };
}

export async function computeCashFlow(input: unknown) {
  await requireFinanceAccess();

  const parsed = financeDateRangeSchema.safeParse(input);
  const { from, to } = parsed.success
    ? parsed.data
    : { from: undefined, to: undefined };

  const conditions: Array<ReturnType<typeof inArray> | ReturnType<typeof gte> | ReturnType<typeof lte>> = [inArray(accounts.code, [ACCOUNT_CODES.CASH, ACCOUNT_CODES.BANK])];
  if (from) conditions.push(gte(journalEntries.entryDate, from));
  if (to) conditions.push(lte(journalEntries.entryDate, to));

  const rows = await db
    .select({
      entryType: journalEntryLines.entryType,
      amount: journalEntryLines.amount,
      referenceType: journalEntries.referenceType,
      description: journalEntries.description,
      accountCode: accounts.code,
      accountName: accounts.name,
    })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
    .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id))
    .where(and(...conditions))
    .orderBy(asc(journalEntries.entryDate));

  const cashMovements = rows.map((row) => {
    const signedAmount = row.entryType === "debit" ? row.amount : -row.amount;
    return {
      ...row,
      amount: signedAmount,
    };
  });

  const operating = cashMovements.reduce((sum, row) => {
    if (row.referenceType === "sale" || row.referenceType === "expense" || row.referenceType === "adjustment") {
      return sum + row.amount;
    }
    return sum;
  }, 0);

  const investing = 0;
  const financing = 0;
  const netCash = operating + investing + financing;

  return {
    operating,
    investing,
    financing,
    netCash,
    cashMovements,
  };
}

export async function exportStatement(input: unknown) {
  await requireFinanceAccess();

  const parsed = exportStatementSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid export parameters");
  }

  const { type, from, to, statement } = parsed.data;
  const result = await createExportJob(type, {
    title: `${statement.toUpperCase()} export ${from ?? ""} ${to ?? ""}`.trim(),
    statement,
    from: from ?? null,
    to: to ?? null,
    requestedAt: new Date().toISOString(),
  });

  if (!result.success) {
    throw new Error(result.error ?? "Export request failed");
  }

  return result.data;
}
