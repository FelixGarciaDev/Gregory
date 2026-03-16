import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const SESSION_COOKIE = "gregory_admin_session";

type SessionPayload = {
  sub: string;
  email: string;
  role: string;
  exp?: number;
  iat?: number;
};

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (normalized.length % 4)) % 4;
  return Buffer.from(normalized + "=".repeat(padding), "base64");
}

function getJwtSecret() {
  return process.env.JWT_SECRET ?? "local-dev-secret";
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split(".");

    if (parts.length !== 3) {
      return null;
    }

    const [headerPart, payloadPart, signaturePart] = parts;
    const signedContent = `${headerPart}.${payloadPart}`;
    const expectedSignature = createHmac("sha256", getJwtSecret()).update(signedContent).digest();
    const providedSignature = decodeBase64Url(signaturePart);

    if (expectedSignature.length !== providedSignature.length) {
      return null;
    }

    if (!timingSafeEqual(expectedSignature, providedSignature)) {
      return null;
    }

    const header = JSON.parse(decodeBase64Url(headerPart).toString("utf8")) as { alg?: string };

    if (header.alg !== "HS256") {
      return null;
    }

    const payload = JSON.parse(decodeBase64Url(payloadPart).toString("utf8")) as SessionPayload;

    if (payload.exp && payload.exp * 1000 <= Date.now()) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export async function createSession(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (!token) {
    return null;
  }

  const payload = verifySessionToken(token);

  if (!payload) {
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return {
    token,
    user: payload
  };
}

export async function requireAdminSession() {
  const session = await getSession();

  if (!session || session.user.role !== "admin") {
    redirect("/login");
  }

  return session;
}
