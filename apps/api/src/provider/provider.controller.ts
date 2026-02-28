import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";

@Controller("provider")
export class ProviderController {
  @Get("me")
  me() {
    return {
      id: "provider-user-1",
      email: "provider@example.com",
      role: "provider_user"
    };
  }

  @Get("organizations")
  getOrganizations() {
    return {
      items: [
        {
          id: "organization-1",
          name: "Laboratorio Centro Caracas",
          type: "lab"
        }
      ]
    };
  }

  @Patch("organizations/:id")
  updateOrganization(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Organization update scaffolded.", id, body };
  }

  @Get("locations")
  getLocations() {
    return {
      items: [
        {
          id: "location-1",
          name: "Sede Chacao",
          city: "Caracas"
        }
      ]
    };
  }

  @Patch("locations/:id")
  updateLocation(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Location update scaffolded.", id, body };
  }

  @Get("offers")
  getOffers() {
    return {
      items: [
        {
          id: "offer-cbc-1",
          testName: "Complete Blood Count (CBC)",
          priceAmount: 12,
          currencyCode: "USD"
        }
      ]
    };
  }

  @Post("offers")
  createOffer(@Body() body: Record<string, unknown>) {
    return { message: "Provider offer creation scaffolded.", body };
  }

  @Patch("offers/:id")
  updateOffer(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Provider offer update scaffolded.", id, body };
  }
}

