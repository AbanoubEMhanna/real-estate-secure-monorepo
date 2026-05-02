import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { UploadApiOptions, UploadApiResponse, v2 as cloudinary } from "cloudinary";

@Injectable()
export class UploadsService {
  constructor(private readonly config: ConfigService) {
    cloudinary.config({
      cloud_name: config.getOrThrow<string>("CLOUDINARY_CLOUD_NAME"),
      api_key: config.getOrThrow<string>("CLOUDINARY_API_KEY"),
      api_secret: config.getOrThrow<string>("CLOUDINARY_API_SECRET"),
      secure: true
    });
  }

  async uploadPropertyImage(userId: string, file: Express.Multer.File) {
    const rootFolder = this.config.get<string>("CLOUDINARY_UPLOAD_FOLDER", "real-estate");
    const folder = `${rootFolder}/${userId}/properties`;
    const result = await this.uploadBuffer(file.buffer, {
      folder,
      tags: ["real-estate", "property"],
      allowed_formats: ["jpg", "jpeg", "png", "webp"],
      resource_type: "image"
    });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };
  }

  private uploadBuffer(buffer: Buffer, options: UploadApiOptions) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve(result);
      });

      stream.end(buffer);
    });
  }
}
