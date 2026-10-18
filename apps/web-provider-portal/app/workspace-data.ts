import { getSession } from "../lib/auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/v1";

export type ProviderWorkspace = {
  id: string;
  email: string;
  fullName: string;
  role: string;
  membershipRole: string | null;
  organization: {
    id: string;
    name: string;
    type: string;
    phone: string | null;
    website: string | null;
    locationCount: number;
    userCount: number;
  };
};

export type ProviderLocation = {
  id: string;
  organizationId: string;
  name: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  stateRegion: string;
  country: string;
  postalCode: string | null;
  latitude: string;
  longitude: string;
  phone: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProviderCanonicalTest = {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string | null;
  preparationNotes: string | null;
};

export type ProviderOffer = {
  id: string;
  providerLocationId: string;
  providerLocationName: string | null;
  testId: string;
  testName: string;
  testSlug: string;
  testCategory: string;
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

export async function getProviderWorkspace() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/provider/me`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ProviderWorkspace;
  } catch {
    return null;
  }
}

export async function getProviderLocations() {
  const session = await getSession();

  if (!session) {
    return [] as ProviderLocation[];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/provider/locations`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return [] as ProviderLocation[];
    }

    const data = (await response.json()) as { items?: ProviderLocation[] };
    return data.items ?? [];
  } catch {
    return [] as ProviderLocation[];
  }
}

async function providerGet<T>(path: string, fallback: T): Promise<T> {
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

export function getProviderLocation(locationId: string) {
  return providerGet<ProviderLocation | null>(`/provider/locations/${locationId}`, null);
}

export async function getProviderOffers() {
  const data = await providerGet<{ items?: ProviderOffer[] }>("/provider/offers", {});
  return data.items ?? [];
}

export function getProviderOffer(offerId: string) {
  return providerGet<ProviderOffer | null>(`/provider/offers/${offerId}`, null);
}

export async function getProviderTests() {
  const data = await providerGet<{ items?: ProviderCanonicalTest[] }>("/provider/tests", {});
  return data.items ?? [];
}
