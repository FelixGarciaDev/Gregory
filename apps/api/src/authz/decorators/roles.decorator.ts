import { UserRole } from "@prisma/client";
import { SetMetadata } from "@nestjs/common";
import { ROLES_KEY } from "../constants";

export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
