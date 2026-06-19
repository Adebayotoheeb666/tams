import Link from "next/link";
import { getServices } from "@/lib/actions/appointments";
import { AppointmentForm } from "@/components/appointments/appointment-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function NewAppointmentPage() {
  const services = await getServices();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Book appointment</h1>
          <p className="text-muted-foreground">
            Schedule a Glitz Nails service for a customer.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/appointments">Back to calendar</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Appointment details</CardTitle>
        </CardHeader>
        <CardContent>
          <AppointmentForm services={services} />
        </CardContent>
      </Card>
    </div>
  );
}
