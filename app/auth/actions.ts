"use server";

import { cookies } from "next/headers";
import { z } from "zod";
import { hasSupabaseConfig } from "@/lib/config/env";
import { getServiceRoleClient } from "@/lib/supabase/admin";

const authSchema = z.object({
  email: z.string().email("Gültige E-Mail angeben"),
  password: z.string().min(8, "Mindestens 8 Zeichen"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type AuthState = { ok: boolean; message?: string };

export async function registerAction(_: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const parsed = authSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Ungültige Eingabe" };
  }

  const { email, password, firstName, lastName } = parsed.data;

  if (!hasSupabaseConfig) {
    cookies().set("demo-user-email", email, { httpOnly: true });
    return { ok: true, message: "Demo-Login aktiv" };
  }

  const client = getServiceRoleClient();
  if (!client) return { ok: false, message: "Supabase fehlt" };

  const created = await client.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName },
  });

  if (created.error) {
    return { ok: false, message: created.error.message };
  }

  cookies().set("demo-user-email", email, { httpOnly: true });
  return { ok: true, message: "Account erstellt und angemeldet" };
}

export async function loginAction(_: AuthState | undefined, formData: FormData): Promise<AuthState> {
  const parsed = authSchema.pick({ email: true, password: true }).safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.errors[0]?.message ?? "Ungültige Eingabe" };
  }

  const { email } = parsed.data;

  if (!hasSupabaseConfig) {
    cookies().set("demo-user-email", email, { httpOnly: true });
    return { ok: true, message: "Demo-Login aktiv" };
  }

  const client = getServiceRoleClient();
  if (!client) return { ok: false, message: "Supabase fehlt" };

  const userLookup = await client.auth.admin.listUsers({ email, perPage: 1 });
  const userId = userLookup.data?.users?.[0]?.id;
  if (!userId) {
    return { ok: false, message: "Kein Konto gefunden" };
  }

  cookies().set("demo-user-email", email, { httpOnly: true });
  return { ok: true, message: "Eingeloggt" };
}

export async function logoutAction() {
  cookies().delete("demo-user-email");
  return { ok: true };
}

export function getSessionEmail() {
  return cookies().get("demo-user-email")?.value;
}
