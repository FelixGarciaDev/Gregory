import { MembershipRole, UserRole } from "@prisma/client";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength
} from "class-validator";

export class UpdateProviderWorkspaceUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  fullName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: "provider_admin" | "provider_user";

  @IsOptional()
  @IsEnum(MembershipRole)
  membershipRole?: MembershipRole;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
