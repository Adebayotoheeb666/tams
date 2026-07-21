"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { adjustStock } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const PRESET_REASONS = [
  "Restock received",
  "Physical count correction",
  "Damaged goods",
  "Lost / stolen",
  "Returned to supplier",
  "Other",
] as const;

export function StockAdjustmentForm({
  productId,
  currentQuantity,
}: {
  productId: string;
  currentQuantity: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [adjustmentType, setAdjustmentType] = useState("add");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const formData = new FormData(event.currentTarget);
    const type = String(formData.get("adjustmentType"));
    const amount = Number(formData.get("amount"));
    const presetReason = String(formData.get("presetReason"));
    const customReason = String(formData.get("customReason") || "").trim();

    const reason =
      presetReason === "Other" ? customReason : presetReason;

    let delta: number;
    if (type === "set") {
      delta = amount - currentQuantity;
      if (delta === 0) {
        setError("Stock is already at that quantity.");
        return;
      }
    } else if (type === "add") {
      delta = amount;
    } else {
      delta = -amount;
    }

    startTransition(async () => {
      const result = await adjustStock({ productId, delta, reason });

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSuccess(`Stock updated to ${result.data.quantity} units.`);
      (event.target as HTMLFormElement).reset();
      setAdjustmentType("add");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Current stock: <strong>{currentQuantity}</strong> units
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="adjustmentType">Adjustment type</Label>
          <Select
            id="adjustmentType"
            name="adjustmentType"
            value={adjustmentType}
            onChange={(e) => setAdjustmentType(e.target.value)}
            required
          >
            <option value="add">Add stock (+)</option>
            <option value="remove">Remove stock (−)</option>
            <option value="set">Set exact quantity</option>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">
            {adjustmentType === "set" ? "New quantity" : "Quantity"}
          </Label>
          <Input
            id="amount"
            name="amount"
            type="number"
            min={adjustmentType === "set" ? 0 : 1}
            step={1}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="presetReason">Reason</Label>
          <Select id="presetReason" name="presetReason" defaultValue={PRESET_REASONS[0]} required>
            {PRESET_REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="customReason">Custom reason (if Other)</Label>
          <Input id="customReason" name="customReason" placeholder="Describe the adjustment" />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="text-sm text-green-700" role="status">
          {success}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending} loading={isPending}>
        {isPending ? "Adjusting…" : "Apply adjustment"}
      </Button>
    </form>
  );
}
