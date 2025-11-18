// @ts-nocheck
import { addMinutes, formatISO, parseISO } from "date-fns";
import { cookies } from "next/headers";
import { env, hasSupabaseConfig } from "@/lib/config/env";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { validateBookingRules, type BookingRuleContext } from "@/lib/domain/booking-rules";
import { cancelDemoBooking, getDemoSalonContext, listDemoBookings, persistDemoBooking } from "./demo-store";

export type BookingInput = {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  serviceId: string;
  serviceName: string;
  startAt: string;
  durationMinutes: number;
  note?: string;
};

export type BookingResult = {
  appointmentId: string;
  status: "scheduled" | "cancelled" | "completed" | "no_show";
  message: string;
  startAt: string;
  endAt: string;
};

export async function createBooking(input: BookingInput): Promise<BookingResult> {
  const startAt = parseISO(input.startAt);
  const endAt = addMinutes(startAt, input.durationMinutes);
  const slot = { start: startAt, end: endAt };

  if (process.env.USE_DEMO === 'true') {
    // Demo mode: simple rule check without DB queries
    const demoContext: BookingRuleContext = {
      minLeadTimeMinutes: 60,
      maxAdvanceDays: 90,
      openingHours: { startHour: 9, endHour: 19 },
      existingSlots: [],
    };
    const validation = validateBookingRules(slot, demoContext);
    if (!validation.ok) {
      throw new Error(validation.reasons.join("; "));
    }

    const booking = persistDemoBooking({
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      serviceId: input.serviceId,
      serviceName: input.serviceName,
      startAt: formatISO(startAt),
      endAt: formatISO(endAt),
      note: input.note,
    });
    cookies().set("demo-user-email", input.email, { httpOnly: true });
    return {
      appointmentId: booking.id,
      status: booking.status,
      message: "Demo-Buchung gespeichert (Speicher zur Laufzeit)",
      startAt: booking.startAt,
      endAt: booking.endAt,
    };
  }

  const client = getServiceRoleClient();
  if (!client) {
    throw new Error("Supabase-Konfiguration fehlt");
  }

  // Fetch booking rules context
  const salonId = env.defaultSalonId;
  const [{ data: openingHours }, { data: staff }, { data: existingAppointments }] = await Promise.all([
    client.from("salons").select("opening_hours").eq("id", salonId).maybeSingle(),
    client.from("staff").select("id, absences").eq("id", env.defaultStaffId).eq("active", true).maybeSingle(),
    client.from("appointments").select("start_at, end_at").eq("salon_id", salonId).eq("status", "scheduled"),
  ]);

  const ruleContext: BookingRuleContext = {
    minLeadTimeMinutes: 60,
    maxAdvanceDays: 90,
    openingHours: openingHours?.opening_hours?.[0] ?? { startHour: 9, endHour: 19 },
    existingSlots: existingAppointments?.map((a: any) => ({
      start: parseISO(a.start_at),
      end: parseISO(a.end_at),
    })) ?? [],
  };

  const validation = validateBookingRules(slot, ruleContext);
  if (!validation.ok) {
    throw new Error(`Buchung nicht möglich: ${validation.reasons.join(", ")}`);
  }

  const { data: existingUsers } = await client.auth.admin.listUsers({ email: input.email, perPage: 1 });
  let userId = existingUsers?.users?.[0]?.id;

  if (userId) {
    if (!input.password) {
      throw new Error("Passwort erforderlich, um bestehendes Konto zu nutzen");
    }
    const { data: signIn, error } = await client.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error || !signIn?.user) {
      throw new Error("E-Mail oder Passwort falsch");
    }
    userId = signIn.user.id;
  } else {
    if (!input.password) {
      throw new Error("Passwort erforderlich, um neues Konto anzulegen");
    }
    const created = await client.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: { first_name: input.firstName, last_name: input.lastName },
    });
    if (created.error || !created.data.user) {
      throw new Error(created.error?.message ?? "Konto konnte nicht erstellt werden");
    }
    userId = created.data.user.id;
  }

  await client.from("profiles").upsert({
    id: userId,
    salon_id: env.defaultSalonId,
    first_name: input.firstName,
    last_name: input.lastName,
    phone: input.phone,
    preferred_language: "de-CH",
  });

  const { data: existingCustomer } = await client
    .from("customers")
    .select("id")
    .eq("profile_id", userId)
    .eq("salon_id", env.defaultSalonId)
    .maybeSingle();

  const customerId =
    existingCustomer?.id ??
    (await client
      .from("customers")
      .insert({ profile_id: userId, salon_id: env.defaultSalonId, preferred_language: "de-CH" })
      .select("id")
      .single()).data?.id;

  if (!customerId) {
    throw new Error("Kunde konnte nicht angelegt werden");
  }

  const payload = {
    salon_id: env.defaultSalonId,
    customer_id: customerId,
    staff_id: env.defaultStaffId,
    service_id: input.serviceId,
    start_at: formatISO(startAt),
    end_at: formatISO(endAt),
    status: "scheduled",
    notes: input.note,
  };

  const { data, error } = await client.from("appointments").insert(payload).select("id, start_at, end_at").single();
  if (error || !data) {
    throw new Error(error?.message ?? "Termin konnte nicht gespeichert werden");
  }

  cookies().set("demo-user-email", input.email, { httpOnly: true });
  return {
    appointmentId: data.id,
    status: "scheduled",
    message: "Termin bestätigt und gespeichert",
    startAt: data.start_at,
    endAt: data.end_at,
  };
}

export async function loadUpcomingAppointments(email?: string) {
  if (process.env.USE_DEMO === 'true' || !email) {
    return listDemoBookings(email);
  }

  const client = getServiceRoleClient();
  if (!client) return listDemoBookings(email);

  const userLookup = await client.auth.admin.listUsers({ email, perPage: 1 });
  const userId = userLookup.data?.users?.[0]?.id;
  if (!userId) return listDemoBookings(email);

  const { data: customer } = await client
    .from("customers")
    .select("id")
    .eq("profile_id", userId)
    .eq("salon_id", env.defaultSalonId)
    .maybeSingle();
  if (!customer?.id) return listDemoBookings(email);

  const { data } = await client
    .from("appointments")
    .select("id, start_at, end_at, status, notes, services(name)")
    .eq("customer_id", customer.id)
    .order("start_at", { ascending: true })
    .limit(10);

  return (
    data?.map((item) => ({
      id: item.id,
      startAt: item.start_at,
      endAt: item.end_at,
      status: item.status,
      note: item.notes,
      serviceName: item.services?.name ?? "Termin",
    })) ?? []
  );
}

export async function cancelBooking(appointmentId: string, reason?: string) {
  if (process.env.USE_DEMO === 'true') {
    return cancelDemoBooking(appointmentId, reason);
  }
  const client = getServiceRoleClient();
  if (!client) return cancelDemoBooking(appointmentId, reason);
  const { data, error } = await client
    .from("appointments")
    .update({ status: "cancelled", cancellation_reason: reason, cancelled_at: formatISO(new Date()) })
    .eq("id", appointmentId)
    .select("id, status, notes")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export function getDefaultBookingContext() {
  if (process.env.USE_DEMO === 'true') return getDemoSalonContext();
  return { salonId: env.defaultSalonId, staffId: env.defaultStaffId };
}
