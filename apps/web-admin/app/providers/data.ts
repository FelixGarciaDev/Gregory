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

export async function getProviders() {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/providers`, {
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
