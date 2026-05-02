import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  ValidateNested
} from "class-validator";

export class PropertyImageDto {
  @IsString()
  @MaxLength(180)
  publicId: string;

  @IsUrl({ require_protocol: true })
  secureUrl: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  width?: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  height?: number;
}

export class CreatePropertyDto {
  @IsString()
  @MaxLength(140)
  title: string;

  @IsString()
  @MaxLength(3_000)
  description: string;

  @Type(() => Number)
  @IsPositive()
  price: number;

  @IsString()
  @MaxLength(80)
  city: string;

  @IsString()
  @MaxLength(180)
  address: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  bedrooms: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  bathrooms: number;

  @Type(() => Number)
  @IsInt()
  @IsPositive()
  areaSqm: number;

  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => PropertyImageDto)
  images: PropertyImageDto[] = [];
}
