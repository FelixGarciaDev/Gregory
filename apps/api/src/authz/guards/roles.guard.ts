import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { UserRole } from "@prisma/client";
import { Reflector } from "@nestjs/core";
import { ROLES_KEY } from "../constants";
import { RequestActor } from "../types/request-actor";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ]);

    if (!roles || roles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ actor?: RequestActor }>();

    if (!request.actor || !roles.includes(request.actor.role)) {
      throw new ForbiddenException("You do not have access to this resource.");
    }

    return true;
  }
}
