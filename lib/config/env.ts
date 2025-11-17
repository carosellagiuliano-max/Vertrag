const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const env = {
  supabaseUrl: SUPABASE_URL,
  supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  defaultSalonId: process.env.NEXT_PUBLIC_SALON_ID ?? "11111111-1111-1111-1111-111111111111",
  defaultStaffId: process.env.NEXT_PUBLIC_STAFF_ID ?? "22222222-2222-2222-2222-222222222222",
  timezone: process.env.NEXT_PUBLIC_TIMEZONE ?? "Europe/Zurich",
  baseUrl: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

export const hasSupabaseConfig = Boolean(env.supabaseUrl && env.supabaseServiceRoleKey);
export const hasStripeConfig = Boolean(env.stripeSecretKey);
