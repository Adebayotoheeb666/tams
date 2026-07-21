"use server";

import Link from "next/link";
import { computeCashFlow } from "@/lib/actions/finance";
import { exportCashFlowExcel, exportCashFlowPdf } from "../finance-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";

type SearchParams = {
  from?: string;
  to?: string;
};

export default async function CashFlowPage({ searchParams }: { searchParams: SearchParams }) {
  const { from, to } = searchParams;
  const report = await computeCashFlow({ from, to });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cash Flow</h1>
          <p className="text-muted-foreground">Cash movement during the selected reporting period.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <form action={exportCashFlowPdf}>
            <input type="hidden" name="from" value={from ?? ""} />
            <input type="hidden" name="to" value={to ?? ""} />
            <Button type="submit">Export PDF</Button>
          </form>
          <form action={exportCashFlowExcel}>
            <input type="hidden" name="from" value={from ?? ""} />
            <input type="hidden" name="to" value={to ?? ""} />
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

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Operating</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatNaira(report.operating)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Investing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatNaira(report.investing)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Financing</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{formatNaira(report.financing)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Net cash</CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-3xl font-semibold ${report.netCash >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
            {formatNaira(report.netCash)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cash movements</CardTitle>
        </CardHeader>
        <CardContent>
          {report.cashMovements.length === 0 ? (
            <p className="text-muted-foreground">No cash account activity found for this period.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3 font-medium">Account</th>
                    <th className="p-3 font-medium">Amount</th>
                    <th className="p-3 font-medium">Reference</th>
                    <th className="p-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {report.cashMovements.map((movement, index) => (
                    <tr key={index} className="border-b last:border-0">
                      <td className="p-3">{movement.accountCode} — {movement.accountName}</td>
                      <td className="p-3 font-medium">{formatNaira(movement.amount)}</td>
                      <td className="p-3">{movement.referenceType}</td>
                      <td className="p-3">{movement.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Link href="/finance">Back to finance home</Link>
      </div>
    </div>
  );
}
