import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { CsvImportForm } from "@/components/inventory/csv-import-form";
import { Button } from "@/components/ui/button";

export default async function InventoryImportPage() {
  const session = await auth();
  if (session?.user?.role !== "owner") {
    redirect("/inventory");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Import products</h1>
          <p className="text-muted-foreground">
            Bulk upload opening stock or update existing products from CSV.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/inventory">Back to inventory</Link>
        </Button>
      </div>

      <CsvImportForm />
    </div>
  );
}
