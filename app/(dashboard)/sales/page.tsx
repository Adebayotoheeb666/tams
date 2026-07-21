import Link from "next/link";
import { getSalesHistory } from "@/lib/actions/sales";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { paymentMethodLabel } from "@/lib/sales/receipt";

type SearchParams = {
  from?: string;
  to?: string;
  page?: string;
};

export default async function SalesHistoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const page = Number(searchParams.page ?? 1);
  const { orders, total, totalPages } = await getSalesHistory({
    from: searchParams.from,
    to: searchParams.to,
    page,
    limit: 20,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Sales history</h1>
          <p className="text-muted-foreground">
            {total} sale{total === 1 ? "" : "s"} recorded
          </p>
        </div>
        <Link href="/sales/new">
          <Button>New sale</Button>
        </Link>
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
        <Button type="submit" variant="secondary">
          Filter
        </Button>
        {(searchParams.from || searchParams.to) && (
          <Link href="/sales">
            <Button variant="outline">Clear</Button>
          </Link>
        )}
      </form>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            No sales yet.{" "}
            <Link href="/sales/new" className="text-primary underline">
              Record your first sale
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/sales/${order.id}`}>
              <Card className="transition-colors hover:border-primary/40">
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{order.receiptNumber}</p>
                      <Badge variant="secondary">
                        {paymentMethodLabel(order.paymentMethod)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.orderDate).toLocaleString("en-NG")} ·{" "}
                      {order.items.length} item{order.items.length === 1 ? "" : "s"} ·{" "}
                      {order.createdByUser?.name ?? "Staff"}
                    </p>
                  </div>
                  <p className="text-lg font-bold">
                    {formatNaira(order.totalAmount)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-3">
          <Link
            href={`/sales?${new URLSearchParams({
              ...(searchParams.from ? { from: searchParams.from } : {}),
              ...(searchParams.to ? { to: searchParams.to } : {}),
              page: String(page - 1),
            }).toString()}`}
          >
            <Button variant="outline" size="sm" disabled={page <= 1}>
              Previous
            </Button>
          </Link>
          <span className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/sales?${new URLSearchParams({
              ...(searchParams.from ? { from: searchParams.from } : {}),
              ...(searchParams.to ? { to: searchParams.to } : {}),
              page: String(page + 1),
            }).toString()}`}
          >
            <Button variant="outline" size="sm" disabled={page >= totalPages}>
              Next
            </Button>
          </Link>
        </div>
      ) : null}
    </div>
  );
}
