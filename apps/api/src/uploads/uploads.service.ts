import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { v2 as cloudinary } from "cloudinary";
import { randomUUID } from "node:crypto";

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

  signPropertyImageUpload(userId: string, fileName?: string) {
    const timestamp = Math.floor(Date.now() / 1000);
    const rootFolder = this.config.get<string>("CLOUDINARY_UPLOAD_FOLDER", "real-estate");
    const folder = `${rootFolder}/${userId}/properties`;
    const publicId = this.buildPublicId(fileName);
    const paramsToSign = {
      folder,
      public_id: publicId,
      timestamp,
      tags: "real-estate,property",
      allowed_formats: "jpg,jpeg,png,webp",
      overwrite: "false"
    };

    return {
      cloudName: this.config.getOrThrow<string>("CLOUDINARY_CLOUD_NAME"),
      apiKey: this.config.getOrThrow<string>("CLOUDINARY_API_KEY"),
      uploadUrl: `https://api.cloudinary.com/v1_1/${this.config.getOrThrow<string>(
        "CLOUDINARY_CLOUD_NAME"
      )}/image/upload`,
      maxBytes: 5 * 1024 * 1024,
      allowedFormats: ["jpg", "jpeg", "png", "webp"],
      params: paramsToSign,
      signature: cloudinary.utils.api_sign_request(
        paramsToSign,
        this.config.getOrThrow<string>("CLOUDINARY_API_SECRET")
      )
    };
  }

  private buildPublicId(fileName?: string) {
    const cleanBaseName = fileName
      ?.replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 48);

    return `${cleanBaseName || "property"}-${randomUUID()}`;
  }
}
