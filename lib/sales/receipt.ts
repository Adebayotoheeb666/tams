import type { BusinessUnit } from "@/lib/utils";
import { formatNaira } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/db/schema";

export type ReceiptLine = {
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type SaleReceipt = {
  receiptNumber: string;
  orderDate: string;
  paymentMethod: Order["paymentMethod"];
  subtotal: number;
  discountAmount: number;
  totalAmount: number;
  items: ReceiptLine[];
};

export function buildReceiptFromOrder(
  order: Order,
  items: OrderItem[],
): SaleReceipt {
  return {
    receiptNumber: order.receiptNumber,
    orderDate: order.orderDate,
    paymentMethod: order.paymentMethod,
    subtotal: order.subtotal,
    discountAmount: order.discountAmount,
    totalAmount: order.totalAmount,
    items: items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice,
    })),
  };
}

export function paymentMethodLabel(method: Order["paymentMethod"]): string {
  const labels = {
    cash: "Cash",
    transfer: "Bank Transfer",
    pos: "POS Terminal",
  };
  return labels[method];
}

export function formatReceiptWhatsAppMessage(receipt: SaleReceipt): string {
  const lines = [
    "🧾 *Tams Beauty Hub*",
    `Receipt: ${receipt.receiptNumber}`,
    `Date: ${new Date(receipt.orderDate).toLocaleString("en-NG")}`,
    `Payment: ${paymentMethodLabel(receipt.paymentMethod)}`,
    "",
    "*Items*",
    ...receipt.items.map(
      (item) =>
        `• ${item.name} × ${item.quantity} — ${formatNaira(item.totalPrice)}`,
    ),
    "",
    `Subtotal: ${formatNaira(receipt.subtotal)}`,
  ];

  if (receipt.discountAmount > 0) {
    lines.push(`Discount: −${formatNaira(receipt.discountAmount)}`);
  }

  lines.push(
    `*Total: ${formatNaira(receipt.totalAmount)}*`,
    "",
    "Thank you for shopping with us! 💅✨",
  );

  return lines.join("\n");
}

export function whatsAppShareUrl(message: string, phone?: string): string {
  const encoded = encodeURIComponent(message);
  if (phone) {
    const normalized = phone.replace(/\D/g, "");
    return `https://wa.me/${normalized}?text=${encoded}`;
  }
  return `https://wa.me/?text=${encoded}`;
}

export function allocateDiscountByUnit(
  items: Array<{ businessUnit: BusinessUnit; totalPrice: number }>,
  discountAmount: number,
): Record<BusinessUnit, number> {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const gross: Record<BusinessUnit, number> = { thrift: 0, nails: 0 };

  for (const item of items) {
    gross[item.businessUnit] += item.totalPrice;
  }

  if (discountAmount === 0 || subtotal === 0) {
    return gross;
  }

  const net: Record<BusinessUnit, number> = {
    thrift: gross.thrift,
    nails: gross.nails,
  };

  const activeUnits = (["thrift", "nails"] as const).filter(
    (unit) => gross[unit] > 0,
  );

  let allocated = 0;
  for (let i = 0; i < activeUnits.length; i++) {
    const unit = activeUnits[i]!;
    const share =
      i === activeUnits.length - 1
        ? discountAmount - allocated
        : Math.round((discountAmount * gross[unit]) / subtotal);

    net[unit] = gross[unit] - share;
    allocated += share;
  }

  return net;
}
