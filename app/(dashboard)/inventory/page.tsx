import { Suspense } from "react";
import { getProducts } from "@/lib/actions/inventory";
import {
  InventoryFilters,
  InventoryHeaderActions,
} from "@/components/inventory/inventory-filters";
import { ProductGrid } from "@/components/inventory/product-grid";
import { Badge } from "@/components/ui/badge";

type SearchParams = {
  unit?: string;
  q?: string;
  lowStock?: string;
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const businessUnit =
    searchParams.unit === "thrift" || searchParams.unit === "nails"
      ? searchParams.unit
      : "all";

  const products = await getProducts({
    businessUnit,
    search: searchParams.q,
    lowStockOnly: searchParams.lowStock === "1",
  });

  const lowStockCount = products.filter(
    (p) => p.quantity <= p.reorderLevel,
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            {products.length} product{products.length === 1 ? "" : "s"}
            {lowStockCount > 0 ? (
              <>
                {" "}
                ·{" "}
                <Badge variant="warning" className="align-middle">
                  {lowStockCount} low stock
                </Badge>
              </>
            ) : null}
          </p>
        </div>
        <InventoryHeaderActions />
      </div>

      <Suspense fallback={<div className="h-20 animate-pulse rounded-lg bg-muted" />}>
        <InventoryFilters />
      </Suspense>

      <ProductGrid products={products} />
    </div>
  );
}
