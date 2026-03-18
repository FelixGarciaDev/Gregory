import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { CreateProviderDto } from "./dto/create-provider.dto";
import { CreateProviderUserDto } from "./dto/create-provider-user.dto";

@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("providers")
  listProviders() {
    return this.adminService.listProviders();
  }

  @Post("providers")
  createProvider(@Body() body: CreateProviderDto) {
    return this.adminService.createProvider(body);
  }

  @Patch("providers/:id")
  updateProvider(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Provider update scaffolded.", id, body };
  }

  @Post("provider-locations")
  createLocation(@Body() body: Record<string, unknown>) {
    return { message: "Provider location creation scaffolded.", body };
  }

  @Patch("provider-locations/:id")
  updateLocation(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Provider location update scaffolded.", id, body };
  }

  @Post("tests")
  createTest(@Body() body: Record<string, unknown>) {
    return { message: "Test creation scaffolded.", body };
  }

  @Patch("tests/:id")
  updateTest(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Test update scaffolded.", id, body };
  }

  @Post("test-aliases")
  createAlias(@Body() body: Record<string, unknown>) {
    return { message: "Test alias creation scaffolded.", body };
  }

  @Patch("test-aliases/:id")
  updateAlias(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Test alias update scaffolded.", id, body };
  }

  @Post("offers")
  createOffer(@Body() body: Record<string, unknown>) {
    return { message: "Offer creation scaffolded.", body };
  }

  @Patch("offers/:id")
  updateOffer(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Offer update scaffolded.", id, body };
  }

  @Post("provider-users")
  createProviderUser(@Body() body: CreateProviderUserDto) {
    return this.adminService.createProviderUser(body);
  }

  @Patch("provider-users/:id")
  updateProviderUser(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Provider user update scaffolded.", id, body };
  }

  @Post("verifications/:offerId")
  verifyOffer(@Param("offerId") offerId: string, @Body() body: Record<string, unknown>) {
    return { message: "Verification logging scaffolded.", offerId, body };
  }

  @Post("imports/providers")
  importProviders() {
    return { message: "Provider CSV import hook scaffolded." };
  }

  @Post("imports/offers")
  importOffers() {
    return { message: "Offer CSV import hook scaffolded." };
  }
}
