import Link from "next/link";
import Image from "next/image";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { ProductWithCategory } from "@/lib/actions/inventory";
import {
  businessUnitLabel,
  formatNaira,
  isLowStock,
} from "@/lib/utils";

export function ProductGrid({ products }: { products: ProductWithCategory[] }) {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No products found.{" "}
          <Link href="/inventory/new" className="text-primary underline">
            Add your first product
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => {
        const lowStock = isLowStock(product.quantity, product.reorderLevel);

        return (
          <Link key={product.id} href={`/inventory/${product.id}`}>
            <Card className="h-full transition-colors hover:border-primary/40">
              <CardContent className="space-y-3 p-4">
                {product.imageUrl ? (
                  <div className="relative h-40 w-full overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={product.imageUrl}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.sku}</p>
                  </div>
                  {lowStock ? (
                    <Badge variant="warning" className="shrink-0 gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Low
                    </Badge>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">
                    {businessUnitLabel(product.businessUnit)}
                  </Badge>
                  {product.category ? (
                    <Badge variant="outline">{product.category.name}</Badge>
                  ) : null}
                </div>

                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-lg font-semibold">
                      {formatNaira(product.sellingPrice)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cost {formatNaira(product.costPrice)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={
                        lowStock
                          ? "font-semibold text-amber-700"
                          : "font-medium"
                      }
                    >
                      {product.quantity} in stock
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Reorder at {product.reorderLevel}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
