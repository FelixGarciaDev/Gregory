import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { MembershipRole, UserRole } from "@prisma/client";
import { Reflector } from "@nestjs/core";
import { PrismaService } from "../../prisma/prisma.service";
import { IS_PUBLIC_KEY } from "../constants";
import { RequestActor } from "../types/request-actor";

type JwtPayload = {
  sub: string;
  email: string;
  role: UserRole;
  type?: string;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      actor?: RequestActor;
      headers: Record<string, string | string[] | undefined>;
    }>();
    const token = this.extractToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException("Missing bearer token.");
    }

    let payload: JwtPayload;

    try {
      payload = this.jwtService.verify<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException("Invalid token.");
    }

    if (payload.type === "refresh") {
      throw new UnauthorizedException("Invalid token.");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        memberships: {
          include: {
            organization: {
              select: {
                id: true,
                isActive: true,
                name: true
              }
            }
          }
        }
      }
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid token.");
    }

    request.actor = this.buildActor({
      email: user.email,
      fullName: user.fullName,
      memberships: user.memberships,
      role: user.role,
      userId: user.id
    });

    return true;
  }

  private buildActor(input: {
    userId: string;
    email: string;
    fullName: string;
    role: UserRole;
    memberships: Array<{
      role: MembershipRole;
      organization: {
        id: string;
        isActive: boolean;
        name: string;
      };
    }>;
  }): RequestActor {
    if (input.role !== UserRole.provider_admin && input.role !== UserRole.provider_user) {
      return {
        userId: input.userId,
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        organizationId: null,
        organizationName: null,
        membershipRole: null
      };
    }

    const activeMemberships = input.memberships.filter((membership) => membership.organization.isActive);

    if (activeMemberships.length !== 1) {
      throw new ForbiddenException(
        "Provider access requires exactly one active organization membership."
      );
    }

    return {
      userId: input.userId,
      email: input.email,
      fullName: input.fullName,
      role: input.role,
      organizationId: activeMemberships[0].organization.id,
      organizationName: activeMemberships[0].organization.name,
      membershipRole: activeMemberships[0].role
    };
  }

  private extractToken(header: string | string[] | undefined) {
    if (!header || Array.isArray(header)) {
      return null;
    }

    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
      return null;
    }

    return token;
  }
}
