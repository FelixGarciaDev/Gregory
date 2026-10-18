import { getSession } from "../../lib/auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/v1";

export type CanonicalTestRecord = {
  id: string;
  name: string;
  slug: string;
  category: "bloodwork" | "imaging" | "diagnostic" | "urinalysis" | "other";
  description: string | null;
  preparationNotes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  aliasCount: number;
  offerCount: number;
};

export async function getCanonicalTests() {
  const session = await getSession();

  if (!session) {
    return [] as CanonicalTestRecord[];
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/tests`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return [] as CanonicalTestRecord[];
    }

    const data = (await response.json()) as { items?: CanonicalTestRecord[] };
    return data.items ?? [];
  } catch {
    return [] as CanonicalTestRecord[];
  }
}

export async function getCanonicalTest(testId: string) {
  const session = await getSession();

  if (!session) {
    return null;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/tests/${testId}`, {
      headers: {
        Authorization: `Bearer ${session.token}`
      },
      cache: "no-store"
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as CanonicalTestRecord;
  } catch {
    return null;
  }
}
