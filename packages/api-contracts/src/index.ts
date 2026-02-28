import type { SearchOffer } from "@gregory/shared-domain";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  role: "admin" | "provider_user";
}

export interface OfferSearchResponse {
  items: SearchOffer[];
}
