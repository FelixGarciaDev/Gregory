import { MembershipRole, UserRole } from "@prisma/client";
import { IsEmail, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateProviderWorkspaceUserDto {
  @IsString()
  @MaxLength(160)
  fullName!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string;

  @IsEnum(UserRole)
  role!: "provider_admin" | "provider_user";

  @IsOptional()
  @IsEnum(MembershipRole)
  membershipRole?: MembershipRole;
}
