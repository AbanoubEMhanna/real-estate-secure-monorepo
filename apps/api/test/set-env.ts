process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://postgres:postgres@localhost:55432/real_estate_e2e?schema=public";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? "test-access-secret-minimum-32-characters";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret-minimum-32-characters";
process.env.CORS_ORIGINS = "http://localhost:3000";
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? "pompo";
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? "test-api-key";
process.env.CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET ?? "test-cloudinary-secret-minimum-32-characters";
process.env.CLOUDINARY_UPLOAD_FOLDER = process.env.CLOUDINARY_UPLOAD_FOLDER ?? "real-estate-test";
