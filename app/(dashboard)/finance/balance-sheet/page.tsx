"use server";

import Link from "next/link";
import { computeBalanceSheet } from "@/lib/actions/finance";
import { exportBalanceSheetExcel, exportBalanceSheetPdf } from "../finance-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";

type SearchParams = {
  date?: string;
};

export default async function BalanceSheetPage({ searchParams }: { searchParams: SearchParams }) {
  const { date } = searchParams;
  const report = await computeBalanceSheet({ date });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Balance Sheet</h1>
          <p className="text-muted-foreground">Assets, liabilities, and equity on the selected date.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={exportBalanceSheetPdf}>
            <input type="hidden" name="date" value={date ?? ""} />
            <Button type="submit">Export PDF</Button>
          </form>
          <form action={exportBalanceSheetExcel}>
            <input type="hidden" name="date" value={date ?? ""} />
            <Button type="submit" variant="outline">Export Excel</Button>
          </form>
        </div>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          type="date"
          name="date"
          defaultValue={date}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        />
        <Button type="submit">Refresh</Button>
      </form>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Assets</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatNaira(report.assetsTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Liabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatNaira(report.liabilitiesTotal)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Equity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatNaira(report.equityTotal)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-3 font-medium">Account</th>
                  <th className="p-3 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {report.assets.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-3">{row.code} — {row.name}</td>
                    <td className="p-3 font-medium">{formatNaira(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Liabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-3 font-medium">Account</th>
                  <th className="p-3 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {report.liabilities.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-3">{row.code} — {row.name}</td>
                    <td className="p-3 font-medium">{formatNaira(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/40 text-left">
                  <th className="p-3 font-medium">Account</th>
                  <th className="p-3 font-medium">Balance</th>
                </tr>
              </thead>
              <tbody>
                {report.equity.map((row) => (
                  <tr key={row.id} className="border-b last:border-0">
                    <td className="p-3">{row.code} — {row.name}</td>
                    <td className="p-3 font-medium">{formatNaira(row.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div>
        <Link href="/finance">Back to finance home</Link>
      </div>
    </div>
  );
}
