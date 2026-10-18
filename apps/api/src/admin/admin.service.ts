import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { MembershipRole, OfferStatus, Prisma, TestCategory, UserRole } from "@prisma/client";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateProviderOfferDto } from "../provider/dto/create-provider-offer.dto";
import { UpdateProviderOfferDto } from "../provider/dto/update-provider-offer.dto";
import { CreateAdminProviderLocationDto } from "./dto/create-provider-location.dto";
import { CreateCanonicalTestDto } from "./dto/create-canonical-test.dto";
import { CreateProviderDto } from "./dto/create-provider.dto";
import { CreateProviderUserDto } from "./dto/create-provider-user.dto";
import { UpdateCanonicalTestDto } from "./dto/update-canonical-test.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async listProviders() {
    const providers = await this.prisma.organization.findMany({
      orderBy: { createdAt: "desc" },
      include: {
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
        _count: {
          select: {
            locations: true,
            memberships: true
          }
        }
      }
    });

    return {
      items: providers.map((provider) => ({
        id: provider.id,
        name: provider.name,
        type: provider.type,
        phone: provider.phone,
        website: provider.website,
        locationCount: provider._count.locations,
        userCount: provider._count.memberships,
        users: provider.memberships
          .slice()
          .sort((a, b) => a.user.fullName.localeCompare(b.user.fullName))
          .map((membership) => ({
          id: membership.user.id,
          fullName: membership.user.fullName,
          email: membership.user.email,
          role: membership.user.role,
          membershipRole: membership.role,
          isActive: membership.user.isActive
          }))
      }))
    };
  }

  async createProvider(input: CreateProviderDto) {
    const provider = await this.prisma.organization.create({
      data: {
        name: input.name.trim(),
        type: input.type,
        phone: input.phone?.trim() || null,
        website: input.website?.trim() || null
      }
    });

    return provider;
  }

  async listCanonicalTests() {
    const tests = await this.prisma.test.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      include: {
        _count: {
          select: {
            aliases: true,
            offers: true
          }
        }
      }
    });

    return {
      items: tests.map((test) => this.mapCanonicalTest(test))
    };
  }

  async getCanonicalTest(id: string) {
    const test = await this.prisma.test.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            aliases: true,
            offers: true
          }
        }
      }
    });

    if (!test) {
      throw new NotFoundException("Canonical test not found.");
    }

    return this.mapCanonicalTest(test);
  }

  async createCanonicalTest(input: CreateCanonicalTestDto) {
    try {
      const test = await this.prisma.test.create({
        data: {
          name: input.name.trim(),
          slug: input.slug.trim(),
          category: input.category,
          description: this.nullableTrim(input.description),
          preparationNotes: this.nullableTrim(input.preparationNotes),
          isActive: input.isActive ?? true
        },
        include: {
          _count: {
            select: {
              aliases: true,
              offers: true
            }
          }
        }
      });

      return this.mapCanonicalTest(test);
    } catch (error) {
      this.throwCanonicalTestConflict(error);
      throw error;
    }
  }

  async updateCanonicalTest(id: string, input: UpdateCanonicalTestDto) {
    const existingTest = await this.prisma.test.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!existingTest) {
      throw new NotFoundException("Canonical test not found.");
    }

    try {
      const test = await this.prisma.test.update({
        where: { id },
        data: {
          name: input.name?.trim(),
          slug: input.slug?.trim(),
          category: input.category,
          description: this.nullableTrim(input.description),
          preparationNotes: this.nullableTrim(input.preparationNotes),
          isActive: input.isActive
        },
        include: {
          _count: {
            select: {
              aliases: true,
              offers: true
            }
          }
        }
      });

      return this.mapCanonicalTest(test);
    } catch (error) {
      this.throwCanonicalTestConflict(error);
      throw error;
    }
  }

  async getProvider(id: string) {
    const provider = await this.prisma.organization.findUnique({
      where: { id },
      include: {
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
          orderBy: [{ createdAt: "desc" }, { id: "asc" }],
          select: {
            id: true,
            organizationId: true,
            name: true,
            addressLine1: true,
            addressLine2: true,
            city: true,
            stateRegion: true,
            country: true,
            postalCode: true,
            latitude: true,
            longitude: true,
            phone: true,
            notes: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
            operatingHours: {
              orderBy: [{ dayOfWeek: "asc" }, { opensAt: "asc" }],
              select: {
                id: true,
                dayOfWeek: true,
                opensAt: true,
                closesAt: true,
                isClosed: true
              }
            },
            paymentMethods: {
              include: {
                paymentMethod: {
                  select: {
                    id: true,
                    code: true,
                    label: true
                  }
                }
              }
            },
            offers: {
              orderBy: [{ createdAt: "desc" }, { id: "asc" }],
              include: {
                test: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    category: true,
                    description: true,
                    preparationNotes: true,
                    isActive: true
                  }
                },
                verifiedByUser: {
                  select: {
                    id: true,
                    email: true,
                    fullName: true,
                    role: true,
                    isActive: true
                  }
                },
                verificationRecords: {
                  orderBy: [{ verifiedAt: "desc" }, { id: "asc" }],
                  include: {
                    verifiedByUser: {
                      select: {
                        id: true,
                        email: true,
                        fullName: true,
                        role: true,
                        isActive: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!provider) {
      throw new NotFoundException("Provider not found.");
    }

    return this.mapProviderSnapshot(provider);
  }

  async createProviderUser(input: CreateProviderUserDto) {
    if (input.role !== UserRole.provider_admin && input.role !== UserRole.provider_user) {
      throw new ConflictException("Provider users must use the provider_admin or provider_user role.");
    }

    const normalizedEmail = input.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      throw new ConflictException("A user with that email already exists.");
    }

    const membershipRole = input.membershipRole ?? this.defaultMembershipRoleFor(input.role);

    return this.prisma.$transaction(async (tx) => {
      const provider = await tx.organization.findUnique({
        where: { id: input.providerId }
      });

      if (!provider) {
        throw new NotFoundException("Provider not found.");
      }

      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          fullName: input.fullName.trim(),
          passwordHash: this.hashPassword(input.password),
          role: input.role,
          isActive: true
        }
      });

      await tx.userOrganizationRole.create({
        data: {
          userId: user.id,
          organizationId: provider.id,
          role: membershipRole
        }
      });

      return {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        providerId: provider.id,
        providerName: provider.name,
        membershipRole
      };
    });
  }

  async createProviderLocation(input: CreateAdminProviderLocationDto) {
    const provider = await this.prisma.organization.findUnique({
      where: { id: input.providerId },
      select: { id: true }
    });

    if (!provider) {
      throw new NotFoundException("Provider not found.");
    }

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
        ${provider.id},
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

    return this.prisma.providerLocation.findUniqueOrThrow({
      where: { id: locationId },
      select: {
        id: true,
        organizationId: true,
        name: true,
        addressLine1: true,
        addressLine2: true,
        city: true,
        stateRegion: true,
        country: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        phone: true,
        notes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async listProviderLocations() {
    const locations = await this.prisma.providerLocation.findMany({
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            isActive: true
          }
        }
      },
      orderBy: [
        { organization: { name: "asc" } },
        { name: "asc" },
        { id: "asc" }
      ]
    });

    return {
      items: locations.map((location) => ({
        id: location.id,
        name: location.name,
        addressLine1: location.addressLine1,
        city: location.city,
        stateRegion: location.stateRegion,
        isActive: location.isActive,
        organizationId: location.organization.id,
        organizationName: location.organization.name,
        organizationIsActive: location.organization.isActive
      }))
    };
  }

  async listOffers() {
    const offers = await this.prisma.offer.findMany({
      include: this.adminOfferInclude(),
      orderBy: [{ createdAt: "desc" }, { id: "asc" }]
    });

    return { items: offers.map((offer) => this.mapAdminOffer(offer)) };
  }

  async getOffer(id: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id },
      include: this.adminOfferInclude()
    });

    if (!offer) {
      throw new NotFoundException("Offer not found.");
    }

    return this.mapAdminOffer(offer);
  }

  async createOffer(input: CreateProviderOfferDto) {
    await this.assertAdminOfferReferences(input.providerLocationId, input.testId);
    await this.assertOfferDoesNotExist(input.providerLocationId, input.testId);

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
      include: this.adminOfferInclude()
    });

    return this.mapAdminOffer(offer);
  }

  async updateOffer(id: string, input: UpdateProviderOfferDto) {
    const current = await this.prisma.offer.findUnique({
      where: { id },
      select: {
        id: true,
        providerLocationId: true,
        testId: true
      }
    });

    if (!current) {
      throw new NotFoundException("Offer not found.");
    }

    const providerLocationId = input.providerLocationId ?? current.providerLocationId;
    const testId = input.testId ?? current.testId;

    if (providerLocationId !== current.providerLocationId) {
      await this.assertAdminLocationExists(providerLocationId);
    }

    if (testId !== current.testId) {
      await this.assertAdminTestExists(testId);
    }
    await this.assertOfferDoesNotExist(providerLocationId, testId, id);

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
      include: this.adminOfferInclude()
    });

    return this.mapAdminOffer(offer);
  }

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, 64).toString("hex");
    return `scrypt:${salt}:${derivedKey}`;
  }

  private defaultMembershipRoleFor(role: UserRole) {
    return role === UserRole.provider_admin ? MembershipRole.manager : MembershipRole.staff;
  }

  private nullableTrim(value: string | undefined) {
    if (value === undefined) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private stripUndefined<T extends Record<string, unknown>>(value: T) {
    return Object.fromEntries(
      Object.entries(value).filter(([, entryValue]) => entryValue !== undefined)
    ) as T;
  }

  private throwCanonicalTestConflict(error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ConflictException("A canonical test with that slug already exists.");
    }
  }

  private adminOfferInclude() {
    return {
      providerLocation: {
        select: {
          id: true,
          name: true,
          organizationId: true,
          organization: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      test: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: true,
          isActive: true
        }
      }
    } satisfies Prisma.OfferInclude;
  }

  private async assertAdminOfferReferences(providerLocationId: string, testId: string) {
    await Promise.all([
      this.assertAdminLocationExists(providerLocationId),
      this.assertAdminTestExists(testId)
    ]);
  }

  private async assertAdminLocationExists(providerLocationId: string) {
    const location = await this.prisma.providerLocation.findFirst({
      where: {
        id: providerLocationId,
        isActive: true,
        organization: { isActive: true }
      },
      select: { id: true }
    });

    if (!location) {
      throw new NotFoundException("Provider location not found.");
    }
  }

  private async assertAdminTestExists(testId: string) {
    const test = await this.prisma.test.findFirst({
      where: { id: testId, isActive: true },
      select: { id: true }
    });

    if (!test) {
      throw new NotFoundException("Canonical test not found.");
    }
  }

  private async assertOfferDoesNotExist(providerLocationId: string, testId: string, excludeId?: string) {
    const existingOffer = await this.prisma.offer.findFirst({
      where: {
        providerLocationId,
        testId,
        id: excludeId ? { not: excludeId } : undefined
      },
      select: { id: true }
    });

    if (existingOffer) {
      throw new ConflictException("That location already has an offer for this canonical test.");
    }
  }

  private mapAdminOffer(offer: {
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
    providerLocation: {
      id: string;
      name: string | null;
      organizationId: string;
      organization: { id: string; name: string };
    };
    test: {
      id: string;
      name: string;
      slug: string;
      category: string;
      isActive: boolean;
    };
  }) {
    return {
      id: offer.id,
      providerId: offer.providerLocation.organization.id,
      providerName: offer.providerLocation.organization.name,
      providerLocationId: offer.providerLocationId,
      providerLocationName: offer.providerLocation.name,
      testId: offer.testId,
      testName: offer.test.name,
      testSlug: offer.test.slug,
      testCategory: offer.test.category,
      testIsActive: offer.test.isActive,
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

  private mapCanonicalTest(test: {
    id: string;
    name: string;
    slug: string;
    category: TestCategory;
    description: string | null;
    preparationNotes: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    _count: {
      aliases: number;
      offers: number;
    };
  }) {
    return {
      id: test.id,
      name: test.name,
      slug: test.slug,
      category: test.category,
      description: test.description,
      preparationNotes: test.preparationNotes,
      isActive: test.isActive,
      createdAt: test.createdAt,
      updatedAt: test.updatedAt,
      aliasCount: test._count.aliases,
      offerCount: test._count.offers
    };
  }

  private mapProviderSnapshot(provider: {
    id: string;
    name: string;
    type: string;
    phone: string | null;
    website: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
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
    locations: Array<{
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
      operatingHours: Array<{
        id: string;
        dayOfWeek: number;
        opensAt: string;
        closesAt: string;
        isClosed: boolean;
      }>;
      paymentMethods: Array<{
        id: string;
        paymentMethod: {
          id: string;
          code: string;
          label: string;
        };
      }>;
      offers: Array<{
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
        lastVerifiedAt: Date | null;
        verifiedByUserId: string | null;
        verificationSource: string;
        publicStatus: string;
        createdAt: Date;
        updatedAt: Date;
        test: {
          id: string;
          name: string;
          slug: string;
          category: string;
          description: string | null;
          preparationNotes: string | null;
          isActive: boolean;
        };
        verifiedByUser: {
          id: string;
          email: string;
          fullName: string;
          role: UserRole;
          isActive: boolean;
        } | null;
        verificationRecords: Array<{
          id: string;
          offerId: string;
          verifiedAt: Date;
          verifiedByUserId: string;
          method: string;
          notes: string | null;
          verifiedByUser: {
            id: string;
            email: string;
            fullName: string;
            role: UserRole;
            isActive: boolean;
          };
        }>;
      }>;
    }>;
  }) {
    const users = provider.memberships
      .slice()
      .sort((left, right) => left.user.fullName.localeCompare(right.user.fullName))
      .map((membership) => ({
        id: membership.user.id,
        fullName: membership.user.fullName,
        email: membership.user.email,
        role: membership.user.role,
        membershipRole: membership.role,
        isActive: membership.user.isActive
      }));

    const locations = provider.locations.map((location) => ({
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
      updatedAt: location.updatedAt,
      operatingHours: location.operatingHours.map((hour) => ({
        id: hour.id,
        dayOfWeek: hour.dayOfWeek,
        opensAt: hour.opensAt,
        closesAt: hour.closesAt,
        isClosed: hour.isClosed
      })),
      paymentMethods: location.paymentMethods.map((entry) => ({
        id: entry.paymentMethod.id,
        code: entry.paymentMethod.code,
        label: entry.paymentMethod.label
      })),
      offers: location.offers.map((offer) => ({
        id: offer.id,
        providerLocationId: offer.providerLocationId,
        testId: offer.testId,
        test: {
          id: offer.test.id,
          name: offer.test.name,
          slug: offer.test.slug,
          category: offer.test.category,
          description: offer.test.description,
          preparationNotes: offer.test.preparationNotes,
          isActive: offer.test.isActive
        },
        priceAmount: offer.priceAmount.toString(),
        currencyCode: offer.currencyCode,
        priceNotes: offer.priceNotes,
        turnaroundTime: offer.turnaroundTime,
        requiresAppointment: offer.requiresAppointment,
        walkInAllowed: offer.walkInAllowed,
        isAvailable: offer.isAvailable,
        lastVerifiedAt: offer.lastVerifiedAt,
        verifiedByUserId: offer.verifiedByUserId,
        verificationSource: offer.verificationSource,
        publicStatus: offer.publicStatus,
        createdAt: offer.createdAt,
        updatedAt: offer.updatedAt,
        verifiedByUser: offer.verifiedByUser
          ? {
              id: offer.verifiedByUser.id,
              email: offer.verifiedByUser.email,
              fullName: offer.verifiedByUser.fullName,
              role: offer.verifiedByUser.role,
              isActive: offer.verifiedByUser.isActive
            }
          : null,
        verificationRecords: offer.verificationRecords.map((record) => ({
          id: record.id,
          offerId: record.offerId,
          verifiedAt: record.verifiedAt,
          verifiedByUserId: record.verifiedByUserId,
          method: record.method,
          notes: record.notes,
          verifiedByUser: {
            id: record.verifiedByUser.id,
            email: record.verifiedByUser.email,
            fullName: record.verifiedByUser.fullName,
            role: record.verifiedByUser.role,
            isActive: record.verifiedByUser.isActive
          }
        }))
      }))
    }));

    return {
      id: provider.id,
      name: provider.name,
      type: provider.type,
      phone: provider.phone,
      website: provider.website,
      isActive: provider.isActive,
      createdAt: provider.createdAt,
      updatedAt: provider.updatedAt,
      locationCount: locations.length,
      userCount: users.length,
      offerCount: locations.reduce((count, location) => count + location.offers.length, 0),
      users,
      locations
    };
  }
}
