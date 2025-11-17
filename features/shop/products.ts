export type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceChf: number;
  imageUrl?: string;
  badges?: string[];
  stock: number;
};

export const demoProducts: Product[] = [
  {
    id: "prod-care-mask",
    slug: "intense-care-mask",
    name: "Intense Care Mask",
    description: "Reparierende Maske mit Bonding-Komplex für geschädigtes Haar. Vegan, ohne Silikone.",
    priceChf: 48,
    badges: ["Vegan", "Repair", "Salon-only"],
    stock: 12,
  },
  {
    id: "prod-glow-oil",
    slug: "glow-finishing-oil",
    name: "Glow Finishing Oil",
    description: "Leichtes Öl für Glanz und Hitzeschutz bis 220°C. Ideal nach dem Styling.",
    priceChf: 36,
    badges: ["Heatcare", "Anti-Frizz"],
    stock: 18,
  },
  {
    id: "prod-scalp-serum",
    slug: "scalp-balance-serum",
    name: "Scalp Balance Serum",
    description: "Beruhigendes Serum mit Niacinamid und Panthenol für sensible Kopfhaut.",
    priceChf: 42,
    badges: ["Sensitive", "Leave-in"],
    stock: 9,
  },
  {
    id: "prod-volume-foam",
    slug: "volume-memory-foam",
    name: "Volume Memory Foam",
    description: "Leichter Schaum mit Memory-Effekt für Ansatzvolumen ohne Kleben.",
    priceChf: 32,
    badges: ["Volumen", "Leicht"],
    stock: 15,
  },
];
