import { getSession } from "../../lib/auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/v1";

export type ProviderRecord = {
  id: string;
  name: string;
  type: string;
  phone: string | null;
  website: string | null;
  locationCount: number;
  userCount: number;
  users: Array<{
    id: string;
    fullName: string;
    email: string;
    role: string;
    membershipRole: string;
    isActive: boolean;
  }>;
};

export type ProviderSnapshot = ProviderRecord & {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  offerCount: number;
  locations: Array<{
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
    operatingHours: Array<{
      id: string;
      dayOfWeek: number;
      opensAt: string;
      closesAt: string;
      isClosed: boolean;
    }>;
    paymentMethods: Array<{
      id: string;
      code: string;
      label: string;
    }>;
    offers: Array<{
      id: string;
      providerLocationId: string;
      testId: string;
      test: {
        id: string;
        name: string;
        slug: string;
        category: string;
        description: string | null;
        preparationNotes: string | null;
        isActive: boolean;
      };
      priceAmount: string;
      currencyCode: string;
      priceNotes: string | null;
      turnaroundTime: string | null;
      requiresAppointment: boolean;
      walkInAllowed: boolean;
      isAvailable: boolean;
      lastVerifiedAt: string | null;
      verifiedByUserId: string | null;
      verificationSource: string;
      publicStatus: string;
      createdAt: string;
      updatedAt: string;
      verifiedByUser: {
        id: string;
        email: string;
        fullName: string;
        role: string;
        isActive: boolean;
      } | null;
      verificationRecords: Array<{
        id: string;
        offerId: string;
        verifiedAt: string;
        verifiedByUserId: string;
        method: string;
        notes: string | null;
        verifiedByUser: {
          id: string;
          email: string;
          fullName: string;
          role: string;
          isActive: boolean;
        };
      }>;
    }>;
  }>;
};

export async function getProviders() {
  const session = await getSession();

  if (!session) {
    return [] as ProviderRecord[];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/providers`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return [] as ProviderRecord[];
    }

    const data = (await response.json()) as { items?: ProviderRecord[] };
    return data.items ?? [];
  } catch {
    return [] as ProviderRecord[];
  }
}

export async function getProvider(providerId: string) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/providers/${providerId}`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ProviderSnapshot;
  } catch {
    return null;
  }
}
