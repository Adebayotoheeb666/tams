import Link from "next/link";
import { getSuppliers } from "@/lib/actions/suppliers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function SuppliersPage() {
  const suppliers = await getSuppliers();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">Manage supplier records and procurement.</p>
        </div>
        <Button asChild>
          <Link href="/suppliers/new">New supplier</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Supplier list</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {suppliers.length === 0 ? (
            <p className="p-6 text-center text-muted-foreground">No suppliers yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/40 text-left">
                    <th className="p-3 font-medium">Name</th>
                    <th className="p-3 font-medium">Contact</th>
                    <th className="p-3 font-medium">Phone</th>
                    <th className="p-3 font-medium">Email</th>
                    <th className="p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {suppliers.map((s) => (
                    <tr key={s.id} className="border-b last:border-0">
                      <td className="p-3">{s.name}</td>
                      <td className="p-3">{s.contactName ?? "—"}</td>
                      <td className="p-3">{s.phone ?? "—"}</td>
                      <td className="p-3">{s.email ?? "—"}</td>
                      <td className="p-3">
                        <Link href={`/suppliers/${s.id}`} className="text-primary underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
