"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { bookAppointment } from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Service } from "@/lib/db/schema";
import { koboToNaira } from "@/lib/utils";

export function AppointmentForm({ services }: { services: Service[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState(services[0]?.id ?? "");

  const selectedService = services.find((s) => s.id === selectedServiceId);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await bookAppointment({
        customerName: String(formData.get("customerName")),
        customerPhone: String(formData.get("customerPhone")),
        serviceId: String(formData.get("serviceId")),
        appointmentDate: String(formData.get("appointmentDate")),
        startTime: String(formData.get("startTime")),
        priceNaira: formData.get("priceNaira")
          ? Number(formData.get("priceNaira"))
          : undefined,
        notes: String(formData.get("notes") || ""),
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      router.push("/appointments");
      router.refresh();
    });
  }

  if (services.length === 0) {
    return (
      <p className="text-muted-foreground">
        No services available. Run <code>npm run db:seed</code> to add default nail services.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="customerName">Customer name</Label>
          <Input id="customerName" name="customerName" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerPhone">WhatsApp / phone</Label>
          <Input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            placeholder="+2348012345678"
            required
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="serviceId">Service</Label>
          <Select
            id="serviceId"
            name="serviceId"
            value={selectedServiceId}
            onChange={(e) => setSelectedServiceId(e.target.value)}
            required
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name} ({service.durationMinutes} min · ₦
                {koboToNaira(service.price).toLocaleString()})
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="appointmentDate">Date</Label>
          <Input id="appointmentDate" name="appointmentDate" type="date" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" name="startTime" type="time" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="priceNaira">Price (₦) — optional override</Label>
          <Input
            id="priceNaira"
            name="priceNaira"
            type="number"
            min={0}
            step="0.01"
            placeholder={
              selectedService
                ? String(koboToNaira(selectedService.price))
                : undefined
            }
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" name="notes" placeholder="Design preferences, allergies, etc." />
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Booking…" : "Book appointment"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
