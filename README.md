# Real Estate Secure Monorepo

NestJS REST API + PostgreSQL/Prisma + Flutter mobile app for a real estate product. File uploads are selected on mobile and uploaded directly to Cloudinary using short-lived backend-signed upload parameters.

## Structure

- `apps/api`: NestJS API with JWT auth, property management, Prisma, and Cloudinary signing.
- `apps/mobile`: Flutter app with login and property creation including image upload.
- `packages/shared`: shared TypeScript contracts for backend-facing payloads.

## Upload security model

The Cloudinary API secret never ships to mobile. The Cloudinary API key is a public identifier; the backend keeps the API secret and signs constrained upload parameters. The mobile app:

1. Authenticates with the API.
2. Requests signed upload parameters from `POST /uploads/sign-property-image`.
3. Validates the local file extension and size using the returned policy.
4. Uploads the selected image directly to Cloudinary.
5. Sends the returned `publicId`, `secureUrl`, width, and height when creating a property.
6. The API accepts image references only when `publicId` belongs to the authenticated user's Cloudinary folder and `secureUrl` belongs to the configured Cloudinary cloud.

Use `CLOUDINARY_CLOUD_NAME=pompo` in `.env`. Keep `CLOUDINARY_API_SECRET` only in the backend `.env`; do not add it to Flutter, Git, or CI logs. `CLOUDINARY_API_KEY` is a public identifier required by Cloudinary direct uploads, but it should still be sourced from backend configuration.

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
