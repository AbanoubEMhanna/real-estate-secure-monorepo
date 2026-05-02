# Real Estate Secure Monorepo

NestJS REST API + PostgreSQL/Prisma + Flutter mobile app for a real estate product. File uploads are selected on mobile, sent to the backend as multipart form-data, and uploaded to Cloudinary by the API.

## Structure

- `apps/api`: NestJS API with JWT auth, property management, Prisma, and Cloudinary signing.
- `apps/mobile`: Flutter app with login and property creation including image upload.
- `packages/shared`: shared TypeScript contracts for backend-facing payloads.

## Upload security model

The Cloudinary API secret and API key never ship to mobile. The mobile app:

1. Authenticates with the API.
2. Sends the selected image to `POST /uploads/property-image` as multipart form-data.
3. The backend validates MIME type and size, then uploads to Cloudinary.
4. The backend returns `publicId`, `secureUrl`, width, and height.
5. The app sends those returned image references when creating a property.

Use `CLOUDINARY_CLOUD_NAME=pompo` in `.env`. Keep `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` only in the backend `.env`; do not add them to Flutter, Git, or CI logs.

## Run

```bash
cp .env.example .env
pnpm install
docker compose up -d postgres
pnpm prisma:generate
pnpm dev:api
cd apps/mobile && flutter pub get
flutter run --dart-define API_BASE_URL=http://10.0.2.2:3001
```
