import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { MembershipRole, UserRole } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";
import { PrismaService } from "../prisma/prisma.service";
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

  private hashPassword(password: string) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = scryptSync(password, salt, 64).toString("hex");
    return `scrypt:${salt}:${derivedKey}`;
  }

  private defaultMembershipRoleFor(role: UserRole) {
    return role === UserRole.provider_admin ? MembershipRole.manager : MembershipRole.staff;
  }
}
