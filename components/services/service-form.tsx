"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Service } from "@/lib/db/schema";
import {
  createService,
  updateService,
  toggleServiceActive,
} from "@/lib/actions/appointments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { nairaToKobo, koboToNaira } from "@/lib/utils";

interface ServiceFormProps {
  mode: "create" | "edit";
  service?: Service;
}

export function ServiceForm({ mode, service }: ServiceFormProps) {
  const router = useRouter();
  const [name, setName] = useState(service?.name ?? "");
  const [durationMinutes, setDurationMinutes] = useState(
    service?.durationMinutes ?? 30,
  );
  const [priceNaira, setPriceNaira] = useState(
    service ? koboToNaira(service.price) : "",
  );
  const [materialsConsumed, setMaterialsConsumed] = useState(
    service?.materialsConsumed ?? "",
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
const price = Math.round(nairaToKobo(parseFloat(String(priceNaira || "0"))));

      if (mode === "create") {
        const result = await createService({
          name,
          durationMinutes,
          price,
          materialsConsumed,
        });

        if (result.success) {
          toast.success("Service created");
          router.push("/services");
        } else {
          toast.error(result.error);
        }
      } else if (service) {
        const result = await updateService(service.id, {
          name,
          durationMinutes,
          price,
          materialsConsumed,
        });

        if (result.success) {
          toast.success("Service updated");
          router.push("/services");
        } else {
          toast.error(result.error);
        }
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async () => {
    if (!service) return;

    setIsLoading(true);
    try {
      const result = await toggleServiceActive(
        service.id,
        !service.isActive,
      );

      if (result.success) {
        toast.success(
          result.data.isActive ? "Service activated" : "Service deactivated",
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border p-6">
        <div className="space-y-2">
          <Label htmlFor="name">Service name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., French Manicure"
            required
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (minutes)</Label>
            <Input
              id="duration"
              type="number"
              min="1"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price (₦)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={priceNaira}
              onChange={(e) => setPriceNaira(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="materials">Materials consumed</Label>
          <Textarea
            id="materials"
            value={materialsConsumed}
            onChange={(e) => setMaterialsConsumed(e.target.value)}
            placeholder="e.g., French polish, nail extensions..."
            className="resize-none"
            rows={3}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={isLoading} loading={isLoading}>
            {mode === "create" ? "Create service" : "Save changes"}
          </Button>

          {mode === "edit" && service && (
            <Button
              type="button"
              variant="outline"
              disabled={isLoading}
              loading={isLoading}
              onClick={handleToggleActive}>
              {service.isActive ? "Deactivate" : "Activate"}
            </Button>
          )}

          <Button
            type="button"
            variant="ghost"
            disabled={isLoading}
            onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
