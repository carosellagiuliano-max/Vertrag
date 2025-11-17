import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SiteShell } from "@/components/layout/site-shell";
import { Toaster } from "@/components/ui/use-toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Schnittwerk | Admin, Booking & Konto für St. Gallen",
  description: "Phase 7: Analytics, Hardening und Tests für Admin, Booking, Shop und Portal.",
  metadataBase: new URL("https://schnittwerk.example"),
  keywords: ["Friseur St. Gallen", "Hair", "Balayage", "Salon", "Buchung"],
  openGraph: {
    title: "Schnittwerk | Admin, Buchung & Portal",
    description: "Salon-OS mit Admin-RBAC, Services, Kundenkonto und Buchungsengine. Schweizer Datenschutz inklusive.",
    locale: "de_CH",
    type: "website",
    url: "https://schnittwerk.example",
  },
  alternates: {
    canonical: "https://schnittwerk.example",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="de">
      <body className={`${geistSans.variable} ${geistMono.variable} bg-surface text-ink antialiased`}>
        <SiteShell>{children}</SiteShell>
        <Toaster />
      </body>
    </html>
  );
}
