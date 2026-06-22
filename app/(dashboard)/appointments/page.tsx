"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAppointments } from "@/lib/actions/appointments";
import { AppointmentList } from "@/components/appointments/appointment-list";
import { CalendarView } from "@/components/appointments/calendar-view";
import { Button } from "@/components/ui/button";
import { Calendar, List } from "lucide-react";
import type { Appointment, Service } from "@/lib/db/schema";

type SearchParams = {
  from?: string;
  to?: string;
};

type AppointmentRow = Appointment & {
  service: Pick<Service, "id" | "name" | "durationMinutes">;
};

export default function AppointmentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [appointments, setAppointments] = useState<AppointmentRow[]>([]);
  const [viewMode, setViewMode] = useState<"list" | "month" | "week" | "day">("month");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAppointments = async () => {
      const from = searchParams.from ?? new Date().toISOString().slice(0, 10);
      const to =
        searchParams.to ??
        new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

      const data = await getAppointments({ from, to });
      setAppointments(data);
      setLoading(false);
    };

    fetchAppointments();
  }, [searchParams]);

  if (loading) {
    return <div className="text-center py-8">Loading appointments...</div>;
  }

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

      <div className="flex flex-wrap gap-2">
        <Button
          variant={viewMode === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("month")}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Month
        </Button>
        <Button
          variant={viewMode === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("week")}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Week
        </Button>
        <Button
          variant={viewMode === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("day")}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Day
        </Button>
        <Button
          variant={viewMode === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4 mr-2" />
          List
        </Button>
      </div>

      {viewMode === "list" ? (
        <AppointmentList appointments={appointments} />
      ) : (
        <CalendarView
          appointments={appointments.map((apt) => ({
            id: apt.id,
            date: apt.appointmentDate,
            time: apt.startTime,
            service: {
              id: apt.service.id,
              name: apt.service.name,
              price: apt.priceCharged,
            },
            clientName: apt.customerName,
            clientPhone: apt.customerPhone,
            status: apt.status,
          }))}
          view={viewMode as "month" | "week" | "day"}
        />
      )}
    </div>
  );
}
