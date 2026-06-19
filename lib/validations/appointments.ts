import { z } from "zod";

export const appointmentStatusSchema = z.enum([
  "booked",
  "confirmed",
  "in_progress",
  "completed",
  "cancelled",
  "no_show",
]);

export const bookAppointmentSchema = z.object({
  customerName: z.string().min(1, "Customer name is required").max(200),
  customerPhone: z.string().min(7, "Phone number is required").max(20),
  serviceId: z.string().uuid(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM"),
  priceNaira: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export const updateAppointmentStatusSchema = z.object({
  appointmentId: z.string().uuid(),
  status: appointmentStatusSchema,
});

export const ledgerFilterSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  accountId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(30),
});

export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["staff", "accountant"]),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;
export type AppointmentStatus = z.infer<typeof appointmentStatusSchema>;
