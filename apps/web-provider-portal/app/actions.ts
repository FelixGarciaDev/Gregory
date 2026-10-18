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

export async function saveLocationAction(
  _: ProviderFormState,
  formData: FormData
): Promise<ProviderFormState> {
  const session = await getSession();

  if (!session) {
    return { error: "Your provider session has expired. Sign in again." };
  }

  if (session.user.role !== "provider_admin") {
    return { error: "Only provider admins can edit location details." };
  }

  const locationId = String(formData.get("locationId") ?? "").trim();
  const redirectTo = String(formData.get("redirectTo") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const addressLine1 = String(formData.get("addressLine1") ?? "").trim();
  const addressLine2 = String(formData.get("addressLine2") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const stateRegion = String(formData.get("stateRegion") ?? "").trim();
  const country = String(formData.get("country") ?? "").trim() || "VE";
  const postalCode = String(formData.get("postalCode") ?? "").trim();
  const latitudeValue = String(formData.get("latitude") ?? "").trim();
  const longitudeValue = String(formData.get("longitude") ?? "").trim();
  const latitude = Number(latitudeValue);
  const longitude = Number(longitudeValue);
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!addressLine1 || !city || !stateRegion || !country) {
    return { error: "Address line 1, city, state/region, and country are required." };
  }

  if (
    !latitudeValue ||
    !longitudeValue ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return { error: "Choose a valid point on the map or from Google suggestions." };
  }

  const payload = {
    name: locationId ? name : name || undefined,
    addressLine1,
    addressLine2: locationId ? addressLine2 : addressLine2 || undefined,
    city,
    stateRegion,
    country,
    postalCode: locationId ? postalCode : postalCode || undefined,
    latitude,
    longitude,
    phone: locationId ? phone : phone || undefined,
    notes: locationId ? notes : notes || undefined
  };

  const method = locationId ? "PATCH" : "POST";
  const endpoint = locationId
    ? `${API_BASE_URL}/provider/locations/${locationId}`
    : `${API_BASE_URL}/provider/locations`;

  let response: Response;

  try {
    response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`
      },
      body: JSON.stringify(payload),
      cache: "no-store"
    });
  } catch {
    return { error: "The API is unreachable. Check that the Nest server is running." };
  }

  if (!response.ok) {
    const data = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
    const message = Array.isArray(data?.message) ? data?.message[0] : data?.message;
    return { error: message ?? "Could not save the location." };
  }

  revalidatePath("/");
  revalidatePath("/organization");
  revalidatePath("/locations");

  if (redirectTo.startsWith("/")) {
    redirect(redirectTo);
  }

  return { success: locationId ? "Location updated." : "Location created." };
}

async function providerApiError(response: Response, fallback: string) {
  const data = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
  const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
  return message ?? fallback;
}

export async function createProviderOfferAction(
  _: ProviderFormState,
  formData: FormData
): Promise<ProviderFormState> {
  return saveProviderOffer(formData);
}

export async function updateProviderOfferAction(
  _: ProviderFormState,
  formData: FormData
): Promise<ProviderFormState> {
  return saveProviderOffer(formData);
}

async function saveProviderOffer(formData: FormData): Promise<ProviderFormState> {
  const session = await getSession();

  if (!session) {
    return { error: "Your provider session has expired. Sign in again." };
  }

  if (session.user.role !== "provider_admin") {
    return { error: "Only provider admins can change location test offers." };
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
    ? `${API_BASE_URL}/provider/offers/${offerId}`
    : `${API_BASE_URL}/provider/offers`;

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
    return { error: await providerApiError(response, `Could not ${offerId ? "update" : "create"} the offer.`) };
  }

  revalidatePath("/");
  revalidatePath("/offers");
  redirect("/offers");
}
