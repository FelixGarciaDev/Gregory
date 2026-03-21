import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { CurrentActor } from "../authz/decorators/current-actor.decorator";
import { Roles } from "../authz/decorators/roles.decorator";
import { RequestActor } from "../authz/types/request-actor";
import { CreateProviderLocationDto } from "./dto/create-provider-location.dto";
import { CreateProviderOfferDto } from "./dto/create-provider-offer.dto";
import { CreateProviderWorkspaceUserDto } from "./dto/create-provider-workspace-user.dto";
import { UpdateProviderLocationDto } from "./dto/update-provider-location.dto";
import { UpdateProviderOfferDto } from "./dto/update-provider-offer.dto";
import { UpdateProviderOrganizationDto } from "./dto/update-provider-organization.dto";
import { UpdateProviderWorkspaceUserDto } from "./dto/update-provider-workspace-user.dto";
import { ProviderService } from "./provider.service";

@Roles(UserRole.provider_admin, UserRole.provider_user)
@Controller("provider")
export class ProviderController {
  constructor(private readonly providerService: ProviderService) {}

  @Get("me")
  me(@CurrentActor() actor: RequestActor) {
    return this.providerService.getMe(actor);
  }

  @Get("organizations")
  getOrganizations(@CurrentActor() actor: RequestActor) {
    return this.providerService.listOrganizations(actor);
  }

  @Get("organizations/:id")
  getOrganization(@Param("id") id: string, @CurrentActor() actor: RequestActor) {
    return this.providerService.getOrganization(id, actor);
  }

  @Roles(UserRole.provider_admin)
  @Patch("organizations/:id")
  updateOrganization(
    @Param("id") id: string,
    @Body() body: UpdateProviderOrganizationDto,
    @CurrentActor() actor: RequestActor
  ) {
    return this.providerService.updateOrganization(id, body, actor);
  }

  @Get("locations")
  getLocations(@CurrentActor() actor: RequestActor) {
    return this.providerService.listLocations(actor);
  }

  @Get("locations/:id")
  getLocation(@Param("id") id: string, @CurrentActor() actor: RequestActor) {
    return this.providerService.getLocation(id, actor);
  }

  @Roles(UserRole.provider_admin)
  @Post("locations")
  createLocation(
    @Body() body: CreateProviderLocationDto,
    @CurrentActor() actor: RequestActor
  ) {
    return this.providerService.createLocation(body, actor);
  }

  @Roles(UserRole.provider_admin)
  @Patch("locations/:id")
  updateLocation(
    @Param("id") id: string,
    @Body() body: UpdateProviderLocationDto,
    @CurrentActor() actor: RequestActor
  ) {
    return this.providerService.updateLocation(id, body, actor);
  }

  @Roles(UserRole.provider_admin)
  @Delete("locations/:id")
  deleteLocation(@Param("id") id: string, @CurrentActor() actor: RequestActor) {
    return this.providerService.deleteLocation(id, actor);
  }

  @Get("offers")
  getOffers(@CurrentActor() actor: RequestActor) {
    return this.providerService.listOffers(actor);
  }

  @Get("offers/:id")
  getOffer(@Param("id") id: string, @CurrentActor() actor: RequestActor) {
    return this.providerService.getOffer(id, actor);
  }

  @Roles(UserRole.provider_admin)
  @Post("offers")
  createOffer(@Body() body: CreateProviderOfferDto, @CurrentActor() actor: RequestActor) {
    return this.providerService.createOffer(body, actor);
  }

  @Roles(UserRole.provider_admin)
  @Patch("offers/:id")
  updateOffer(
    @Param("id") id: string,
    @Body() body: UpdateProviderOfferDto,
    @CurrentActor() actor: RequestActor
  ) {
    return this.providerService.updateOffer(id, body, actor);
  }

  @Roles(UserRole.provider_admin)
  @Delete("offers/:id")
  deleteOffer(@Param("id") id: string, @CurrentActor() actor: RequestActor) {
    return this.providerService.deleteOffer(id, actor);
  }

  @Get("users")
  getUsers(@CurrentActor() actor: RequestActor) {
    return this.providerService.listUsers(actor);
  }

  @Get("users/:id")
  getUser(@Param("id") id: string, @CurrentActor() actor: RequestActor) {
    return this.providerService.getUser(id, actor);
  }

  @Roles(UserRole.provider_admin)
  @Post("users")
  createUser(
    @Body() body: CreateProviderWorkspaceUserDto,
    @CurrentActor() actor: RequestActor
  ) {
    return this.providerService.createUser(body, actor);
  }

  @Roles(UserRole.provider_admin)
  @Patch("users/:id")
  updateUser(
    @Param("id") id: string,
    @Body() body: UpdateProviderWorkspaceUserDto,
    @CurrentActor() actor: RequestActor
  ) {
    return this.providerService.updateUser(id, body, actor);
  }

  @Roles(UserRole.provider_admin)
  @Delete("users/:id")
  deleteUser(@Param("id") id: string, @CurrentActor() actor: RequestActor) {
    return this.providerService.deleteUser(id, actor);
  }

  @Get("tests")
  getTests() {
    return this.providerService.listTests();
  }

  @Get("tests/:id")
  getTest(@Param("id") id: string) {
    return this.providerService.getTest(id);
  }
}
