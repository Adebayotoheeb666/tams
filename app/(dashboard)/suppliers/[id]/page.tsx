import Link from "next/link";
import { getSupplierById } from "@/lib/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SupplierPage({ params }: { params: { id: string } }) {
  const supplier = await getSupplierById(params.id);
  if (!supplier) return <p>Not found</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{supplier.name}</h1>
          <p className="text-muted-foreground">{supplier.contactName ?? ''}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/suppliers">Back</Link>
          </Button>
          <Button asChild>
            <Link href={`/suppliers/${supplier.id}/edit`}>Edit</Link>
          </Button>
          <form action={async () => { await fetch(`/api/suppliers/${supplier.id}/archive`, { method: 'POST' }); location.href = '/suppliers'; }}>
            <Button type="submit" variant="destructive">Archive</Button>
          </form>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Phone:</strong> {supplier.phone ?? '—'}</p>
          <p><strong>Email:</strong> {supplier.email ?? '—'}</p>
          <p><strong>Address:</strong> {supplier.address ?? '—'}</p>
        </CardContent>
      </Card>
    </div>
  );
}
