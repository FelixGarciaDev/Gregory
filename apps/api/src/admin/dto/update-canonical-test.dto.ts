import { TestCategory } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class UpdateCanonicalTestDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(/\S/, { message: "name must not be empty" })
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: "slug must contain only lowercase letters, numbers, and single hyphens"
  })
  slug?: string;

  @IsOptional()
  @IsEnum(TestCategory)
  category?: TestCategory;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  preparationNotes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
