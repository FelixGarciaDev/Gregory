"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { clearSession, createSession, getSession } from "../lib/auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/v1";

export type LoginFormState = {
  error?: string;
};

export type ProviderFormState = {
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
    return { error: "Invalid provider credentials." };
  }

  const data = (await response.json()) as { accessToken?: string; role?: string };

  if (
    !data.accessToken ||
    (data.role !== "provider_admin" && data.role !== "provider_user")
  ) {
    return { error: "This account does not have provider portal access." };
  }

  await createSession(data.accessToken);
  redirect("/");
}

export async function logoutAction() {
  await clearSession();
  redirect("/login");
}

export async function updateOrganizationAction(
  _: ProviderFormState,
  formData: FormData
): Promise<ProviderFormState> {
  const session = await getSession();

  if (!session) {
    return { error: "Your provider session has expired. Sign in again." };
  }

  if (session.user.role !== "provider_admin") {
    return { error: "Only provider admins can edit organization details." };
  }

  const organizationId = String(formData.get("organizationId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const website = String(formData.get("website") ?? "").trim();

  if (!organizationId || !name || !type) {
    return { error: "Organization name and type are required." };
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/provider/organizations/${organizationId}`, {
      method: "PATCH",
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
    const data = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data?.message[0] : data?.message;
    return { error: message ?? "Could not update the organization profile." };
  }

  revalidatePath("/");
  revalidatePath("/organization");
  return { success: "Organization profile updated." };
}
