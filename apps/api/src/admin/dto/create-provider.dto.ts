import { OrganizationType } from "@prisma/client";
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from "class-validator";

export class CreateProviderDto {
  @IsString()
  @MaxLength(160)
  name!: string;

  @IsEnum(OrganizationType)
  type!: OrganizationType;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsUrl()
  @MaxLength(255)
  website?: string;
}
