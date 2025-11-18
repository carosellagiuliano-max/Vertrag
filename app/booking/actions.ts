// @ts-nocheck
"use server";

import { formatISO, parseISO } from "date-fns";
import { z } from "zod";
import { sendBookingConfirmation } from "@/lib/notifications/email";
import { createBooking } from "@/features/booking/booking-service";

const bookingSchema = z.object({
  email: z.string().email("Gültige E-Mail"),
  password: z.string().min(8, "Passwort mind. 8 Zeichen"),
  firstName: z.string().min(1, "Vorname fehlt"),
  lastName: z.string().min(1, "Nachname fehlt"),
  phone: z.string().optional(),
  serviceId: z.string().min(1, "Service wählen"),
  serviceName: z.string().min(1, "Service wählen"),
  durationMinutes: z.coerce.number().min(10),
  startAt: z.string().transform((value) => formatISO(parseISO(value))),
  note: z.string().optional(),
});

type BookingState = { ok: boolean; message?: string; result?: unknown };

export async function bookAppointmentAction(
  _: BookingState | undefined,
  formData: FormData,
): Promise<BookingState> {
  const parsed = bookingSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    serviceId: formData.get("serviceId"),
    serviceName: formData.get("serviceName"),
    durationMinutes: formData.get("durationMinutes"),
    startAt: formData.get("startAt"),
    note: formData.get("note"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Validierung fehlgeschlagen" };
  }

  try {
    const result = await createBooking(parsed.data);
    await sendBookingConfirmation({
      to: parsed.data.email,
      subject: "Terminbestätigung",
      body: `Termin bestätigt am ${parsed.data.startAt}`,
    });
    return { ok: true, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Buchung fehlgeschlagen";
    return { ok: false, message };
  }
}
