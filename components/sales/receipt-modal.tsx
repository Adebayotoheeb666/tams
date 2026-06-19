import { formatNaira } from "@/lib/utils";
import {
  formatReceiptWhatsAppMessage,
  paymentMethodLabel,
  type SaleReceipt,
  whatsAppShareUrl,
} from "@/lib/sales/receipt";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Share2 } from "lucide-react";

export function ReceiptView({ receipt }: { receipt: SaleReceipt }) {
  return (
    <div className="space-y-4">
      <div className="text-center">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">
          Tams Beauty Hub
        </p>
        <p className="text-2xl font-bold">{receipt.receiptNumber}</p>
        <p className="text-sm text-muted-foreground">
          {new Date(receipt.orderDate).toLocaleString("en-NG")}
        </p>
      </div>

      <div className="space-y-2 border-y py-4">
        {receipt.items.map((item, index) => (
          <div key={`${item.name}-${index}`} className="flex justify-between gap-3 text-sm">
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-muted-foreground">
                {item.quantity} × {formatNaira(item.unitPrice)}
              </p>
            </div>
            <p className="font-medium">{formatNaira(item.totalPrice)}</p>
          </div>
        ))}
      </div>

      <div className="space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatNaira(receipt.subtotal)}</span>
        </div>
        {receipt.discountAmount > 0 ? (
          <div className="flex justify-between text-green-700">
            <span>Discount</span>
            <span>−{formatNaira(receipt.discountAmount)}</span>
          </div>
        ) : null}
        <div className="flex justify-between text-base font-bold">
          <span>Total</span>
          <span>{formatNaira(receipt.totalAmount)}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-muted-foreground">Payment</span>
          <Badge variant="secondary">
            {paymentMethodLabel(receipt.paymentMethod)}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function ReceiptModal({
  receipt,
  open,
  onClose,
}: {
  receipt: SaleReceipt | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!receipt) return null;

  const whatsAppUrl = whatsAppShareUrl(formatReceiptWhatsAppMessage(receipt));

  return (
    <Dialog open={open} onClose={onClose}>
      <div className="space-y-6 pt-4">
        <div className="text-center">
          <h2 className="text-lg font-semibold">Sale complete</h2>
          <p className="text-sm text-muted-foreground">
            Receipt ready to share with customer
          </p>
        </div>

        <ReceiptView receipt={receipt} />

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="flex-1">
            <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
              <Share2 className="h-4 w-4" />
              Share via WhatsApp
            </a>
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
            New sale
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
