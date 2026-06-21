import Link from "next/link";
import { ServiceForm } from "@/components/services/service-form";
import { Button } from "@/components/ui/button";

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" asChild>
          <Link href="/services">← Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create service</h1>
          <p className="text-muted-foreground">Add a new service to Glitz Nails</p>
        </div>
      </div>

      <ServiceForm mode="create" />
    </div>
  );
}
