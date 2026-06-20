"use client";

import { useState } from "react";
import { Product, Supplier } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type Line = { id: string; productId?: string; productName: string; quantity: number; unitPriceNaira: number };

type PurchaseOrderPayload = {
  supplierId: string;
  orderDate: string;
  lines: Array<{ productId?: string; productName: string; quantity: number; unitPriceNaira: number }>;
};

type POFormProps = {
  products: Product[];
  suppliers: Supplier[];
  onSubmit: (data: PurchaseOrderPayload) => void;
  submitLabel?: string;
  initialData?: PurchaseOrderPayload;
};

export function POForm({ products, suppliers, onSubmit, submitLabel = "Save purchase order", initialData }: POFormProps) {
  const [lines, setLines] = useState<Line[]>(
    initialData?.lines?.length
      ? initialData.lines.map((item) => ({
          id: crypto.randomUUID(),
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPriceNaira: item.unitPriceNaira,
        }))
      : [{ id: crypto.randomUUID(), productId: undefined, productName: "", quantity: 1, unitPriceNaira: 0 }],
  );
  const [supplierId, setSupplierId] = useState(initialData?.supplierId ?? suppliers?.[0]?.id ?? "");
  const [orderDate, setOrderDate] = useState(initialData?.orderDate ?? new Date().toISOString().slice(0, 10));

  function updateLine(id: string, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function addLine() {
    setLines((ls) => [...ls, { id: crypto.randomUUID(), productId: undefined, productName: "", quantity: 1, unitPriceNaira: 0 }]);
  }

  function removeLine(id: string) {
    setLines((ls) => ls.filter((l) => l.id !== id));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ supplierId, orderDate, lines: lines.map((l) => ({ productId: l.productId, productName: l.productName, quantity: l.quantity, unitPriceNaira: l.unitPriceNaira })) });
      }}
      className="space-y-6"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Select value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
            <option value="">Select supplier</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Order date</Label>
          <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
        </div>
      </div>

      <div className="space-y-4">
        {lines.map((line) => (
          <div key={line.id} className="grid gap-2 sm:grid-cols-4 items-end">
            <div>
              <Label>Product</Label>
              <Select value={line.productId ?? ""} onChange={(e) => {
                const pid = e.target.value || undefined;
                const p = products.find((x) => x.id === pid);
                updateLine(line.id, { productId: pid, productName: p ? p.name : "" });
              }}>
                <option value="">Custom / select product</option>
                {products.map((p) => (<option key={p.id} value={p.id}>{p.name}</option>))}
              </Select>
            </div>

            <div>
              <Label>Product name</Label>
              <Input value={line.productName} onChange={(e) => updateLine(line.id, { productName: e.target.value })} />
            </div>

            <div>
              <Label>Quantity</Label>
              <Input type="number" min={1} value={line.quantity} onChange={(e) => updateLine(line.id, { quantity: Number(e.target.value) })} />
            </div>

            <div>
              <Label>Unit price (₦)</Label>
              <Input type="number" step="0.01" value={line.unitPriceNaira} onChange={(e) => updateLine(line.id, { unitPriceNaira: Number(e.target.value) })} />
            </div>

            <div className="col-span-4">
              <div className="flex gap-2 mt-2">
                <Button type="button" variant="outline" onClick={() => removeLine(line.id)}>Remove</Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="button" onClick={addLine}>Add line</Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
