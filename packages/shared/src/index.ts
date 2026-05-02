export type Role = "USER" | "AGENT" | "ADMIN";

export type UploadedPropertyImage = {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
};
