"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { PurchaseOrder } from "@/lib/db/schema";

type Props = {
  orders: Array<Pick<PurchaseOrder, "id" | "orderNumber" | "status">>;
  bulkReceive: (input: unknown) => Promise<unknown>;
};

export function BulkReceivePanel({ orders, bulkReceive }: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  function toggle(id: string) {
    setSelected((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <div className="space-y-3 rounded-lg border border-muted p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold">Bulk receive</p>
          <p className="text-sm text-muted-foreground">Select pending purchase orders to receive inventory in one batch.</p>
        </div>
        <Button
          type="button"
          disabled={selected.length === 0 || isPending}
          loading={isPending}
          onClick={() => {
            startTransition(async () => {
              await bulkReceive({ ids: selected });
              router.refresh();
            });
          }}
        >
          Receive selected ({selected.length})
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        {orders.map((order) => (
          <label key={order.id} className="flex items-center gap-3 rounded-md border p-3">
            <input
              type="checkbox"
              checked={selected.includes(order.id)}
              onChange={() => toggle(order.id)}
              className="h-4 w-4 rounded border-muted text-primary focus:ring-primary"
            />
            <span className="grid gap-1 text-sm">
              <span className="font-medium">{order.orderNumber}</span>
              <span className="text-muted-foreground">{order.status}</span>
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
