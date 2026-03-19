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
    locationCount: number;
    userCount: number;
  };
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
