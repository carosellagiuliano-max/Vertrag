// @ts-nocheck
import { cookies } from "next/headers";
import Stripe from "stripe";
import { env, hasStripeConfig, hasSupabaseConfig } from "@/lib/config/env";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { formatCurrency } from "@/lib/utils";
import { getDemoProductBySlug, listDemoOrders, listDemoProducts, reserveDemoStock, createDemoOrder } from "./demo-store";
import { demoProducts, type Product } from "./products";

export type CartLine = { productId: string; quantity: number };
export type CartDetail = CartLine & { product?: Product; lineTotal: number };

const CART_COOKIE = "shop-cart";

function readCart() {
  const raw = cookies().get(CART_COOKIE)?.value;
  if (!raw) return [] as CartLine[];
  try {
    const parsed = JSON.parse(raw) as CartLine[];
    return parsed.filter((line) => line.quantity > 0 && line.productId);
  } catch (error) {
    console.error("Failed to parse cart", error);
    return [] as CartLine[];
  }
}

function writeCart(lines: CartLine[]) {
  cookies().set(CART_COOKIE, JSON.stringify(lines), { httpOnly: true, path: "/" });
}

export function getCart() {
  return readCart();
}

export function addToCart(lines: CartLine[], item: CartLine) {
  const existing = lines.find((line) => line.productId === item.productId);
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    lines.push(item);
  }
  writeCart(lines.filter((line) => line.quantity > 0));
  return lines;
}

export function removeFromCart(lines: CartLine[], productId: string) {
  writeCart(lines.filter((line) => line.productId !== productId));
  return readCart();
}

export function clearCart() {
  cookies().delete(CART_COOKIE);
}

export async function getCartDetails(): Promise<{ lines: CartDetail[]; total: number }> {
  const lines = readCart();
  const products = await listProducts();
  const detailed = lines
    .map((line) => {
      const product = products.find((p) => p.id === line.productId);
      const lineTotal = (product?.priceChf ?? 0) * line.quantity;
      return { ...line, product, lineTotal };
    })
    .filter((line) => line.product);

  const total = detailed.reduce((sum, line) => sum + line.lineTotal, 0);
  return { lines: detailed, total };
}

export async function listProducts(): Promise<Product[]> {
  if (process.env.USE_DEMO === 'true') {
    return listDemoProducts();
  }

  const client = getServiceRoleClient();
  if (!client) return demoProducts;

  const { data, error } = await client
    .from("products")
    .select("id, slug, name, description, price_chf, image_url, badges, product_stock(stock_on_hand)")
    .eq("salon_id", env.defaultSalonId)
    .eq("active", true)
    .order("name", { ascending: true });

  if (error || !data) return demoProducts;

  return data.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    priceChf: Number(row.price_chf ?? 0),
    imageUrl: row.image_url ?? undefined,
    badges: (row.badges as string[]) ?? [],
    stock: (row.product_stock as { stock_on_hand?: number } | null)?.stock_on_hand ?? 0,
  }));
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  if (process.env.USE_DEMO === 'true') {
    return getDemoProductBySlug(slug);
  }

  const client = getServiceRoleClient();
  if (!client) return getDemoProductBySlug(slug);

  const { data } = await client
    .from("products")
    .select("id, slug, name, description, price_chf, image_url, badges, product_stock(stock_on_hand)")
    .eq("salon_id", env.defaultSalonId)
    .eq("slug", slug)
    .eq("active", true)
    .maybeSingle();

  if (!data) return getDemoProductBySlug(slug);

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    description: data.description ?? "",
    priceChf: Number(data.price_chf ?? 0),
    imageUrl: data.image_url ?? undefined,
    badges: (data.badges as string[]) ?? [],
    stock: (data.product_stock as { stock_on_hand?: number } | null)?.stock_on_hand ?? 0,
  };
}

async function getOrCreateCustomer(client: ReturnType<typeof getServiceRoleClient>, email: string, name?: string) {
  const users = await client!.auth.admin.listUsers({ email, perPage: 1 });
  let userId = users.data?.users?.[0]?.id;

  if (!userId) {
    const created = await client!.auth.admin.createUser({ email, password: crypto.randomUUID(), email_confirm: true });
    if (created.error || !created.data.user) throw new Error("Konto konnte nicht erstellt werden");
    userId = created.data.user.id;
  }

  await client
    .from("profiles")
    .upsert({
      id: userId,
      salon_id: env.defaultSalonId,
      first_name: name?.split(" ")[0] ?? "Shop",
      last_name: name?.split(" ").slice(1).join(" ") || "Kunde",
      preferred_language: "de-CH",
    })
    .throwOnError();

  const { data: customer } = await client
    .from("customers")
    .select("id")
    .eq("profile_id", userId)
    .eq("salon_id", env.defaultSalonId)
    .maybeSingle();

  if (customer?.id) return customer.id;

  const createdCustomer = await client
    .from("customers")
    .insert({ profile_id: userId, salon_id: env.defaultSalonId, preferred_language: "de-CH" })
    .select("id")
    .single();

  if (createdCustomer.error || !createdCustomer.data?.id) throw new Error("Kunde konnte nicht angelegt werden");
  return createdCustomer.data.id;
}

export async function placeOrder(params: {
  email: string;
  name?: string;
  lines: CartLine[];
}): Promise<{ ok: boolean; message: string; redirectUrl?: string; orderId?: string }> {
  if (!params.lines.length) return { ok: false, message: "Warenkorb leer" };

  if (process.env.USE_DEMO === 'true') {
    reserveDemoStock(params.lines);
    const order = createDemoOrder(params.email, params.lines);
    clearCart();
    return {
      ok: true,
      message: `Demo-Bestellung über ${formatCurrency(order.totalChf)} erfasst`,
      orderId: order.id,
    };
  }

  const client = getServiceRoleClient();
  if (!client) return { ok: false, message: "Supabase fehlt" };

  const productIds = params.lines.map((line) => line.productId);
  const { data: products, error } = await client
    .from("products")
    .select("id, name, price_chf, product_stock(stock_on_hand)")
    .in("id", productIds)
    .eq("salon_id", env.defaultSalonId)
    .eq("active", true);

  if (error || !products?.length) return { ok: false, message: "Produkte nicht gefunden" };

  for (const line of params.lines) {
    const product = products.find((p) => p.id === line.productId);
    const stock = (product?.product_stock as { stock_on_hand?: number } | null)?.stock_on_hand ?? 0;
    if (!product) return { ok: false, message: "Produkt fehlt" };
    if (stock < line.quantity) return { ok: false, message: `Nur ${stock}x verfügbar für ${product.name}` };
  }

  const customerId = await getOrCreateCustomer(client, params.email, params.name);

  for (const line of params.lines) {
    const product = products.find((p) => p.id === line.productId);
    const stock = (product?.product_stock as { stock_on_hand?: number } | null)?.stock_on_hand ?? 0;
    const newStock = Math.max(0, stock - line.quantity);
    const { error: stockError } = await client
      .from("product_stock")
      .update({ stock_on_hand: newStock })
      .eq("product_id", line.productId);
    if (stockError) return { ok: false, message: stockError.message };
  }

  const totalChf = params.lines.reduce((sum, line) => {
    const product = products.find((p) => p.id === line.productId);
    return sum + Number(product?.price_chf ?? 0) * line.quantity;
  }, 0);

  const orderInsert = await client
    .from("orders")
    .insert({
      salon_id: env.defaultSalonId,
      customer_id: customerId,
      status: hasStripeConfig ? "pending" : "paid",
      total_chf: totalChf,
      currency: "CHF",
    })
    .select("id")
    .single();

  if (orderInsert.error || !orderInsert.data?.id) return { ok: false, message: orderInsert.error?.message ?? "Bestellung fehlgeschlagen" };

  const orderId = orderInsert.data.id as string;

  const itemsPayload = params.lines.map((line) => {
    const product = products.find((p) => p.id === line.productId)!;
    return {
      order_id: orderId,
      product_id: product.id,
      quantity: line.quantity,
      unit_price_chf: Number(product.price_chf ?? 0),
    };
  });

  await client.from("order_items").insert(itemsPayload).throwOnError();

  if (hasStripeConfig && env.stripeSecretKey) {
    const stripe = new Stripe(env.stripeSecretKey, { apiVersion: "2024-11-20" });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      success_url: `${env.baseUrl}/portal?payment=success&order=${orderId}`,
      cancel_url: `${env.baseUrl}/checkout?cancel=1`,
      customer_email: params.email,
      line_items: params.lines.map((line) => {
        const product = products.find((p) => p.id === line.productId)!;
        return {
          quantity: line.quantity,
          price_data: {
            currency: "chf",
            unit_amount: Math.round(Number(product.price_chf ?? 0) * 100),
            product_data: { name: product.name },
          },
        };
      }),
    });

    await client.from("orders").update({ stripe_session_id: session.id }).eq("id", orderId);
    clearCart();
    return { ok: true, message: "Weiter zu Stripe Testkasse", redirectUrl: session.url ?? undefined, orderId };
  }

  await client.from("orders").update({ status: "paid" }).eq("id", orderId);
  clearCart();
  return { ok: true, message: `Bestellung über ${formatCurrency(totalChf)} gespeichert`, orderId };
}

export async function loadOrders(email?: string) {
  if (!email) return [];
  if (process.env.USE_DEMO === 'true') return listDemoOrders(email);

  const client = getServiceRoleClient();
  if (!client) return listDemoOrders(email);

  const userLookup = await client.auth.admin.listUsers({ email, perPage: 1 });
  const userId = userLookup.data?.users?.[0]?.id;
  if (!userId) return listDemoOrders(email);

  const { data: customer } = await client
    .from("customers")
    .select("id")
    .eq("profile_id", userId)
    .eq("salon_id", env.defaultSalonId)
    .maybeSingle();
  if (!customer?.id) return listDemoOrders(email);

  const { data } = await client
    .from("orders")
    .select("id, status, total_chf, currency, created_at")
    .eq("customer_id", customer.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return (
    data?.map((row) => ({
      id: row.id,
      status: row.status,
      totalChf: Number(row.total_chf ?? 0),
      currency: row.currency ?? "CHF",
      createdAt: row.created_at,
    })) ?? []
  );
}

