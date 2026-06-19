import Link from "next/link";
import { getCategories } from "@/lib/actions/inventory";
import { CategoryManager } from "@/components/inventory/category-manager";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organise products by business unit — Tams Thrift or Glitz Nails.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory">Back to inventory</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Manage categories</CardTitle>
          <CardDescription>
            Categories help filter inventory and will be used in POS and reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryManager categories={categories} />
        </CardContent>
      </Card>
    </div>
  );
}
