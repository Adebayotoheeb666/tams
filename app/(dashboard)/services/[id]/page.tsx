import Link from "next/link";
import { db } from "@/lib/db";
import { eq } from "drizzle-orm";
import { services } from "@/lib/db/schema";
import { ServiceForm } from "@/components/services/service-form";
import { Button } from "@/components/ui/button";
import { notFound } from "next/navigation";

export default async function EditServicePage({
  params,
}: {
  params: { id: string };
}) {
  const service = await db.query.services.findFirst({
    where: eq(services.id, params.id),
  });

  if (!service) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/services">← Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Edit service</h1>
          <p className="text-muted-foreground">{service.name}</p>
        </div>
      </div>

      <ServiceForm mode="edit" service={service} />
    </div>
  );
}
