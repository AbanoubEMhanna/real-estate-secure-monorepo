export type Role = "USER" | "AGENT" | "ADMIN";

export type CloudinaryDirectUploadSignature = {
  cloudName: string;
  apiKey: string;
  uploadUrl: string;
  maxBytes: number;
  allowedFormats: string[];
  params: {
    folder: string;
    public_id: string;
    timestamp: number;
    tags: string;
    allowed_formats: string;
    overwrite: "false";
  };
  signature: string;
};

export type UploadedPropertyImage = {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
};
