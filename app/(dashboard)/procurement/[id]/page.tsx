import Link from "next/link";
import { getProducts } from "@/lib/actions/inventory";
import { getSuppliers } from "@/lib/actions/suppliers";
import { getPurchaseOrderById, receivePurchaseOrder, cancelPurchaseOrder, updatePurchaseOrder } from "@/lib/actions/procurement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POForm } from "@/components/procurement/po-form";

export default async function PurchaseOrderPage({ params }: { params: { id: string } }) {
  const [po, products, suppliers] = await Promise.all([
    getPurchaseOrderById(params.id),
    getProducts(),
    getSuppliers(),
  ]);

  if (!po) return <p>Not found</p>;

  const purchaseOrderId = po.id;

  async function markReceived() {
    await receivePurchaseOrder({ id: purchaseOrderId });
  }

  async function cancelOrder() {
    await cancelPurchaseOrder(purchaseOrderId);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase order {po.orderNumber}</h1>
          <p className="text-muted-foreground">Status: {po.status}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href="/procurement">Back</Link>
          </Button>
          {po.status === "pending" && (
            <form action={markReceived}>
              <Button type="submit">Mark as received</Button>
            </form>
          )}
          {po.status === "pending" && (
            <form action={cancelOrder}>
              <Button type="submit" variant="destructive">Cancel order</Button>
            </form>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lines</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40 text-left">
                <th className="p-3">Product</th>
                <th className="p-3">Qty</th>
                <th className="p-3">Unit (₦)</th>
                <th className="p-3">Total (₦)</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((l) => (
                <tr key={l.id} className="border-b">
                  <td className="p-3">{l.productName}</td>
                  <td className="p-3">{l.quantity}</td>
                  <td className="p-3">{(l.unitPrice / 100).toFixed(2)}</td>
                  <td className="p-3">{(l.totalPrice / 100).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {po.status === "pending" ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit purchase order</CardTitle>
          </CardHeader>
          <CardContent>
            <POForm
              products={products}
              suppliers={suppliers}
              submitLabel="Save changes"
              initialData={{
                supplierId: po.supplierId ?? "",
                orderDate: po.orderDate,
                lines: po.lines.map((l) => ({
                  productId: l.productId ?? undefined,
                  productName: l.productName,
                  quantity: l.quantity,
                  unitPriceNaira: l.unitPrice / 100,
                })),
              }}
              onSubmit={async (data) => {
                await updatePurchaseOrder({ id: po.id, ...data });
                location.href = "/procurement";
              }}
            />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
