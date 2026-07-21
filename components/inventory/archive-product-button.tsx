"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { archiveProduct } from "@/lib/actions/inventory";
import { Button } from "@/components/ui/button";

export function ArchiveProductButton({ productId }: { productId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleArchive() {
    if (
      !window.confirm(
        "Archive this product? It will be hidden from inventory and POS.",
      )
    ) {
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await archiveProduct(productId);
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.push("/inventory");
      router.refresh();
    });
  }

  return (
    <div>
      <Button
        type="button"
        variant="destructive"
        size="sm"
        onClick={handleArchive}
        disabled={isPending}
        loading={isPending}
      >
        {isPending ? "Archiving…" : "Archive product"}
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
