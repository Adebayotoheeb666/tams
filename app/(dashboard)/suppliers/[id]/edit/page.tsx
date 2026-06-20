import { SupplierForm } from "@/components/suppliers/supplier-form";
import { getSupplierById } from "@/lib/actions/suppliers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditSupplierPage({ params }: { params: { id: string } }) {
  const supplier = await getSupplierById(params.id);
  if (!supplier) return <p>Not found</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Edit supplier</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Edit details</CardTitle>
        </CardHeader>
        <CardContent>
          <SupplierForm supplier={supplier} mode="edit" />
        </CardContent>
      </Card>
    </div>
  );
}
