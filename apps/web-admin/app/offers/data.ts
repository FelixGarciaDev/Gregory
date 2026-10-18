import { getSession } from "../../lib/auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/v1";

export type AdminLocationOption = {
  id: string;
  name: string | null;
  addressLine1: string;
  city: string;
  stateRegion: string;
  isActive: boolean;
  organizationId: string;
  organizationName: string;
  organizationIsActive: boolean;
};

export type AdminOfferRecord = {
  id: string;
  providerId: string;
  providerName: string;
  providerLocationId: string;
  providerLocationName: string | null;
  testId: string;
  testName: string;
  testSlug: string;
  testCategory: string;
  testIsActive: boolean;
  priceAmount: string;
  currencyCode: string;
  priceNotes: string | null;
  turnaroundTime: string | null;
  requiresAppointment: boolean;
  walkInAllowed: boolean;
  isAvailable: boolean;
  publicStatus: string;
  createdAt: string;
  updatedAt: string;
};

async function adminGet<T>(path: string, fallback: T): Promise<T> {
  const session = await getSession();

  if (!session) {
    return fallback;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${session.token}` },
      cache: "no-store"
    });

    if (!response.ok) {
      return fallback;
    }

    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getAdminOffers() {
  const data = await adminGet<{ items?: AdminOfferRecord[] }>("/admin/offers", {});
  return data.items ?? [];
}

export function getAdminOffer(offerId: string) {
  return adminGet<AdminOfferRecord | null>(`/admin/offers/${offerId}`, null);
}

export async function getAdminLocationOptions() {
  const data = await adminGet<{ items?: AdminLocationOption[] }>("/admin/provider-locations", {});
  return data.items ?? [];
}
