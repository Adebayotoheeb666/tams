"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createSupplier, updateSupplier } from "@/lib/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Supplier } from "@/lib/db/schema";

type Props = {
  supplier?: Supplier | null;
  mode: "create" | "edit";
};

export function SupplierForm({ supplier, mode }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const fd = new FormData(e.currentTarget);
    const payload: any = {
      name: String(fd.get("name") || ""),
      contactName: String(fd.get("contactName") || ""),
      phone: String(fd.get("phone") || ""),
      email: String(fd.get("email") || ""),
      address: String(fd.get("address") || ""),
    };

    if (mode === "edit") payload.id = supplier!.id;

    startTransition(async () => {
      const result = mode === "create" ? await createSupplier(payload) : await updateSupplier(payload);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push(`/suppliers`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Supplier name</Label>
          <Input id="name" name="name" defaultValue={supplier?.name ?? ""} required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contactName">Contact person</Label>
          <Input id="contactName" name="contactName" defaultValue={supplier?.contactName ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" defaultValue={supplier?.phone ?? ""} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={supplier?.email ?? ""} />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" name="address" defaultValue={supplier?.address ?? ""} />
        </div>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : mode === "create" ? "Create supplier" : "Save changes"}</Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>Cancel</Button>
      </div>
    </form>
  );
}
