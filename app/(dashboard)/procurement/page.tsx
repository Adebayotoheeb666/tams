import Link from "next/link";
import { getPurchaseOrders, bulkReceivePurchaseOrders } from "@/lib/actions/procurement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BulkReceivePanel } from "@/components/procurement/bulk-receive-panel";

export default async function ProcurementPage() {
  const orders = await getPurchaseOrders();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Procurement</h1>
          <p className="text-muted-foreground">Purchase orders and receiving.</p>
        </div>
        <Button asChild>
          <Link href="/procurement/new">New purchase order</Link>
        </Button>
      </div>

      {orders.some((o) => o.status === "pending") && (
        <BulkReceivePanel
          orders={orders
            .filter((o) => o.status === "pending")
            .map((o) => ({ id: o.id, orderNumber: o.orderNumber, status: o.status }))}
          bulkReceive={bulkReceivePurchaseOrders}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Purchase orders</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {orders.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">No purchase orders yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3 font-medium">Order#</th>
                    <th className="p-3 font-medium">Supplier</th>
                    <th className="p-3 font-medium">Date</th>
                    <th className="p-3 font-medium">Total (₦)</th>
                    <th className="p-3 font-medium">Status</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-b last:border-0">
                      <td className="p-3">{o.orderNumber}</td>
                      <td className="p-3">{o.supplier?.name ?? "—"}</td>
                      <td className="p-3">{o.orderDate}</td>
                      <td className="p-3">{(o.totalAmount / 100).toFixed(2)}</td>
                      <td className="p-3">{o.status}</td>
                      <td className="p-3">
                        <Link href={`/procurement/${o.id}`} className="text-primary underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
