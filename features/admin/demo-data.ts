import { formatISO } from "date-fns";

export const demoAdminData = {
  analytics: {
    period: "letzte 30 Tage",
    bookings: 48,
    revenueChf: 12480,
    occupancyRate: 0.72,
    retentionRate: 0.42,
  },
  services: [
    {
      id: "svc-1",
      name: "Haarschnitt & Föhnen",
      category: "Hair",
      priceChf: 120,
      durationMinutes: 70,
      active: true,
    },
    {
      id: "svc-2",
      name: "Glossing",
      category: "Hair",
      priceChf: 55,
      durationMinutes: 35,
      active: true,
    },
  ],
  staff: [
    {
      id: "staff-1",
      name: "Vanessa Carosella",
      role: "owner",
      title: "Master Stylist",
      active: true,
    },
    {
      id: "staff-2",
      name: "Lena Demo",
      role: "staff",
      title: "Coloristin",
      active: true,
    },
  ],
  appointments: [
    {
      id: "appt-1",
      startAt: formatISO(new Date(Date.now() + 1000 * 60 * 60 * 24)),
      status: "scheduled" as const,
      customerName: "Demo Kundin",
      serviceName: "Haarschnitt & Föhnen",
      staffName: "Vanessa",
    },
    {
      id: "appt-2",
      startAt: formatISO(new Date(Date.now() + 1000 * 60 * 60 * 48)),
      status: "scheduled" as const,
      customerName: "Markus Beispiel",
      serviceName: "Glossing",
      staffName: "Lena",
    },
  ],
  customers: [
    {
      id: "cust-1",
      name: "Demo Kundin",
      email: "kunde@example.com",
      marketingOptIn: false,
      createdAt: formatISO(new Date(Date.now() - 1000 * 60 * 60 * 24 * 30)),
    },
  ],
  products: [
    {
      id: "prod-1",
      name: "Intense Care Mask",
      priceChf: 48,
      stock: 12,
      active: true,
    },
    {
      id: "prod-2",
      name: "Glow Finishing Oil",
      priceChf: 36,
      stock: 18,
      active: true,
    },
  ],
  settings: {
    openingHours: "Di–Sa 09:00–18:30",
    vatRate: "7.7% (configurierbar)",
    cancellationWindowHours: 24,
  },
  notifications: [
    { id: "notif-1", key: "booking_confirmation", subject: "Termin bestätigt", status: "aktiv" },
    { id: "notif-2", key: "cancellation", subject: "Termin storniert", status: "aktiv" },
  ],
};
