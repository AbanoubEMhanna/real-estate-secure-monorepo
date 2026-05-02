# Real Estate Secure Monorepo

NestJS REST API + PostgreSQL/Prisma + Flutter mobile app for a real estate product. File uploads are mobile-originated and go directly to Cloudinary with backend-generated signed parameters.

## Structure

- `apps/api`: NestJS API with JWT auth, property management, Prisma, and Cloudinary signing.
- `apps/mobile`: Flutter app with login and property creation including image upload.
- `packages/shared`: shared TypeScript contracts for backend-facing payloads.

## Upload security model

The Cloudinary API secret never ships to mobile. The mobile app:

1. Authenticates with the API.
2. Requests signed upload parameters from `POST /uploads/sign`.
3. Uploads the selected image directly to Cloudinary using the returned signature.
4. Sends the returned `public_id` and `secure_url` when creating a property.

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
