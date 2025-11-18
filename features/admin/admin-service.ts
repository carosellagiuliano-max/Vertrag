// @ts-nocheck
import { differenceInMinutes, formatISO, parseISO, subDays } from "date-fns";
import { env, hasSupabaseConfig } from "@/lib/config/env";
import { getServiceRoleClient } from "@/lib/supabase/admin";
import { demoAdminData } from "./demo-data";

export type AdminDashboard = {
  analytics: {
    period: string;
    appointments: number;
    revenueChf: number;
    customers: number;
    occupancyRate: number;
    retentionRate: number;
  };
  services: {
    id: string;
    name: string;
    category?: string;
    priceChf: number;
    durationMinutes?: number;
    active: boolean;
  }[];
  staff: {
    id: string;
    name: string;
    role: string;
    title?: string | null;
    active: boolean;
  }[];
  appointments: {
    id: string;
    startAt: string;
    status: string;
    customerName?: string;
    serviceName?: string;
    staffName?: string;
  }[];
  customers: {
    id: string;
    name: string;
    email?: string;
    marketingOptIn?: boolean;
    createdAt?: string;
  }[];
  products: {
    id: string;
    name: string;
    priceChf: number;
    stock?: number;
    active: boolean;
  }[];
  settings: {
    openingHours?: string;
    vatRate?: string;
    cancellationWindowHours?: number;
  };
  notifications: { id: string; key: string; subject: string; status: string }[];
};

export function isAdminEmail(email?: string | null) {
  if (!email) return false;
  return email.toLowerCase() === env.adminEmail.toLowerCase();
}

export async function loadAdminDashboard(): Promise<AdminDashboard> {
  if (process.env.USE_DEMO === 'true') return demoAdminData;

  const client = getServiceRoleClient();
  if (!client) return demoAdminData;

  const windowStart = subDays(new Date(), 30).toISOString();

  const [servicesRes, staffRes, apptRes, customerRes, productRes, salonRes, bookingWindowRes, ordersRes] =
    await Promise.all([
      client
        .from("services")
        .select("id, name, price_chf, duration_minutes, active, service_categories(name)")
        .eq("salon_id", env.defaultSalonId)
        .order("name", { ascending: true }),
    client
      .from("staff")
      .select("id, display_name, role, title, active")
      .eq("salon_id", env.defaultSalonId)
      .order("display_name", { ascending: true }),
    client
      .from("appointments")
      .select("id, start_at, status, services(name), staff(display_name), customers(profiles(first_name,last_name))")
      .eq("salon_id", env.defaultSalonId)
      .order("start_at", { ascending: true })
      .limit(12),
    client
      .from("customers")
      .select("id, created_at, marketing_opt_in, profiles(first_name,last_name,email)")
      .eq("salon_id", env.defaultSalonId)
      .order("created_at", { ascending: false })
      .limit(12),
    client
      .from("products")
      .select("id, name, price_chf, active, product_stock(stock_on_hand)")
      .eq("salon_id", env.defaultSalonId)
      .order("name", { ascending: true }),
    client
      .from("salons")
      .select("timezone, currency")
      .eq("id", env.defaultSalonId)
      .maybeSingle(),
    client
      .from("appointments")
      .select("id, start_at, end_at, status, customer_id")
      .eq("salon_id", env.defaultSalonId)
      .gte("start_at", windowStart)
      .in("status", ["scheduled", "completed"]),
    client
      .from("orders")
      .select("total_chf, status, created_at")
      .eq("salon_id", env.defaultSalonId)
      .gte("created_at", windowStart),
    ]);

  const services =
    servicesRes.data?.map((row) => ({
      id: row.id,
      name: row.name,
      category: (row.service_categories as { name?: string } | null)?.name,
      priceChf: Number(row.price_chf ?? 0),
      durationMinutes: row.duration_minutes ?? undefined,
      active: Boolean(row.active),
    })) ?? demoAdminData.services;

  const staff =
    staffRes.data?.map((row) => ({
      id: row.id,
      name: row.display_name,
      role: row.role,
      title: row.title,
      active: Boolean(row.active),
    })) ?? demoAdminData.staff;

  const appointments =
    apptRes.data?.map((row) => ({
      id: row.id,
      startAt: row.start_at ?? formatISO(new Date()),
      status: row.status,
      serviceName: (row.services as { name?: string } | null)?.name,
      staffName: (row.staff as { display_name?: string } | null)?.display_name,
      customerName: (() => {
        const profile = (row.customers as { profiles?: { first_name?: string; last_name?: string } } | null)?.profiles;
        if (!profile) return undefined;
        return `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();
      })(),
    })) ?? demoAdminData.appointments;

  const customers =
    customerRes.data?.map((row) => {
      const profile = row.profiles as { first_name?: string; last_name?: string; email?: string } | null;
      return {
        id: row.id,
        name: `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim(),
        email: profile?.email,
        marketingOptIn: row.marketing_opt_in ?? undefined,
        createdAt: row.created_at ?? undefined,
      };
    }) ?? demoAdminData.customers;

  const products =
    productRes.data?.map((row) => ({
      id: row.id,
      name: row.name,
      priceChf: Number(row.price_chf ?? 0),
      stock: (row.product_stock as { stock_on_hand?: number } | null)?.stock_on_hand ?? undefined,
      active: Boolean(row.active),
    })) ?? demoAdminData.products;

  const settings = {
    openingHours: "Di–Sa 09:00–18:30",
    vatRate: `7.7% ${salonRes.data?.currency ? `(${salonRes.data.currency})` : ""}`.trim(),
    cancellationWindowHours: 24,
  };

  const analytics = (() => {
    if (bookingWindowRes.error || ordersRes.error) return demoAdminData.analytics;

    const bookings = bookingWindowRes.data ?? [];
    const orders = ordersRes.data ?? [];
    const totalBookingMinutes = bookings.reduce((sum, row) => {
      if (!row.start_at || !row.end_at) return sum + 60;
      return sum + Math.max(0, differenceInMinutes(parseISO(row.end_at), parseISO(row.start_at)));
    }, 0);
    const capacityMinutes = 30 * 8 * 60;
    const occupancyRate = Math.min(1, totalBookingMinutes / capacityMinutes);

    const revenueChf = orders
      .filter((row) => row.status === "paid")
      .reduce((sum, row) => sum + Number(row.total_chf ?? 0), 0);

    const uniqueCustomers = new Map<string, number>();
    bookings.forEach((row) => {
      if (!row.customer_id) return;
      uniqueCustomers.set(row.customer_id, (uniqueCustomers.get(row.customer_id) ?? 0) + 1);
    });
    const repeaters = Array.from(uniqueCustomers.values()).filter((count) => count > 1).length;
    const retentionRate = uniqueCustomers.size ? repeaters / uniqueCustomers.size : 0;
    const customers = uniqueCustomers.size;

    return {
      period: "letzte 30 Tage",
      appointments: bookings.length,
      revenueChf,
      customers,
      occupancyRate,
      retentionRate,
    } satisfies AdminDashboard["analytics"];
  })();

  return {
    analytics,
    services,
    staff,
    appointments,
    customers,
    products,
    settings,
    notifications: demoAdminData.notifications,
  };

export async function getServices() {
  if (process.env.USE_DEMO === 'true') return demoAdminData.services;
  const client = getServiceRoleClient();
  if (!client) return demoAdminData.services;

  const { data, error } = await client
    .from("services")
    .select("id, name, price_chf, duration_minutes, active, service_categories(name)")
    .eq("salon_id", env.defaultSalonId)
    .order("name", { ascending: true });

  if (error || !data) return demoAdminData.services;

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    category: (row.service_categories as { name?: string } | null)?.name,
    priceChf: Number(row.price_chf ?? 0),
    durationMinutes: row.duration_minutes ?? undefined,
    active: Boolean(row.active),
  }));
}

export async function getStaff() {
  if (process.env.USE_DEMO === 'true') return demoAdminData.staff;
  const client = getServiceRoleClient();
  if (!client) return demoAdminData.staff;

  const { data, error } = await client
    .from("staff")
    .select("id, display_name, role, title, active")
    .eq("salon_id", env.defaultSalonId)
    .order("display_name", { ascending: true });

  if (error || !data) return demoAdminData.staff;

  return data.map((row) => ({
    id: row.id,
    name: row.display_name,
    role: row.role,
    title: row.title,
    active: Boolean(row.active),
  }));
}

export async function getProducts() {
  if (process.env.USE_DEMO === 'true') return demoAdminData.products;
  const client = getServiceRoleClient();
  if (!client) return demoAdminData.products;

  const { data, error } = await client
    .from("products")
    .select("id, name, price_chf, active, product_stock(stock_on_hand)")
    .eq("salon_id", env.defaultSalonId)
    .order("name", { ascending: true });

  if (error || !data) return demoAdminData.products;

  return data.map((row) => ({
    id: row.id,
    name: row.name,
    priceChf: Number(row.price_chf ?? 0),
    stock: (row.product_stock as { stock_on_hand?: number } | null)?.stock_on_hand ?? undefined,
    active: Boolean(row.active),
  }));
}

export async function getNotificationTemplates() {
  if (process.env.USE_DEMO === 'true') return demoAdminData.notifications;
  const client = getServiceRoleClient();
  if (!client) return demoAdminData.notifications;

  const { data, error } = await client
    .from("notification_templates")
    .select("id, key: type, subject, status: active")
    .eq("salon_id", env.defaultSalonId)
    .order("type");

  if (error || !data) return demoAdminData.notifications;

  return data.map((row) => ({
    id: row.id,
    key: row.type,
    subject: row.subject,
    status: row.active ? "active" : "inactive",
  }));
}

export async function createService(service: Omit<AdminDashboard["services"][number], "id">) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("services")
    .insert({
      salon_id: env.defaultSalonId,
      name: service.name,
      price_chf: service.priceChf,
      duration_minutes: service.durationMinutes,
      active: service.active,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateService(id: string, service: Partial<AdminDashboard["services"][number]>) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("services")
    .update({
      name: service.name,
      price_chf: service.priceChf,
      duration_minutes: service.durationMinutes,
      active: service.active,
    })
    .eq("id", id)
    .eq("salon_id", env.defaultSalonId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteService(id: string) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client
    .from("services")
    .delete()
    .eq("id", id)
    .eq("salon_id", env.defaultSalonId);

  if (error) throw new Error(error.message);
}

export async function createStaff(staff: Omit<AdminDashboard["staff"][number], "id">) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("staff")
    .insert({
      salon_id: env.defaultSalonId,
      display_name: staff.name,
      role: staff.role,
      title: staff.title,
      active: staff.active,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateStaff(id: string, staff: Partial<AdminDashboard["staff"][number]>) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("staff")
    .update({
      display_name: staff.name,
      role: staff.role,
      title: staff.title,
      active: staff.active,
    })
    .eq("id", id)
    .eq("salon_id", env.defaultSalonId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteStaff(id: string) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client
    .from("staff")
    .delete()
    .eq("id", id)
    .eq("salon_id", env.defaultSalonId);

  if (error) throw new Error(error.message);
}

export async function createProduct(product: Omit<AdminDashboard["products"][number], "id">) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data: newProduct, error: insertError } = await client
    .from("products")
    .insert({
      salon_id: env.defaultSalonId,
      name: product.name,
      price_chf: product.priceChf,
      active: product.active,
    })
    .select()
    .single();

  if (insertError) throw new Error(insertError.message);

  // Initialize stock
  await client
    .from("product_stock")
    .insert({
      product_id: newProduct.id,
      salon_id: env.defaultSalonId,
      stock_on_hand: product.stock ?? 0,
    });

  return newProduct;
}

export async function updateProduct(id: string, product: Partial<AdminDashboard["products"][number]>) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const updates: any = {};
  if (product.name !== undefined) updates.name = product.name;
  if (product.priceChf !== undefined) updates.price_chf = product.priceChf;
  if (product.active !== undefined) updates.active = product.active;

  const { data, error } = await client
    .from("products")
    .update(updates)
    .eq("id", id)
    .eq("salon_id", env.defaultSalonId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (product.stock !== undefined) {
    await client
      .from("product_stock")
      .update({ stock_on_hand: product.stock })
      .eq("product_id", id);
  }

  return data;
}

export async function deleteProduct(id: string) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  await client.from("product_stock").delete().eq("product_id", id);
  const { error } = await client
    .from("products")
    .delete()
    .eq("id", id)
    .eq("salon_id", env.defaultSalonId);

  if (error) throw new Error(error.message);
}

export async function createNotificationTemplate(template: { type: string; subject: string; active: boolean }) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("notification_templates")
    .insert({
      salon_id: env.defaultSalonId,
      type: template.type,
      channel: 'email',
      language: 'de',
      subject: template.subject,
      active: template.active,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateNotificationTemplate(id: string, template: Partial<{ type: string; subject: string; active: boolean }>) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { data, error } = await client
    .from("notification_templates")
    .update({
      subject: template.subject,
      active: template.active,
    })
    .eq("id", id)
    .eq("salon_id", env.defaultSalonId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteNotificationTemplate(id: string) {
  const client = getServiceRoleClient();
  if (!client) throw new Error("Supabase client unavailable");

  const { error } = await client
    .from("notification_templates")
    .delete()
    .eq("id", id)
    .eq("salon_id", env.defaultSalonId);

  if (error) throw new Error(error.message);
}
}
