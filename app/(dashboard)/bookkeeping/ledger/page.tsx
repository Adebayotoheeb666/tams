import Link from "next/link";
import { getAccountSummary, getAccounts, getLedger } from "@/lib/actions/bookkeeping";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";

type SearchParams = {
  from?: string;
  to?: string;
  accountId?: string;
  page?: string;
};

export default async function LedgerPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Number(searchParams.page ?? 1);
  const [{ lines, total, totalPages }, accounts, summary] = await Promise.all([
    getLedger({
      from: searchParams.from,
      to: searchParams.to,
      accountId: searchParams.accountId,
      page,
      limit: 30,
    }),
    getAccounts(),
    getAccountSummary(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">General ledger</h1>
        <p className="text-muted-foreground">
          {total} journal line{total === 1 ? "" : "s"} — automated entries from sales and services
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summary
          .filter((account) => account.debitTotal > 0 || account.creditTotal > 0)
          .slice(0, 4)
          .map((account) => (
            <Card key={account.id}>
              <CardHeader className="pb-2">
                <p className="text-xs text-muted-foreground">
                  {account.code} · {account.type}
                </p>
                <CardTitle className="text-base font-medium">{account.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold">{formatNaira(account.balance)}</p>
              </CardContent>
            </Card>
          ))}
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          type="date"
          name="from"
          defaultValue={searchParams.from}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={searchParams.to}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        />
        <select
          name="accountId"
          defaultValue={searchParams.accountId ?? ""}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">All accounts</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.code} — {account.name}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {(searchParams.from || searchParams.to || searchParams.accountId) && (
          <Button asChild variant="outline">
            <Link href="/bookkeeping/ledger">Clear</Link>
          </Button>
        )}
      </form>

      <Card>
        <CardContent className="p-0">
          {lines.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">
              No journal entries yet. Sales and completed appointments will appear here.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Entry</th>
                    <th className="p-3 font-medium">Account</th>
                    <th className="p-3 font-medium">Type</th>
                    <th className="p-3 text-right font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line) => (
                    <tr key={line.id} className="border-b last:border-0">
                      <td className="p-3 whitespace-nowrap">{line.entryDate}</td>
                      <td className="p-3">
                        <p className="font-medium">{line.entryNumber}</p>
                        <p className="text-xs text-muted-foreground">{line.description}</p>
                      </td>
                      <td className="p-3">
                        <p>{line.accountName}</p>
                        <p className="text-xs text-muted-foreground">{line.accountCode}</p>
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={line.entryType === "debit" ? "default" : "secondary"}
                        >
                          {line.entryType}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-medium">
                        {formatNaira(line.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Button asChild variant="outline" size="sm" disabled={page <= 1}>
            <Link
              href={`/bookkeeping/ledger?${new URLSearchParams({
                ...(searchParams.from ? { from: searchParams.from } : {}),
                ...(searchParams.to ? { to: searchParams.to } : {}),
                ...(searchParams.accountId ? { accountId: searchParams.accountId } : {}),
                page: String(page - 1),
              }).toString()}`}
            >
              Previous
            </Link>
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button asChild variant="outline" size="sm" disabled={page >= totalPages}>
            <Link
              href={`/bookkeeping/ledger?${new URLSearchParams({
                ...(searchParams.from ? { from: searchParams.from } : {}),
                ...(searchParams.to ? { to: searchParams.to } : {}),
                ...(searchParams.accountId ? { accountId: searchParams.accountId } : {}),
                page: String(page + 1),
              }).toString()}`}
            >
              Next
            </Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
