"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { updateAppointmentStatus } from "@/lib/actions/appointments";
import type { Appointment, Service } from "@/lib/db/schema";
import type { AppointmentStatus } from "@/lib/validations/appointments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatAppointmentStatus, formatNaira } from "@/lib/utils";

type AppointmentRow = Appointment & {
  service: Pick<Service, "id" | "name" | "durationMinutes">;
};

const STATUS_VARIANT: Record<
  AppointmentStatus,
  "default" | "secondary" | "outline" | "warning" | "destructive"
> = {
  booked: "secondary",
  confirmed: "default",
  in_progress: "warning",
  completed: "outline",
  cancelled: "destructive",
  no_show: "destructive",
};

const NEXT_STATUS: Partial<Record<AppointmentStatus, AppointmentStatus[]>> = {
  booked: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled"],
};

export function AppointmentList({
  appointments,
}: {
  appointments: AppointmentRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (appointments.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          No appointments in this period.
        </CardContent>
      </Card>
    );
  }

  const grouped = appointments.reduce<Record<string, AppointmentRow[]>>(
    (acc, appointment) => {
      const key = appointment.appointmentDate;
      acc[key] = acc[key] ?? [];
      acc[key]!.push(appointment);
      return acc;
    },
    {},
  );

  function handleStatusChange(appointmentId: string, status: AppointmentStatus) {
    setError(null);
    startTransition(async () => {
      const result = await updateAppointmentStatus({ appointmentId, status });
      if (!result.success) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {Object.entries(grouped).map(([date, dayAppointments]) => (
        <div key={date} className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {new Date(`${date}T12:00:00`).toLocaleDateString("en-NG", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h2>
          <div className="space-y-3">
            {dayAppointments.map((appointment) => {
              const nextStatuses = NEXT_STATUS[appointment.status] ?? [];

              return (
                <Card key={appointment.id}>
                  <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{appointment.customerName}</p>
                        <Badge variant={STATUS_VARIANT[appointment.status]}>
                          {formatAppointmentStatus(appointment.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {appointment.startTime}–{appointment.endTime} ·{" "}
                        {appointment.service.name} · {formatNaira(appointment.priceCharged)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.customerPhone}
                        {appointment.notes ? ` · ${appointment.notes}` : ""}
                      </p>
                    </div>

                    {nextStatuses.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {nextStatuses.map((status) => (
                          <Button
                            key={status}
                            type="button"
                            size="sm"
                            variant={status === "cancelled" || status === "no_show" ? "outline" : "default"}
                            disabled={isPending}
                            loading={isPending}
                            onClick={() =>
                              handleStatusChange(appointment.id, status)
                            }
                          >
                            {formatAppointmentStatus(status)}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
