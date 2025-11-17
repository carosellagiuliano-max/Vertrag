import { demoProducts, type Product } from "./products";

export type DemoOrder = {
  id: string;
  email: string;
  items: { productId: string; quantity: number }[];
  totalChf: number;
  status: "paid" | "pending";
  createdAt: string;
};

let inMemoryProducts = [...demoProducts];
let demoOrders: DemoOrder[] = [];

export function listDemoProducts() {
  return inMemoryProducts;
}

export function getDemoProductBySlug(slug: string): Product | undefined {
  return inMemoryProducts.find((item) => item.slug === slug);
}

export function reserveDemoStock(lines: { productId: string; quantity: number }[]) {
  const updated: Product[] = [];
  for (const line of lines) {
    const product = inMemoryProducts.find((p) => p.id === line.productId);
    if (!product) throw new Error("Produkt nicht gefunden");
    if (product.stock < line.quantity) throw new Error("Nicht genug Bestand für " + product.name);
    product.stock -= line.quantity;
    updated.push(product);
  }
  inMemoryProducts = [...inMemoryProducts];
  return updated;
}

export function createDemoOrder(email: string, lines: { productId: string; quantity: number }[]) {
  const totalChf = lines.reduce((sum, line) => {
    const product = inMemoryProducts.find((p) => p.id === line.productId);
    return sum + (product?.priceChf ?? 0) * line.quantity;
  }, 0);
  const order: DemoOrder = {
    id: crypto.randomUUID(),
    email,
    items: lines,
    totalChf,
    status: "paid",
    createdAt: new Date().toISOString(),
  };
  demoOrders = [order, ...demoOrders].slice(0, 25);
  return order;
}

export function listDemoOrders(email?: string) {
  if (!email) return [];
  return demoOrders.filter((order) => order.email === email);
}
