"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNaira } from "@/lib/utils";

export type CalendarAppointment = {
  id: string;
  date: string;
  time: string;
  service: {
    id: string;
    name: string;
    price: number;
  };
  clientName: string;
  clientPhone: string;
  status: string;
};

type CalendarViewProps = {
  appointments: CalendarAppointment[];
  view: "month" | "week" | "day";
};

export function CalendarView({ appointments, view }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const weeks: (number | null)[][] = [];
    let week: (number | null)[] = new Array(startingDayOfWeek).fill(null);

    for (let day = 1; day <= daysInMonth; day++) {
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
      week.push(day);
    }

    if (week.length > 0) {
      while (week.length < 7) {
        week.push(null);
      }
      weeks.push(week);
    }

    return weeks;
  };

  const getWeekView = () => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    const week = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start);
      day.setDate(day.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const getAppointmentsForDate = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return appointments.filter((apt) => apt.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (view === "month") {
    const weeks = getMonthView();
    const monthName = currentDate.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{monthName}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
              }
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
              }
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 gap-1 border-b">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div key={day} className="bg-muted py-2 text-center text-sm font-semibold">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1 p-2">
              {weeks.map((week, weekIdx) =>
                week.map((day, dayIdx) => {
                  const date =
                    day !== null
                      ? new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
                      : null;
                  const dayAppointments = date ? getAppointmentsForDate(date) : [];
                  const isCurrentMonth = date && date.getMonth() === currentDate.getMonth();

                  return (
                    <div
                      key={`${weekIdx}-${dayIdx}`}
                      className={`min-h-24 border rounded p-1 text-xs ${
                        isCurrentMonth ? "bg-white" : "bg-muted/30"
                      }`}
                    >
                      {day && (
                        <>
                          <p className="font-semibold text-foreground">{day}</p>
                          <div className="mt-1 space-y-1">
                            {dayAppointments.slice(0, 2).map((apt) => (
                              <div
                                key={apt.id}
                                className={`rounded px-1 py-0.5 truncate ${getStatusColor(apt.status)}`}
                              >
                                {apt.time} {apt.service.name}
                              </div>
                            ))}
                            {dayAppointments.length > 2 && (
                              <p className="text-muted-foreground">
                                +{dayAppointments.length - 2} more
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (view === "week") {
    const weekDays = getWeekView();
    const weekLabel = `${weekDays[0].toLocaleDateString()} - ${weekDays[6].toLocaleDateString()}`;

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{weekLabel}</h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() - 7);
                setCurrentDate(newDate);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newDate = new Date(currentDate);
                newDate.setDate(newDate.getDate() + 7);
                setCurrentDate(newDate);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {weekDays.map((date) => {
            const dayAppointments = getAppointmentsForDate(date);
            return (
              <Card key={date.toISOString().split("T")[0]}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">
                    {date.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayAppointments.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No appointments</p>
                  ) : (
                    dayAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        className={`rounded p-2 text-xs space-y-1 ${getStatusColor(apt.status)}`}
                      >
                        <p className="font-medium">{apt.time}</p>
                        <p className="font-semibold">{apt.service.name}</p>
                        <p>{apt.clientName}</p>
                        <p className="font-medium">{formatNaira(apt.service.price)}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Day view
  const dayAppointments = getAppointmentsForDate(currentDate);
  const dayLabel = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{dayLabel}</h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setDate(newDate.getDate() - 1);
              setCurrentDate(newDate);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newDate = new Date(currentDate);
              newDate.setDate(newDate.getDate() + 1);
              setCurrentDate(newDate);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {dayAppointments.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No appointments scheduled for this day
            </CardContent>
          </Card>
        ) : (
          dayAppointments.map((apt) => (
            <Card key={apt.id}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-lg font-semibold">{apt.time}</p>
                      <p className="text-sm text-muted-foreground">{apt.clientName}</p>
                    </div>
                    <div className={`rounded px-2 py-1 text-xs font-medium ${getStatusColor(apt.status)}`}>
                      {apt.status}
                    </div>
                  </div>
                  <div className="space-y-1 border-t pt-2">
                    <p className="font-medium">{apt.service.name}</p>
                    <p className="text-sm text-muted-foreground">{apt.clientPhone}</p>
                    <p className="text-lg font-semibold">{formatNaira(apt.service.price)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
