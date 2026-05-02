import {
  BadRequestException,
  Controller,
  FileTypeValidator,
  MaxFileSizeValidator,
  ParseFilePipe,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { CurrentUser, RequestUser } from "../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { UploadsService } from "./uploads.service";

const allowedImageMimeTypes = ["image/jpeg", "image/png", "image/webp"];

@Controller("uploads")
@UseGuards(JwtAuthGuard)
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post("property-image")
  @UseInterceptors(
    FileInterceptor("file", {
      limits: {
        files: 1,
        fileSize: 5 * 1024 * 1024
      },
      fileFilter: (_request, file, callback) => {
        if (!allowedImageMimeTypes.includes(file.mimetype)) {
          callback(new BadRequestException("Only JPEG, PNG, and WEBP images are allowed"), false);
          return;
        }
        callback(null, true);
      }
    })
  )
  uploadPropertyImage(
    @CurrentUser() user: RequestUser,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/ })
        ]
      })
    )
    file: Express.Multer.File
  ) {
    return this.uploadsService.uploadPropertyImage(user.sub, file);
  }
}
