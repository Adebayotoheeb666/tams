"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, Upload } from "lucide-react";
import { importProductsFromCsv } from "@/lib/actions/inventory";
import { CSV_IMPORT_TEMPLATE } from "@/lib/inventory/csv";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function CsvImportForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    created: number;
    updated: number;
    skipped: number;
    errors: Array<{ row: number; sku?: string; message: string }>;
  } | null>(null);

  function downloadTemplate() {
    const blob = new Blob([CSV_IMPORT_TEMPLATE], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "tbh-ims-products-template.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setResult(null);

    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError("Choose a CSV file to import.");
      return;
    }

    startTransition(async () => {
      const csvText = await file.text();
      const importResult = await importProductsFromCsv(csvText);

      if (!importResult.success) {
        setError(importResult.error);
        return;
      }

      setResult(importResult.data);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>CSV format</CardTitle>
          <CardDescription>
            Required columns: <code>sku</code>, <code>name</code>,{" "}
            <code>business_unit</code> (thrift or nails),{" "}
            <code>cost_price_naira</code>, <code>selling_price_naira</code>,{" "}
            <code>quantity</code>. Optional: <code>category</code>,{" "}
            <code>reorder_level</code>, <code>description</code>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={downloadTemplate}>
            <Download className="h-4 w-4" />
            Download template
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Upload CSV</CardTitle>
          <CardDescription>
            New SKUs are created with opening stock. Existing SKUs are updated
            and stock is adjusted to match the CSV quantity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file">CSV file</Label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".csv,text/csv"
                required
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button type="submit" disabled={isPending}>
              <Upload className="h-4 w-4" />
              {isPending ? "Importing…" : "Import products"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Import results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>{result.created}</strong> created ·{" "}
              <strong>{result.updated}</strong> updated ·{" "}
              <strong>{result.skipped}</strong> skipped
            </p>
            {result.errors.length > 0 ? (
              <div className="space-y-2 rounded-md border border-destructive/30 bg-destructive/5 p-3">
                <p className="font-medium text-destructive">Row errors</p>
                <ul className="space-y-1 text-destructive">
                  {result.errors.map((item) => (
                    <li key={`${item.row}-${item.message}`}>
                      Row {item.row}
                      {item.sku ? ` (${item.sku})` : ""}: {item.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="text-muted-foreground">All rows imported successfully.</p>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
