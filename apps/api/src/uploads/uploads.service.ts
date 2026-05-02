import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";

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

  signImageUpload(userId: string, context?: string) {
    const timestamp = Math.floor(Date.now() / 1000);
    const rootFolder = this.config.get<string>("CLOUDINARY_UPLOAD_FOLDER", "real-estate");
    const folder = `${rootFolder}/${userId}`;
    const tags = ["real-estate", context ?? "property"].join(",");
    const params = {
      folder,
      timestamp,
      tags
    };

    const signature = cloudinary.utils.api_sign_request(
      params,
      this.config.getOrThrow<string>("CLOUDINARY_API_SECRET")
    );

    return {
      cloudName: this.config.getOrThrow<string>("CLOUDINARY_CLOUD_NAME"),
      apiKey: this.config.getOrThrow<string>("CLOUDINARY_API_KEY"),
      timestamp,
      folder,
      tags,
      resourceType: "image",
      signature
    };
  }
}
