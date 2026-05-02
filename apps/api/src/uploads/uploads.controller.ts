import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { CurrentUser, RequestUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { SignPropertyImageUploadDto } from "./upload.dto";
import { UploadsService } from "./uploads.service";

@Controller("uploads")
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("sign-property-image")
  signPropertyImage(@CurrentUser() user: RequestUser, @Body() dto: SignPropertyImageUploadDto) {
    return this.uploadsService.signPropertyImageUpload(user.sub, dto.fileName);
  }
}
