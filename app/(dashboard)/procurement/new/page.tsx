import { POForm } from "@/components/procurement/po-form";
import { getProducts } from "@/lib/actions/inventory";
import { getSuppliers } from "@/lib/actions/suppliers";
import { createPurchaseOrder } from "@/lib/actions/procurement";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewPOPage() {
  const [products, suppliers] = await Promise.all([getProducts(), getSuppliers()]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">New purchase order</h1>
          <p className="text-muted-foreground">Create a purchase order for receiving stock.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/procurement">Back to procurement</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create purchase order</CardTitle>
        </CardHeader>
        <CardContent>
          {/* POForm is client — it will call server action via form submit */}
          <POForm products={products} suppliers={suppliers} onSubmit={async (data) => {
            await createPurchaseOrder(data);
            // navigate from client side handled by server action result in real use; here we simply refresh
            location.href = '/procurement';
          }} />
        </CardContent>
      </Card>
    </div>
  );
}
