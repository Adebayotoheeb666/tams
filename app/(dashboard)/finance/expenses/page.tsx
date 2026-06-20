"use server";

import Link from "next/link";
import { computePnL, exportStatement } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";

type SearchParams = {
  from?: string;
  to?: string;
};

export default async function ExpensesPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to } = searchParams;
  const statement = await computePnL({ from, to });

  async function exportPdf() {
    await exportStatement({
      type: "pdf",
      from: from ?? undefined,
      to: to ?? undefined,
      statement: "expenses",
    });
  }

  async function exportExcel() {
    await exportStatement({
      type: "excel",
      from: from ?? undefined,
      to: to ?? undefined,
      statement: "expenses",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Expense Report</h1>
          <p className="text-muted-foreground">Breakdown of expense account balances for the chosen period.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={exportPdf}>
            <Button type="submit">Export PDF</Button>
          </form>
          <form action={exportExcel}>
            <Button type="submit" variant="outline">Export Excel</Button>
          </form>
        </div>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        />
        <Button type="submit">Refresh</Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Expense categories</CardTitle>
        </CardHeader>
        <CardContent>
          {statement.expenses.length === 0 ? (
            <p className="text-muted-foreground">No expense account activity found for the selected period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3 font-medium">Account</th>
                    <th className="p-3 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.expenses.map((row) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="p-3">{row.code} — {row.name}</td>
                      <td className="p-3 font-medium">{formatNaira(row.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="rounded-lg border border-border p-4">
        <p className="text-sm text-muted-foreground">Total expenses</p>
        <p className="mt-2 text-2xl font-semibold">{formatNaira(statement.expensesTotal)}</p>
      </div>

      <div>
        <Link href="/finance">Back to finance home</Link>
      </div>
    </div>
  );
}
