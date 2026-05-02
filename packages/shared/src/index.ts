export type Role = "USER" | "AGENT" | "ADMIN";

export type CloudinarySignedUpload = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  signature: string;
};
