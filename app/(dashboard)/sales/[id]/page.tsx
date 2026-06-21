import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById, getRefundsByOrderId } from "@/lib/actions/sales";
import { ReceiptView } from "@/components/sales/receipt-modal";
import { RefundForm } from "@/components/sales/refund-form";
import { formatReceiptWhatsAppMessage, whatsAppShareUrl } from "@/lib/sales/receipt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";
import { Share2 } from "lucide-react";

export default async function SaleDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const data = await getOrderById(params.id);

  if (!data) {
    notFound();
  }

  const { order, items, receipt } = data;
  const refunds = await getRefundsByOrderId(order.id);
  const whatsAppUrl = whatsAppShareUrl(formatReceiptWhatsAppMessage(receipt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {order.receiptNumber}
          </h1>
          <p className="text-muted-foreground">
            Recorded by {order.createdByUser?.name ?? "Staff"} on{" "}
            {new Date(order.orderDate).toLocaleString("en-NG")}
          </p>
        </div>
        <div className="flex gap-2">
          <RefundForm
            orderId={order.id}
            totalAmount={order.totalAmount}
            amountPaid={order.amountPaid}
            paymentMethod={order.paymentMethod as "cash" | "card" | "transfer" | "credit"}
          />
          <Button asChild variant="outline" size="sm">
            <Link href="/sales">Back to sales</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Receipt</CardTitle>
          </CardHeader>
          <CardContent>
            <ReceiptView receipt={receipt} />
            <Button asChild className="mt-6 w-full">
              <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
                <Share2 className="h-4 w-4" />
                Share via WhatsApp
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-start justify-between gap-3 border-b pb-3 last:border-0"
              >
                <div>
                  <p className="font-medium">{item.productName}</p>
                  <Link
                    href={`/inventory/${item.productId}`}
                    className="text-xs text-primary underline"
                  >
                    View product
                  </Link>
                </div>
                <div className="text-right text-sm">
                  <p>
                    {item.quantity} × {formatNaira(item.unitPrice)}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {refunds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Refunds</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {refunds.map((refund) => (
                <div
                  key={refund.id}
                  className="flex items-start justify-between gap-3 border-b pb-3 last:border-0"
                >
                  <div>
                    <p className="font-medium">{refund.refundNumber}</p>
                    <p className="text-xs text-muted-foreground">
                      {refund.reason}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Processed by {refund.createdByUser?.name ?? "Staff"} on{" "}
                      {new Date(refund.createdAt).toLocaleString("en-NG")}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium text-red-600">
                      -{formatNaira(refund.refundAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {refund.status}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
