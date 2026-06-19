import Link from "next/link";
import { getAppointments } from "@/lib/actions/appointments";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { Button } from "@/components/ui/button";

type SearchParams = {
  from?: string;
  to?: string;
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const from = searchParams.from ?? new Date().toISOString().slice(0, 10);
  const to =
    searchParams.to ??
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const appointments = await getAppointments({ from, to });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Appointments</h1>
          <p className="text-muted-foreground">
            Glitz Nails bookings — {appointments.length} in selected period
          </p>
        </div>
        <Button asChild>
          <Link href="/appointments/new">Book appointment</Link>
        </Button>
      </div>

      <form className="flex flex-wrap gap-3" method="get">
        <input
          type="date"
          name="from"
          defaultValue={from}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        />
        <input
          type="date"
          name="to"
          defaultValue={to}
          className="h-11 rounded-md border border-input bg-background px-3 text-sm"
        />
        <Button type="submit" variant="secondary">
          Filter
        </Button>
      </form>

      <AppointmentList appointments={appointments} />
    </div>
  );
}
