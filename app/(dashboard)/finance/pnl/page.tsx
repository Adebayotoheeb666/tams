"use server";

import Link from "next/link";
import { computePnL, exportStatement } from "@/lib/actions/finance";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";

type SearchParams = {
  from?: string;
  to?: string;
  compareFrom?: string;
  compareTo?: string;
};

export default async function PnlPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to, compareFrom, compareTo } = searchParams;
  const statement = await computePnL({ from, to, compareFrom, compareTo });

  async function exportPdf() {
    await exportStatement({
      type: "pdf",
      from: from ?? undefined,
      to: to ?? undefined,
      statement: "pnl",
    });
  }

  async function exportExcel() {
    await exportStatement({
      type: "excel",
      from: from ?? undefined,
      to: to ?? undefined,
      statement: "pnl",
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Profit & Loss</h1>
          <p className="text-muted-foreground">Revenue, costs, and expenses for the selected period.</p>
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
        <input
          type="date"
          name="compareFrom"
          defaultValue={compareFrom}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Compare from"
        />
        <input
          type="date"
          name="compareTo"
          defaultValue={compareTo}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
          placeholder="Compare to"
        />
        <Button type="submit">Apply</Button>
      </form>

      <Card>
        <CardContent className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="mt-2 text-2xl font-semibold">{formatNaira(statement.revenueTotal)}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">COGS</p>
            <p className="mt-2 text-2xl font-semibold">{formatNaira(statement.cogsTotal)}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Expenses</p>
            <p className="mt-2 text-2xl font-semibold">{formatNaira(statement.expensesTotal)}</p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className={`mt-2 text-2xl font-semibold ${statement.netProfit >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
              {formatNaira(statement.netProfit)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          {statement.revenue.length === 0 ? (
            <p className="text-muted-foreground">No revenue accounts have entries in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3 font-medium">Account</th>
                    <th className="p-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.revenue.map((row) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Cost of Goods Sold</CardTitle>
        </CardHeader>
        <CardContent>
          {statement.cogs.length === 0 ? (
            <p className="text-muted-foreground">No COGS accounts have entries in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3 font-medium">Account</th>
                    <th className="p-3 font-medium">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {statement.cogs.map((row) => (
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

      <Card>
        <CardHeader>
          <CardTitle>Expenses</CardTitle>
        </CardHeader>
        <CardContent>
          {statement.expenses.length === 0 ? (
            <p className="text-muted-foreground">No expense accounts have entries in this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3 font-medium">Account</th>
                    <th className="p-3 font-medium">Balance</th>
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

      <div className="flex flex-wrap gap-3">
        <Link href="/finance">Back to finance home</Link>
      </div>
    </div>
  );
}
