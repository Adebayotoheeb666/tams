import Link from "next/link";
import { SupplierForm } from "@/components/suppliers/supplier-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewSupplierPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New supplier</h1>
          <p className="text-muted-foreground">Add a supplier to be used in purchase orders.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/suppliers">Back to suppliers</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier details</CardTitle>
        </CardHeader>
        <CardContent>
          {/* SupplierForm is a client component that calls server actions */}
          <SupplierForm mode="create" />
        </CardContent>
      </Card>
    </div>
  );
}
