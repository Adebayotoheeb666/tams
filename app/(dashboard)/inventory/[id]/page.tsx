import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCategories, getProductById } from "@/lib/actions/inventory";
import { ArchiveProductButton } from "@/components/inventory/archive-product-button";
import { ProductForm } from "@/components/inventory/product-form";
import { StockAdjustmentForm } from "@/components/inventory/stock-adjustment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  businessUnitLabel,
  formatNaira,
  isLowStock,
} from "@/lib/utils";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [product, categories, session] = await Promise.all([
    getProductById(params.id),
    getCategories(),
    auth(),
  ]);

  if (!product || !product.isActive) {
    notFound();
  }

  const lowStock = isLowStock(product.quantity, product.reorderLevel);
  const isOwner = session?.user?.role === "owner";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
            {lowStock ? <Badge variant="warning">Low stock</Badge> : null}
          </div>
          <p className="text-muted-foreground">
            {product.sku} · {businessUnitLabel(product.businessUnit)}
            {product.category ? ` · ${product.category.name}` : ""}
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory">Back to inventory</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Selling price</CardDescription>
            <CardTitle className="text-xl">
              {formatNaira(product.sellingPrice)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Cost price</CardDescription>
            <CardTitle className="text-xl">
              {formatNaira(product.costPrice)}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In stock</CardDescription>
            <CardTitle
              className={`text-xl ${lowStock ? "text-amber-700" : ""}`}
            >
              {product.quantity} units
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Reorder at {product.reorderLevel}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Edit product</CardTitle>
            <CardDescription>
              Update pricing, SKU, or category. Use stock adjustment to change quantity.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ProductForm
              categories={categories}
              product={product}
              mode="edit"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Adjust stock</CardTitle>
            <CardDescription>
              Record restocks, damage, or count corrections with a reason.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StockAdjustmentForm
              productId={product.id}
              currentQuantity={product.quantity}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Stock history</CardTitle>
          <CardDescription>Recent stock movements for this product.</CardDescription>
        </CardHeader>
        <CardContent>
          {product.stockMovements.length === 0 ? (
            <p className="text-sm text-muted-foreground">No movements recorded yet.</p>
          ) : (
            <div className="space-y-3">
              {product.stockMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex flex-col gap-1 border-b pb-3 last:border-0 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">{movement.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(movement.createdAt).toLocaleString("en-NG")} ·{" "}
                      {movement.createdByUser?.name ?? "Unknown"}
                    </p>
                  </div>
                  <div className="text-sm">
                    <span
                      className={
                        movement.delta > 0
                          ? "font-medium text-green-700"
                          : "font-medium text-red-700"
                      }
                    >
                      {movement.delta > 0 ? "+" : ""}
                      {movement.delta}
                    </span>
                    <span className="text-muted-foreground">
                      {" "}
                      ({movement.quantityBefore} → {movement.quantityAfter})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {isOwner ? (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-destructive">Danger zone</CardTitle>
            <CardDescription>
              Archive products that are no longer sold. This does not delete sales history.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ArchiveProductButton productId={product.id} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
