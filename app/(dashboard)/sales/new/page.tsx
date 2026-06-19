import { getPosProducts } from "@/lib/actions/sales";
import { PosScreen } from "@/components/sales/pos-screen";

export default async function PosPage() {
  const products = await getPosProducts();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
        <p className="text-muted-foreground">
          Select products, confirm payment, and share a digital receipt.
        </p>
      </div>

      <PosScreen products={products} />
    </div>
  );
}
