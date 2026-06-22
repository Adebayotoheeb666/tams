"use client";

import { useState } from "react";
import { processRefund } from "@/lib/actions/sales";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatNaira, koboToNaira } from "@/lib/utils";
import { AlertCircle, CheckCircle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export type RefundFormProps = {
  orderId: string;
  amountPaid: number;
  paymentMethod: "cash" | "transfer" | "pos";
};

export function RefundForm({
  orderId,
  amountPaid,
  paymentMethod,
}: RefundFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [refundAmount, setRefundAmount] = useState("");
  const [reason, setReason] = useState("");
  const [refundMethod, setRefundMethod] = useState<
    "cash" | "transfer" | "credit"
  >(paymentMethod === "transfer" ? "transfer" : "cash");

  const maxRefundAmount = koboToNaira(amountPaid);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const amount = parseFloat(refundAmount);
      if (!amount || amount <= 0) {
        setError("Refund amount must be greater than 0");
        return;
      }
      if (amount > maxRefundAmount) {
        setError(
          `Refund amount cannot exceed paid amount (${formatNaira(amountPaid)})`
        );
        return;
      }
      if (!reason.trim()) {
        setError("Reason is required");
        return;
      }

      const result = await processRefund({
        orderId,
        refundAmount: Math.round(amount * 100),
        reason: reason.trim(),
        refundMethod,
      });

      if (result.success) {
        setSuccess(true);
        setRefundAmount("");
        setReason("");
        setTimeout(() => {
          setOpen(false);
          window.location.reload();
        }, 2000);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process refund");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <RotateCcw className="h-4 w-4" />
        Process Refund
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)}>
        <div className="sm:max-w-md">
          <div className="space-y-4 py-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Maximum refund: {formatNaira(amountPaid)}
            </AlertDescription>
          </Alert>

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Refund processed successfully. Inventory and accounting have been
                updated.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Refund Amount (₦)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={maxRefundAmount}
                disabled={loading || success}
              />
            </div>

            <div>
              <Label htmlFor="method">Refund Method</Label>
              <Select
                id="method"
                value={refundMethod}
                onChange={(e) =>
                  setRefundMethod(e.target.value as "cash" | "transfer" | "credit")
                }
                disabled={loading || success}
              >
                <option value="cash">Cash</option>
                <option value="transfer">Bank Transfer</option>
                <option value="credit">Credit Account</option>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Reason for Refund</Label>
              <Textarea
                id="reason"
                placeholder="e.g., Customer return, damaged product, duplicate charge..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                disabled={loading || success}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading || success}
                className="flex-1"
              >
                {loading ? "Processing..." : "Process Refund"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
        </div>
      </Dialog>
      </>
    );
  }
