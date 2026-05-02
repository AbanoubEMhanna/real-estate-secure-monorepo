import { IsOptional, IsString, MaxLength } from "class-validator";

export class SignPropertyImageUploadDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  fileName?: string;
}
