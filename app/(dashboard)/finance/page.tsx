import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Finance</h1>
        <p className="text-muted-foreground">Key financial statements, cash flow, and expense reports for your business.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>P&L Statement</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">View revenue, cost of goods sold, expenses, and net profit over any period.</p>
            <Button asChild>
              <Link href="/finance/pnl">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Balance Sheet</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Review assets, liabilities, and equity on a selected reporting date.</p>
            <Button asChild>
              <Link href="/finance/balance-sheet">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">See cash inflows and outflows for the chosen period.</p>
            <Button asChild>
              <Link href="/finance/cash-flow">Open</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">Analyze expense categories and spending trends.</p>
            <Button asChild>
              <Link href="/finance/expenses">Open</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
