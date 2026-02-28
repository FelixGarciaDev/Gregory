import { Injectable } from "@nestjs/common";
import type { SearchOffer } from "@gregory/shared-domain";
import { SearchQueryDto } from "./dto/search-query.dto";

const sampleOffers: SearchOffer[] = [
  {
    id: "offer-cbc-1",
    testName: "Complete Blood Count (CBC)",
    providerName: "Laboratorio Centro Caracas",
    locationName: "Sede Chacao",
    address: "Av. Francisco de Miranda, Chacao, Caracas",
    priceAmount: 12,
    currencyCode: "USD",
    distanceKm: 2.1,
    isAvailable: true,
    lastVerifiedAt: new Date().toISOString(),
    paymentMethods: ["cash", "debit_card", "zelle"]
  },
  {
    id: "offer-glucose-1",
    testName: "Glucosa Basal",
    providerName: "Clinica Santa Maria",
    locationName: "Laboratorio Principal",
    address: "El Rosal, Caracas",
    priceAmount: 8,
    currencyCode: "USD",
    distanceKm: 3.4,
    isAvailable: true,
    lastVerifiedAt: new Date().toISOString(),
    paymentMethods: ["cash", "credit_card"]
  }
];

@Injectable()
export class SearchService {
  searchOffers(query: SearchQueryDto) {
    const normalizedQuery = query.q.trim().toLowerCase();
    const items = sampleOffers.filter((offer) => {
      const haystack = `${offer.testName} ${offer.providerName}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    return {
      query: normalizedQuery,
      items
    };
  }

  searchProviders(query: SearchQueryDto) {
    return {
      query: query.q,
      items: sampleOffers.map((offer) => ({
        providerId: offer.providerName.toLowerCase().replace(/\s+/g, "-"),
        providerName: offer.providerName,
        nearestOffer: offer.testName,
        distanceKm: offer.distanceKm
      }))
    };
  }

  getProvider(providerId: string) {
    return {
      id: providerId,
      name: "Laboratorio Centro Caracas",
      type: "lab",
      phone: "+58 212 555 1000",
      website: "https://example.local",
      locations: [
        {
          id: "location-1",
          name: "Sede Chacao",
          address: "Av. Francisco de Miranda, Chacao, Caracas"
        }
      ]
    };
  }

  getProviderOffers(providerId: string) {
    return {
      providerId,
      items: sampleOffers
    };
  }

  getOffer(offerId: string) {
    return sampleOffers.find((offer) => offer.id === offerId) ?? null;
  }
}
