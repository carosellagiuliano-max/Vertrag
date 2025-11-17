export const heroCopy = {
  kicker: "Phase 5 · Shop & Checkout",
  title: "Schnittwerk – Buchung, Konto und neuer Shop in einem Flow",
  summary:
    "Öffentliche Site, Booking, Portal und jetzt ein kompletter Shop mit Warenkorb, Lagerstand und Stripe-Testkasse. Supabase oder Demo-Speicher wählbar.",
  ctas: [
    { label: "Termin buchen", href: "/booking" },
    { label: "Shop", href: "/shop" },
  ],
};

export const services = [
  {
    id: "signature-cut",
    supabaseId: "55555555-5555-5555-5555-555555555555",
    name: "Signature Cut & Style",
    category: "Hair",
    durationMinutes: 60,
    price: "CHF 120",
    description: "Präziser Haarschnitt mit personalisiertem Styling. Auf Wunsch inkl. Pflegeempfehlung.",
    tags: ["Kurz & Lang", "Unisex", "inkl. Waschen"],
  },
  {
    id: "color-glow",
    supabaseId: "66666666-6666-6666-6666-666666666666",
    name: "Color & Glow",
    category: "Color",
    durationMinutes: 90,
    price: "ab CHF 190",
    description: "Glossing, Balayage oder Ansatzfarbe mit Bonding-Pflege. Optimiert für gesunde Haare.",
    tags: ["Balayage", "Bonding", "Glossing"],
  },
  {
    id: "express-finish",
    name: "Express Finish",
    category: "Styling",
    durationMinutes: 30,
    price: "CHF 70",
    description: "Föhnen, Wellen oder Sleek-Look für Events. Schneller Slot mit Fokus auf Finish.",
    tags: ["Event-ready", "Heatcare", "Schnell"],
  },
  {
    id: "scalp-reset",
    name: "Scalp Reset",
    category: "Care",
    durationMinutes: 45,
    price: "CHF 95",
    description: "Detox für die Kopfhaut mit Peeling, Massage und Feuchtigkeitsaufbau.",
    tags: ["Sensitive", "Massage", "Hydration"],
  },
];

export const openingHours = [
  { day: "Montag", value: "Geschlossen" },
  { day: "Dienstag", value: "09:00 – 18:30" },
  { day: "Mittwoch", value: "09:00 – 18:30" },
  { day: "Donnerstag", value: "09:00 – 20:00" },
  { day: "Freitag", value: "09:00 – 18:30" },
  { day: "Samstag", value: "08:30 – 16:00" },
  { day: "Sonntag", value: "Geschlossen" },
];

export const contactInfo = {
  address: "Augustinergasse 12, 9000 St. Gallen",
  phone: "+41 71 000 00 00",
  email: "hallo@schnittwerk.ch",
  mapLink: "https://maps.google.com/?q=Augustinergasse+12+9000+St.+Gallen",
  transport: [
    "5 Min zu Fuss ab St. Gallen Marktplatz",
    "Parkhaus Citygarage 200m entfernt",
    "ÖV-Haltestelle Schibenertor in 2 Gehminuten",
  ],
};

export const bookingSlots = [
  { id: "slot-1", label: "Di 10:00", isRecommended: true },
  { id: "slot-2", label: "Di 11:30" },
  { id: "slot-3", label: "Do 17:00", isLowAvailability: true },
  { id: "slot-4", label: "Sa 10:30" },
];

export const seo = {
  title: "Schnittwerk | Salon OS für St. Gallen",
  description:
    "Moderne Salonplattform mit klaren Öffnungszeiten, Services und Buchungsstart. Datenschutz nach CH/EU-Standards.",
  keywords: ["Friseur St. Gallen", "Haircut", "Balayage", "Salon Buchung", "Schnittwerk"],
};
