import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { MembershipRole, OfferStatus, Prisma, UserRole } from "@prisma/client";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { RequestActor } from "../authz/types/request-actor";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProviderLocationDto } from "./dto/create-provider-location.dto";
import { CreateProviderOfferDto } from "./dto/create-provider-offer.dto";
import { CreateProviderWorkspaceUserDto } from "./dto/create-provider-workspace-user.dto";
import { UpdateProviderLocationDto } from "./dto/update-provider-location.dto";
import { UpdateProviderOfferDto } from "./dto/update-provider-offer.dto";
import { UpdateProviderOrganizationDto } from "./dto/update-provider-organization.dto";
import { UpdateProviderWorkspaceUserDto } from "./dto/update-provider-workspace-user.dto";

const PROVIDER_ROLES: UserRole[] = [UserRole.provider_admin, UserRole.provider_user];

@Injectable()
export class ProviderService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(actor: RequestActor) {
    const organization = await this.getScopedOrganization(actor.organizationId);

    return {
      id: actor.userId,
      email: actor.email,
      fullName: actor.fullName,
      role: actor.role,
      membershipRole: actor.membershipRole,
      organization: this.mapOrganization(organization)
    };
  }

  async listOrganizations(actor: RequestActor) {
    return {
      items: [this.mapOrganization(await this.getScopedOrganization(actor.organizationId))]
    };
  }

  async getOrganization(id: string, actor: RequestActor) {
    this.assertScopedOrganizationId(id, actor.organizationId);
    return this.mapOrganization(await this.getScopedOrganization(actor.organizationId));
  }

  async updateOrganization(id: string, input: UpdateProviderOrganizationDto, actor: RequestActor) {
    this.assertScopedOrganizationId(id, actor.organizationId);

    const organization = await this.prisma.organization.update({
      where: { id: actor.organizationId! },
      data: this.stripUndefined({
        name: input.name?.trim(),
        type: input.type,
        phone: this.nullableTrim(input.phone),
        website: this.nullableTrim(input.website)
      }),
      include: this.organizationInclude()
    });

    return this.mapOrganization(organization);
  }

  async listLocations(actor: RequestActor) {
    const items = await this.prisma.providerLocation.findMany({
      where: {
        organizationId: actor.organizationId!,
        isActive: true
      },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }]
    });

    return { items: items.map((item) => this.mapLocation(item)) };
  }

  async getLocation(id: string, actor: RequestActor) {
    return this.mapLocation(await this.getScopedLocation(id, actor.organizationId));
  }

  async createLocation(input: CreateProviderLocationDto, actor: RequestActor) {
    const organizationId = this.requireOrganizationId(actor.organizationId);
    const locationId = randomUUID();
    const latitude = new Prisma.Decimal(input.latitude);
    const longitude = new Prisma.Decimal(input.longitude);

    await this.prisma.$queryRaw(Prisma.sql`
      INSERT INTO provider_locations (
        id,
        organization_id,
        name,
        address_line_1,
        address_line_2,
        city,
        state_region,
        country,
        postal_code,
        latitude,
        longitude,
        geom,
        phone,
        notes,
        is_active,
        created_at,
        updated_at
      )
      VALUES (
        ${locationId},
        ${organizationId},
        ${this.nullableTrim(input.name)},
        ${input.addressLine1.trim()},
        ${this.nullableTrim(input.addressLine2)},
        ${input.city.trim()},
        ${input.stateRegion.trim()},
        ${(input.country?.trim() || "VE").toUpperCase()},
        ${this.nullableTrim(input.postalCode)},
        ${latitude},
        ${longitude},
        ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography,
        ${this.nullableTrim(input.phone)},
        ${this.nullableTrim(input.notes)},
        true,
        NOW(),
        NOW()
      )
    `);

    return this.mapLocation(
      await this.prisma.providerLocation.findUniqueOrThrow({
        where: { id: locationId }
      })
    );
  }

  async updateLocation(id: string, input: UpdateProviderLocationDto, actor: RequestActor) {
    const current = await this.getScopedLocation(id, actor.organizationId);
    const latitude = input.latitude ?? current.latitude.toNumber();
    const longitude = input.longitude ?? current.longitude.toNumber();

    const location = await this.prisma.providerLocation.update({
      where: { id },
      data: this.stripUndefined({
        name: input.name === undefined ? undefined : this.nullableTrim(input.name),
        addressLine1: input.addressLine1?.trim(),
        addressLine2: input.addressLine2 === undefined ? undefined : this.nullableTrim(input.addressLine2),
        city: input.city?.trim(),
        stateRegion: input.stateRegion?.trim(),
        country: input.country?.trim().toUpperCase(),
        postalCode: input.postalCode === undefined ? undefined : this.nullableTrim(input.postalCode),
        latitude: input.latitude === undefined ? undefined : new Prisma.Decimal(input.latitude),
        longitude: input.longitude === undefined ? undefined : new Prisma.Decimal(input.longitude),
        phone: input.phone === undefined ? undefined : this.nullableTrim(input.phone),
        notes: input.notes === undefined ? undefined : this.nullableTrim(input.notes)
      })
    });

    if (input.latitude !== undefined || input.longitude !== undefined) {
      await this.prisma.$executeRaw(Prisma.sql`
        UPDATE provider_locations
        SET geom = ST_SetSRID(ST_MakePoint(${longitude}, ${latitude}), 4326)::geography
        WHERE id = ${id}
      `);
    }

    return this.mapLocation(location);
  }

  async deleteLocation(id: string, actor: RequestActor) {
    await this.getScopedLocation(id, actor.organizationId);

    return this.mapLocation(
      await this.prisma.providerLocation.update({
        where: { id },
        data: { isActive: false }
      })
    );
  }

  async listOffers(actor: RequestActor) {
    const items = await this.prisma.offer.findMany({
      where: {
        isAvailable: true,
        providerLocation: {
          organizationId: actor.organizationId!
        }
      },
      include: this.offerInclude(),
      orderBy: [{ createdAt: "desc" }, { id: "asc" }]
    });

    return { items: items.map((item) => this.mapOffer(item)) };
  }

  async getOffer(id: string, actor: RequestActor) {
    return this.mapOffer(await this.getScopedOffer(id, actor.organizationId));
  }

  async createOffer(input: CreateProviderOfferDto, actor: RequestActor) {
    await this.assertScopedLocationExists(input.providerLocationId, actor.organizationId);
    await this.assertTestExists(input.testId);

    const offer = await this.prisma.offer.create({
      data: {
        providerLocationId: input.providerLocationId,
        testId: input.testId,
        priceAmount: new Prisma.Decimal(input.priceAmount),
        currencyCode: input.currencyCode.trim().toUpperCase(),
        priceNotes: this.nullableTrim(input.priceNotes),
        turnaroundTime: this.nullableTrim(input.turnaroundTime),
        requiresAppointment: input.requiresAppointment ?? false,
        walkInAllowed: input.walkInAllowed ?? true
      },
      include: this.offerInclude()
    });

    return this.mapOffer(offer);
  }

  async updateOffer(id: string, input: UpdateProviderOfferDto, actor: RequestActor) {
    await this.getScopedOffer(id, actor.organizationId);

    if (input.providerLocationId) {
      await this.assertScopedLocationExists(input.providerLocationId, actor.organizationId);
    }

    if (input.testId) {
      await this.assertTestExists(input.testId);
    }

    const offer = await this.prisma.offer.update({
      where: { id },
      data: this.stripUndefined({
        providerLocationId: input.providerLocationId,
        testId: input.testId,
        priceAmount: input.priceAmount ? new Prisma.Decimal(input.priceAmount) : undefined,
        currencyCode: input.currencyCode?.trim().toUpperCase(),
        priceNotes: input.priceNotes === undefined ? undefined : this.nullableTrim(input.priceNotes),
        turnaroundTime:
          input.turnaroundTime === undefined ? undefined : this.nullableTrim(input.turnaroundTime),
        requiresAppointment: input.requiresAppointment,
        walkInAllowed: input.walkInAllowed,
        isAvailable: input.isAvailable,
        publicStatus:
          input.isAvailable === undefined
            ? undefined
            : input.isAvailable
              ? OfferStatus.active
              : OfferStatus.inactive
      }),
      include: this.offerInclude()
    });

    return this.mapOffer(offer);
  }

  async deleteOffer(id: string, actor: RequestActor) {
    await this.getScopedOffer(id, actor.organizationId);

    return this.mapOffer(
      await this.prisma.offer.update({
        where: { id },
        data: {
          isAvailable: false,
          publicStatus: OfferStatus.inactive
        },
        include: this.offerInclude()
      })
    );
  }

  async listUsers(actor: RequestActor) {
    const users = await this.prisma.user.findMany({
      where: {
        isActive: true,
        role: { in: PROVIDER_ROLES },
        memberships: {
          some: {
            organizationId: actor.organizationId!
          }
        }
      },
      include: this.providerUserInclude(actor.organizationId!),
      orderBy: [{ fullName: "asc" }, { id: "asc" }]
    });

    return { items: users.map((user) => this.mapProviderUser(user)) };
  }

  async getUser(id: string, actor: RequestActor) {
    return this.mapProviderUser(await this.getScopedProviderUser(id, actor.organizationId));
  }

  async createUser(input: CreateProviderWorkspaceUserDto, actor: RequestActor) {
    const organizationId = this.requireOrganizationId(actor.organizationId);
    this.assertProviderRole(input.role);

    const email = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException("A user with that email already exists.");
    }

    const membershipRole = input.membershipRole ?? this.defaultMembershipRoleFor(input.role);

    const user = await this.prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email,
          fullName: input.fullName.trim(),
          passwordHash: this.hashPassword(input.password),
          role: input.role,
          isActive: true
        }
      });

      await tx.userOrganizationRole.create({
        data: {
          userId: createdUser.id,
          organizationId,
          role: membershipRole
        }
      });

      return tx.user.findUniqueOrThrow({
        where: { id: createdUser.id },
        include: this.providerUserInclude(organizationId)
      });
    });

    return this.mapProviderUser(user);
  }

  async updateUser(id: string, input: UpdateProviderWorkspaceUserDto, actor: RequestActor) {
    const organizationId = this.requireOrganizationId(actor.organizationId);
    const currentUser = await this.getScopedProviderUser(id, actor.organizationId);
    const nextRole = input.role ?? currentUser.role;
    const nextIsActive = input.isActive ?? currentUser.isActive;

    this.assertProviderRole(nextRole);

    if (input.email) {
      const email = input.email.trim().toLowerCase();
      const existingUser = await this.prisma.user.findUnique({ where: { email } });

      if (existingUser && existingUser.id !== id) {
        throw new ConflictException("A user with that email already exists.");
      }
    }

    if (
      currentUser.role === UserRole.provider_admin &&
      currentUser.isActive &&
      (nextRole !== UserRole.provider_admin || !nextIsActive)
    ) {
      await this.assertCanRemoveActiveProviderAdmin(organizationId);
    }

    const user = await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: this.stripUndefined({
          fullName: input.fullName?.trim(),
          email: input.email?.trim().toLowerCase(),
          passwordHash: input.password ? this.hashPassword(input.password) : undefined,
          role: input.role,
          isActive: input.isActive
        })
      });

      if (input.membershipRole) {
        await tx.userOrganizationRole.update({
          where: {
            userId_organizationId: {
              userId: id,
              organizationId
            }
          },
          data: {
            role: input.membershipRole
          }
        });
      }

      return tx.user.findUniqueOrThrow({
        where: { id },
        include: this.providerUserInclude(organizationId)
      });
    });

    return this.mapProviderUser(user);
  }

  async deleteUser(id: string, actor: RequestActor) {
    const organizationId = this.requireOrganizationId(actor.organizationId);
    const currentUser = await this.getScopedProviderUser(id, actor.organizationId);

    if (currentUser.role === UserRole.provider_admin && currentUser.isActive) {
      await this.assertCanRemoveActiveProviderAdmin(organizationId);
    }

    return this.mapProviderUser(
      await this.prisma.user.update({
        where: { id },
        data: { isActive: false },
        include: this.providerUserInclude(organizationId)
      })
    );
  }

  async listTests() {
    const items = await this.prisma.test.findMany({
      where: { isActive: true },
      orderBy: [{ name: "asc" }, { id: "asc" }]
    });

    return {
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        category: item.category,
        description: item.description,
        preparationNotes: item.preparationNotes
      }))
    };
  }

  async getTest(id: string) {
    const test = await this.prisma.test.findFirst({
      where: {
        id,
        isActive: true
      }
    });

    if (!test) {
      throw new NotFoundException("Test not found.");
    }

    return {
      id: test.id,
      name: test.name,
      slug: test.slug,
      category: test.category,
      description: test.description,
      preparationNotes: test.preparationNotes
    };
  }

  private organizationInclude() {
    return {
      memberships: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              fullName: true,
              role: true,
              isActive: true
            }
          }
        }
      },
      locations: {
        select: {
          id: true,
          isActive: true
        }
      }
    } satisfies Prisma.OrganizationInclude;
  }

  private offerInclude() {
    return {
      providerLocation: {
        select: {
          id: true,
          name: true,
          organizationId: true
        }
      },
      test: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true
        }
      }
    } satisfies Prisma.OfferInclude;
  }

  private providerUserInclude(organizationId: string) {
    return {
      memberships: {
        where: {
          organizationId
        },
        include: {
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    } satisfies Prisma.UserInclude;
  }

  private async getScopedOrganization(organizationId: string | null) {
    const scopedOrganizationId = this.requireOrganizationId(organizationId);
    const organization = await this.prisma.organization.findFirst({
      where: {
        id: scopedOrganizationId,
        isActive: true
      },
      include: this.organizationInclude()
    });

    if (!organization) {
      throw new NotFoundException("Organization not found.");
    }

    return organization;
  }

  private async getScopedLocation(id: string, organizationId: string | null) {
    const location = await this.prisma.providerLocation.findFirst({
      where: {
        id,
        organizationId: this.requireOrganizationId(organizationId)
      }
    });

    if (!location) {
      throw new NotFoundException("Location not found.");
    }

    return location;
  }

  private async getScopedOffer(id: string, organizationId: string | null) {
    const offer = await this.prisma.offer.findFirst({
      where: {
        id,
        providerLocation: {
          organizationId: this.requireOrganizationId(organizationId)
        }
      },
      include: this.offerInclude()
    });

    if (!offer) {
      throw new NotFoundException("Offer not found.");
    }

    return offer;
  }

  private async getScopedProviderUser(id: string, organizationId: string | null) {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        role: {
          in: PROVIDER_ROLES
        },
        memberships: {
          some: {
            organizationId: this.requireOrganizationId(organizationId)
          }
        }
      },
      include: this.providerUserInclude(this.requireOrganizationId(organizationId))
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user;
  }

  private async assertScopedLocationExists(id: string, organizationId: string | null) {
    await this.getScopedLocation(id, organizationId);
  }

  private async assertTestExists(id: string) {
    const test = await this.prisma.test.findFirst({
      where: {
        id,
        isActive: true
      },
      select: { id: true }
    });

    if (!test) {
      throw new NotFoundException("Test not found.");
    }
  }

  private async assertCanRemoveActiveProviderAdmin(organizationId: string) {
    const activeProviderAdminCount = await this.prisma.user.count({
      where: {
        isActive: true,
        role: UserRole.provider_admin,
        memberships: {
          some: {
            organizationId
          }
        }
      }
    });

    if (activeProviderAdminCount <= 1) {
      throw new ConflictException("Each provider must keep at least one active provider_admin.");
    }
  }

  private assertScopedOrganizationId(requestedId: string, organizationId: string | null) {
    if (requestedId !== this.requireOrganizationId(organizationId)) {
      throw new NotFoundException("Organization not found.");
    }
  }

  private requireOrganizationId(organizationId: string | null) {
    if (!organizationId) {
      throw new ForbiddenException("Provider scope is missing.");
    }

    return organizationId;
  }

  private assertProviderRole(role: UserRole) {
    if (!PROVIDER_ROLES.includes(role)) {
      throw new ConflictException(
        "Provider users must use the provider_admin or provider_user role."
      );
    }
  }

  private defaultMembershipRoleFor(role: UserRole) {
    return role === UserRole.provider_admin ? MembershipRole.manager : MembershipRole.staff;
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, 64).toString("hex");
    return `scrypt:${salt}:${derivedKey}`;
  }

  private nullableTrim(value: string | undefined) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private mapOrganization(organization: {
    id: string;
    name: string;
    type: string;
    phone: string | null;
    website: string | null;
    isActive: boolean;
    memberships: Array<{
      role: MembershipRole;
      user: {
        id: string;
        email: string;
        fullName: string;
        role: UserRole;
        isActive: boolean;
      };
    }>;
    locations: Array<{ id: string; isActive: boolean }>;
  }) {
    const activeUsers = organization.memberships.filter((membership) => membership.user.isActive);

    return {
      id: organization.id,
      name: organization.name,
      type: organization.type,
      phone: organization.phone,
      website: organization.website,
      isActive: organization.isActive,
      locationCount: organization.locations.filter((location) => location.isActive).length,
      userCount: activeUsers.length,
      users: activeUsers
        .slice()
        .sort((left, right) => left.user.fullName.localeCompare(right.user.fullName))
        .map((membership) => ({
          id: membership.user.id,
          fullName: membership.user.fullName,
          email: membership.user.email,
          role: membership.user.role,
          membershipRole: membership.role,
          isActive: membership.user.isActive
        }))
    };
  }

  private mapLocation(location: {
    id: string;
    organizationId: string;
    name: string | null;
    addressLine1: string;
    addressLine2: string | null;
    city: string;
    stateRegion: string;
    country: string;
    postalCode: string | null;
    latitude: Prisma.Decimal;
    longitude: Prisma.Decimal;
    phone: string | null;
    notes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: location.id,
      organizationId: location.organizationId,
      name: location.name,
      addressLine1: location.addressLine1,
      addressLine2: location.addressLine2,
      city: location.city,
      stateRegion: location.stateRegion,
      country: location.country,
      postalCode: location.postalCode,
      latitude: location.latitude.toString(),
      longitude: location.longitude.toString(),
      phone: location.phone,
      notes: location.notes,
      isActive: location.isActive,
      createdAt: location.createdAt,
      updatedAt: location.updatedAt
    };
  }

  private mapOffer(offer: {
    id: string;
    providerLocationId: string;
    testId: string;
    priceAmount: Prisma.Decimal;
    currencyCode: string;
    priceNotes: string | null;
    turnaroundTime: string | null;
    requiresAppointment: boolean;
    walkInAllowed: boolean;
    isAvailable: boolean;
    publicStatus: OfferStatus;
    createdAt: Date;
    updatedAt: Date;
    providerLocation: { id: string; name: string | null; organizationId: string };
    test: { id: string; name: string; slug: string; category: string };
  }) {
    return {
      id: offer.id,
      providerLocationId: offer.providerLocationId,
      providerLocationName: offer.providerLocation.name,
      testId: offer.testId,
      testName: offer.test.name,
      testSlug: offer.test.slug,
      testCategory: offer.test.category,
      priceAmount: offer.priceAmount.toString(),
      currencyCode: offer.currencyCode,
      priceNotes: offer.priceNotes,
      turnaroundTime: offer.turnaroundTime,
      requiresAppointment: offer.requiresAppointment,
      walkInAllowed: offer.walkInAllowed,
      isAvailable: offer.isAvailable,
      publicStatus: offer.publicStatus,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt
    };
  }

  private mapProviderUser(user: {
    id: string;
    email: string;
    fullName: string;
    role: UserRole;
    isActive: boolean;
    memberships: Array<{
      role: MembershipRole;
      organization: { id: string; name: string };
    }>;
  }) {
    const membership = user.memberships[0] ?? null;

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      membershipRole: membership?.role ?? null,
      organizationId: membership?.organization.id ?? null,
      organizationName: membership?.organization.name ?? null
    };
  }

  private stripUndefined<T extends Record<string, unknown>>(value: T) {
    return Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
    ) as T;
  }
}
