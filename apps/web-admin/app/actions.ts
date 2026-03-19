"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, getSession } from "../lib/auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/v1";

export type LoginFormState = {
  error?: string;
};

export type AdminFormState = {
  error?: string;
  success?: string;
};

export async function loginAction(_: LoginFormState, formData: FormData): Promise<LoginFormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "Enter your email and password." };
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store"
    });
  } catch {
    return { error: "The API is unreachable. Check that the Nest server is running." };
  }

  if (!response.ok) {
    return { error: "Invalid admin credentials." };
  }

  const data = (await response.json()) as { accessToken?: string; role?: string };

  if (!data.accessToken || data.role !== "admin") {
    return { error: "This account does not have admin access." };
  }

  await createSession(data.accessToken);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function createProviderAction(
  _: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const session = await getSession();

  if (!session) {
    return { error: "Your admin session has expired. Sign in again." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (!name || !type) {
    return { error: "Provider name and type are required." };
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/admin/providers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify({
        name,
        type,
        phone: phone || undefined,
        website: website || undefined
      }),
      cache: "no-store"
    });
  } catch {
    return { error: "The API is unreachable. Check that the Nest server is running." };
  }

  if (!response.ok) {
    return { error: "Could not create the provider." };
  }

  revalidatePath("/providers");
  redirect("/providers");
}

export async function createProviderUserAction(
  _: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const session = await getSession();

  if (!session) {
    return { error: "Your admin session has expired. Sign in again." };
  }

  const providerId = String(formData.get("providerId") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "").trim();

  if (!providerId || !fullName || !email || !password || !role) {
    return { error: "Provider, name, email, password, and role are required." };
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/admin/provider-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify({
        providerId,
        fullName,
        email,
        password,
        role
      }),
      cache: "no-store"
    });
  } catch {
    return { error: "The API is unreachable. Check that the Nest server is running." };
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data?.message[0] : data?.message;
    return { error: message ?? "Could not create the provider user." };
  }

  revalidatePath("/providers");
  return { success: "Provider user created." };
}
