import Link from "next/link";
import { getCategories } from "@/lib/actions/inventory";
import { ProductForm } from "@/components/inventory/product-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add product</h1>
          <p className="text-muted-foreground">
            Create a new inventory item for Tams Thrift or Glitz Nails.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory">Back to inventory</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product details</CardTitle>
          <CardDescription>
            Prices are entered in Naira. Stock is stored in whole units.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProductForm categories={categories} mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
