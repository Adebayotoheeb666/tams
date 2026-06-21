"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { createExportJob } from "@/lib/actions/exports";

export function ExportButtons() {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleExportPdf() {
    setError(null);
    startTransition(async () => {
      const result = await createExportJob("pdf", {
        title: "Financial statement export",
        requestedAt: new Date().toISOString(),
        type: "statement",
      });

      if (!result.success) {
        setError(result.error);
      }
    });
  }

  function handleExportExcel() {
    setError(null);
    startTransition(async () => {
      const result = await createExportJob("excel", {
        title: "Financial statement export",
        requestedAt: new Date().toISOString(),
        type: "statement",
      });

      if (!result.success) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleExportPdf} disabled={isPending}>
          {isPending ? "Exporting..." : "Export PDF"}
        </Button>
        <Button onClick={handleExportExcel} variant="outline" disabled={isPending}>
          {isPending ? "Exporting..." : "Export Excel"}
        </Button>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
