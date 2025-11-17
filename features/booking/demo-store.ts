import { addMinutes } from "date-fns";
import { env } from "@/lib/config/env";

export type DemoBooking = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  serviceId: string;
  serviceName: string;
  startAt: string;
  endAt: string;
  status: "scheduled" | "cancelled" | "completed" | "no_show";
  note?: string;
};

let demoBookings: DemoBooking[] = [
  {
    id: "demo-1",
    email: "admin@schnittwerk.test",
    firstName: "Vanessa",
    lastName: "Carosella",
    phone: "+41 71 000 00 00",
    serviceId: "55555555-5555-5555-5555-555555555555",
    serviceName: "Haarschnitt & Föhnen",
    startAt: new Date().toISOString(),
    endAt: addMinutes(new Date(), 70).toISOString(),
    status: "scheduled",
    note: "Ersttermin zum Kennenlernen",
  },
];

export function persistDemoBooking(entry: Omit<DemoBooking, "id" | "status"> & { status?: DemoBooking["status"] }) {
  const payload: DemoBooking = {
    ...entry,
    id: `demo-${Date.now()}`,
    status: entry.status ?? "scheduled",
  };
  demoBookings = [payload, ...demoBookings];
  return payload;
}

export function listDemoBookings(email?: string) {
  if (!email) return demoBookings;
  return demoBookings.filter((item) => item.email.toLowerCase() === email.toLowerCase());
}

export function cancelDemoBooking(id: string, reason?: string) {
  const current = demoBookings.find((item) => item.id === id);
  if (!current) return null;
  current.status = "cancelled";
  current.note = reason ?? current.note;
  return current;
}

export function getDemoSalonContext() {
  return {
    salonId: env.defaultSalonId,
    staffId: env.defaultStaffId,
  };
}
