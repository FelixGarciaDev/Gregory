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
