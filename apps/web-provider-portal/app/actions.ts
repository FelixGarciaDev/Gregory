"use server";

import { redirect } from "next/navigation";
import { clearSession, createSession } from "../lib/auth";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3000/v1";

export type LoginFormState = {
  error?: string;
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
