import { IsNumberString, IsOptional, IsString } from "class-validator";

export class SearchQueryDto {
  @IsString()
  q!: string;

  @IsOptional()
  @IsNumberString()
  lat?: string;

  @IsOptional()
  @IsNumberString()
  lng?: string;

  @IsOptional()
  @IsNumberString()
  radius_km?: string;
}

