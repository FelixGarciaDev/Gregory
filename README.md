# Gregory

Local-first monorepo scaffold for a medical test search prototype focused on Venezuela.

## Included

- `apps/api`: NestJS backend scaffold with REST endpoints, JWT auth skeleton, Prisma schema, and search stubs
- `apps/web-admin`: Next.js admin dashboard shell
- `apps/web-provider-portal`: Next.js provider portal shell
- `apps/worker`: Node/TypeScript worker scaffold
- `apps/android-consumer`: Android Studio Kotlin + Compose starter
- `packages/shared-domain`: shared enums and DTO-friendly types
- `packages/api-contracts`: API contract types for web consumers

## Local stack

```bash
pnpm install
docker compose up --build
```

The Android app runs from Android Studio and should point to `http://10.0.2.2:3000/v1` in the emulator.

