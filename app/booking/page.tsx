import type { Metadata } from "next";
import { BookingClient } from "./booking-client";

export const metadata: Metadata = {
  title: "Buchung & Konto | Schnittwerk",
  description: "Phase 4: Buchungs-Engine mit Account und Portal-Integration.",
};

export default function BookingPage() {
  return <BookingClient />;
}
