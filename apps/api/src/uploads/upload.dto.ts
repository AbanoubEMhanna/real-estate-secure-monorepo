import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class SignUploadDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  context?: string;

  @IsOptional()
  @IsIn(["image"])
  resourceType?: "image";
}
