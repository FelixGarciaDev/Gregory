import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Roles } from "../authz/decorators/roles.decorator";
import { CreateProviderOfferDto } from "../provider/dto/create-provider-offer.dto";
import { UpdateProviderOfferDto } from "../provider/dto/update-provider-offer.dto";
import { AdminService } from "./admin.service";
import { CreateAdminProviderLocationDto } from "./dto/create-provider-location.dto";
import { CreateCanonicalTestDto } from "./dto/create-canonical-test.dto";
import { CreateProviderDto } from "./dto/create-provider.dto";
import { CreateProviderUserDto } from "./dto/create-provider-user.dto";
import { UpdateCanonicalTestDto } from "./dto/update-canonical-test.dto";

@Roles(UserRole.admin)
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

  @Get("providers/:id")
  getProvider(@Param("id") id: string) {
    return this.adminService.getProvider(id);
  }

  @Patch("providers/:id")
  updateProvider(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Provider update scaffolded.", id, body };
  }

  @Post("provider-locations")
  createLocation(@Body() body: CreateAdminProviderLocationDto) {
    return this.adminService.createProviderLocation(body);
  }

  @Get("provider-locations")
  listLocations() {
    return this.adminService.listProviderLocations();
  }

  @Patch("provider-locations/:id")
  updateLocation(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Provider location update scaffolded.", id, body };
  }

  @Get("tests")
  listTests() {
    return this.adminService.listCanonicalTests();
  }

  @Get("tests/:id")
  getTest(@Param("id") id: string) {
    return this.adminService.getCanonicalTest(id);
  }

  @Post("tests")
  createTest(@Body() body: CreateCanonicalTestDto) {
    return this.adminService.createCanonicalTest(body);
  }

  @Patch("tests/:id")
  updateTest(@Param("id") id: string, @Body() body: UpdateCanonicalTestDto) {
    return this.adminService.updateCanonicalTest(id, body);
  }

  @Post("test-aliases")
  createAlias(@Body() body: Record<string, unknown>) {
    return { message: "Test alias creation scaffolded.", body };
  }

  @Patch("test-aliases/:id")
  updateAlias(@Param("id") id: string, @Body() body: Record<string, unknown>) {
    return { message: "Test alias update scaffolded.", id, body };
  }

  @Get("offers")
  listOffers() {
    return this.adminService.listOffers();
  }

  @Get("offers/:id")
  getOffer(@Param("id") id: string) {
    return this.adminService.getOffer(id);
  }

  @Post("offers")
  createOffer(@Body() body: CreateProviderOfferDto) {
    return this.adminService.createOffer(body);
  }

  @Patch("offers/:id")
  updateOffer(@Param("id") id: string, @Body() body: UpdateProviderOfferDto) {
    return this.adminService.updateOffer(id, body);
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
