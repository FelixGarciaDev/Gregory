import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUUID, Matches, MaxLength } from "class-validator";

export class CreateProviderOfferDto {
  @IsUUID()
  providerLocationId!: string;

  @IsUUID()
  testId!: string;

  @Transform(({ value }) => (value == null ? value : String(value)))
  @Matches(/^\d+(\.\d{1,2})?$/)
  priceAmount!: string;

  @IsString()
  @MaxLength(8)
  currencyCode!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  priceNotes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  turnaroundTime?: string;

  @IsOptional()
  @IsBoolean()
  requiresAppointment?: boolean;

  @IsOptional()
  @IsBoolean()
  walkInAllowed?: boolean;
}
