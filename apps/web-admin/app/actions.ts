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

function canonicalTestSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function apiErrorMessage(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
  const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
  return message ?? fallback;
}

export async function createCanonicalTestAction(
  _: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const session = await getSession();

  if (!session) {
    return { error: "Your admin session has expired. Sign in again." };
  }

  const name = String(formData.get("name") ?? "").trim();
  const slug = canonicalTestSlug(String(formData.get("slug") ?? "").trim() || name);
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const preparationNotes = String(formData.get("preparationNotes") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!name || !slug || !category) {
    return { error: "Test name, slug, and category are required." };
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/admin/tests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify({
        name,
        slug,
        category,
        description: description || undefined,
        preparationNotes: preparationNotes || undefined,
        isActive
      }),
      cache: "no-store"
    });
  } catch {
    return { error: "The API is unreachable. Check that the Nest server is running." };
  }

  if (!response.ok) {
    return { error: await apiErrorMessage(response, "Could not create the canonical test.") };
  }

  revalidatePath("/tests");
  redirect("/tests");
}

export async function updateCanonicalTestAction(
  _: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const session = await getSession();

  if (!session) {
    return { error: "Your admin session has expired. Sign in again." };
  }

  const testId = String(formData.get("testId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const slug = canonicalTestSlug(String(formData.get("slug") ?? "").trim() || name);
  const category = String(formData.get("category") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const preparationNotes = String(formData.get("preparationNotes") ?? "").trim();
  const isActive = formData.get("isActive") === "on";

  if (!testId || !name || !slug || !category) {
    return { error: "Test name, slug, and category are required." };
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/admin/tests/${testId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify({
        name,
        slug,
        category,
        description,
        preparationNotes,
        isActive
      }),
      cache: "no-store"
    });
  } catch {
    return { error: "The API is unreachable. Check that the Nest server is running." };
  }

  if (!response.ok) {
    return { error: await apiErrorMessage(response, "Could not update the canonical test.") };
  }

  revalidatePath("/tests");
  revalidatePath(`/tests/${testId}/edit`);
  redirect("/tests");
}

export async function createAdminOfferAction(
  _: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  return saveAdminOffer(formData);
}

export async function updateAdminOfferAction(
  _: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  return saveAdminOffer(formData);
}

async function saveAdminOffer(formData: FormData): Promise<AdminFormState> {
  const session = await getSession();

  if (!session) {
    return { error: "Your admin session has expired. Sign in again." };
  }

  const offerId = String(formData.get("offerId") ?? "").trim();
  const providerLocationId = String(formData.get("providerLocationId") ?? "").trim();
  const testId = String(formData.get("testId") ?? "").trim();
  const priceAmount = String(formData.get("priceAmount") ?? "").trim();
  const currencyCode = String(formData.get("currencyCode") ?? "").trim().toUpperCase();
  const priceNotes = String(formData.get("priceNotes") ?? "").trim();
  const turnaroundTime = String(formData.get("turnaroundTime") ?? "").trim();
  const requiresAppointment = formData.get("requiresAppointment") === "on";
  const walkInAllowed = formData.get("walkInAllowed") === "on";
  const isAvailable = formData.get("isAvailable") === "on";

  if (!providerLocationId || !testId || !priceAmount || !currencyCode) {
    return { error: "Location, canonical test, price, and currency are required." };
  }

  const endpoint = offerId
    ? `${API_BASE_URL}/admin/offers/${offerId}`
    : `${API_BASE_URL}/admin/offers`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method: offerId ? "PATCH" : "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify({
        providerLocationId,
        testId,
        priceAmount,
        currencyCode,
        priceNotes: offerId ? priceNotes : priceNotes || undefined,
        turnaroundTime: offerId ? turnaroundTime : turnaroundTime || undefined,
        requiresAppointment,
        walkInAllowed,
        ...(offerId ? { isAvailable } : {})
      }),
      cache: "no-store"
    });
  } catch {
    return { error: "The API is unreachable. Check that the Nest server is running." };
  }

  if (!response.ok) {
    return { error: await apiErrorMessage(response, `Could not ${offerId ? "update" : "create"} the offer.`) };
  }

  revalidatePath("/offers");
  revalidatePath("/providers");
  redirect("/offers");
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

export async function createProviderLocationAction(
  _: AdminFormState,
  formData: FormData
): Promise<AdminFormState> {
  const session = await getSession();

  if (!session) {
    return { error: "Your admin session has expired. Sign in again." };
  }

  const providerId = String(formData.get("providerId") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const stateRegion = String(formData.get("stateRegion") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim() || "VE";
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const latitude = Number(String(formData.get("latitude") ?? "").trim());
  const longitude = Number(String(formData.get("longitude") ?? "").trim());
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!providerId || !addressLine1 || !city || !stateRegion || !country) {
    return { error: "Provider, address line 1, city, state/region, and country are required." };
  }

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    return { error: "Choose a valid point on the map or from Google suggestions." };
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/admin/provider-locations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify({
        providerId,
        name: name || undefined,
        addressLine1,
        addressLine2: addressLine2 || undefined,
        city,
        stateRegion,
        country,
        postalCode: postalCode || undefined,
        latitude,
        longitude,
        phone: phone || undefined,
        notes: notes || undefined
      }),
      cache: "no-store"
    });
  } catch {
    return { error: "The API is unreachable. Check that the Nest server is running." };
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data?.message[0] : data?.message;
    return { error: message ?? "Could not create the provider location." };
  }

  revalidatePath("/providers");
  revalidatePath(`/providers/${providerId}`);
  redirect(`/providers/${providerId}`);
}
