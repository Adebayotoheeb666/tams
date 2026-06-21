import Link from "next/link";
import { getAllServices } from "@/lib/actions/appointments";
import { ServicesList } from "@/components/services/services-list";
import { Button } from "@/components/ui/button";

export default async function ServicesPage() {
  const services = await getAllServices();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Services</h1>
          <p className="text-muted-foreground">
            Manage Glitz Nails services — {services.length} total
          </p>
        </div>
        <Button asChild>
          <Link href="/services/new">Add service</Link>
        </Button>
      </div>

      <ServicesList services={services} />
    </div>
  );
}
