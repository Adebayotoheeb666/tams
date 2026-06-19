"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function InventoryFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const businessUnit = searchParams.get("unit") ?? "all";
  const lowStockOnly = searchParams.get("lowStock") === "1";
  const search = searchParams.get("q") ?? "";

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`/inventory?${params.toString()}`);
  }

  return (
    <div className="space-y-3">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          updateParams({ q: String(formData.get("q") ?? "") });
        }}
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={search}
            placeholder="Search by name or SKU…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Search
        </Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "all", label: "All units" },
            { value: "thrift", label: "Tams Thrift" },
            { value: "nails", label: "Glitz Nails" },
          ] as const
        ).map((option) => (
          <Button
            key={option.value}
            type="button"
            size="sm"
            variant={businessUnit === option.value ? "default" : "outline"}
            onClick={() => updateParams({ unit: option.value === "all" ? null : option.value })}
          >
            {option.label}
          </Button>
        ))}

        <Button
          type="button"
          size="sm"
          variant={lowStockOnly ? "default" : "outline"}
          className={cn(lowStockOnly && "bg-amber-600 hover:bg-amber-600/90")}
          onClick={() =>
            updateParams({ lowStock: lowStockOnly ? null : "1" })
          }
        >
          Low stock only
        </Button>
      </div>
    </div>
  );
}

export function InventoryHeaderActions() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild variant="outline" size="sm">
        <Link href="/inventory/import">Import CSV</Link>
      </Button>
      <Button asChild variant="outline" size="sm">
        <Link href="/inventory/categories">Categories</Link>
      </Button>
      <Button asChild size="sm">
        <Link href="/inventory/new">Add product</Link>
      </Button>
    </div>
  );
}
