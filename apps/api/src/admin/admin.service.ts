import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { MembershipRole, Prisma, UserRole } from "@prisma/client";
import { randomBytes, randomUUID, scryptSync } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateAdminProviderLocationDto } from "./dto/create-provider-location.dto";
import { CreateProviderDto } from "./dto/create-provider.dto";
import { CreateProviderUserDto } from "./dto/create-provider-user.dto";

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
