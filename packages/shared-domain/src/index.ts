export type UserRole = "admin" | "provider_user";

export type OrganizationType =
  | "clinic"
  | "lab"
  | "imaging_center"
  | "hospital"
  | "other";

export type TestCategory =
  | "bloodwork"
  | "imaging"
  | "diagnostic"
  | "urinalysis"
  | "other";

export type OfferStatus = "active" | "stale" | "inactive";

export interface SearchOffer {
  id: string;
  testName: string;
  providerName: string;
  locationName: string;
  address: string;
  priceAmount: number;
  currencyCode: string;
  distanceKm: number | null;
  isAvailable: boolean;
  lastVerifiedAt: string | null;
  paymentMethods: string[];
}

