# VehicleMarket — Backend API

Production-grade REST + Socket.io backend for an Indian **used-vehicle marketplace** (Spinny-style):
buyers browse listings and raise **Buy Requests**, sellers submit **Sell Requests** (with photos)
which admins review, inspect, offer on, and convert into live listings. Admins manage vehicles,
master data, requests, users, live chat, content and SEO.

Stack: **Node · TypeScript · Express · MongoDB (Mongoose) · Joi · Socket.io · Swagger/OpenAPI 3**.

---

## 1. Requirements

- Node.js 18+
- MongoDB 5+ (local or Atlas). Optional: Redis (Upstash) — an in-memory fallback is used when unset.
- npm 9+

## 2. Quick start

```bash
cd backend
cp environment/development.env .env.example   # optional reference; the app reads environment/development.env
npm install
npm run seed          # master data + admin/employee/user + sample vehicles + content
npm run dev           # ts-node-dev on http://localhost:4000
```

- API base: `http://localhost:4000/api/v1`
- Swagger UI: `http://localhost:4000/api-docs`
- Raw OpenAPI spec: `http://localhost:4000/api-docs.json`
- Health: `http://localhost:4000/health`

The environment file used is chosen by `NODE_ENV` from `environment/<NODE_ENV>.env`
(see `src/config/environment.ts`).

## 3. npm scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start with ts-node-dev (hot reload) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm start` / `npm run prod` | Run the compiled server |
| `npm test` | Jest (unit + integration with mongodb-memory-server) |
| `npm run build:check` | `tsc --noEmit` type-check |
| `npm run lint` | ESLint |
| `npm run seed` | Run all seeders (master → admin → vehicles → content) |
| `npm run seed:master` / `:admin` / `:vehicles` / `:content` | Individual seeders |
| `npm run docs:generate` | Regenerate `docs/openapi.json` from `scripts/generateOpenapi.js` |
| `npm run docs:check` | Verify every mounted route appears in the spec |

## 4. Seeded credentials

| Role | Email | Password |
| --- | --- | --- |
| ADMIN | `admin@vehiclemarket.in` | `Admin@123` |
| EMPLOYEE | `employee@vehiclemarket.in` | `Employee@123` |
| USER | `user@vehiclemarket.in` | `User@12345` |

Seeding also inserts Indian states/UTs, cities, RTO codes, brands per category, popular models,
features, ~13 sample vehicles across all five categories, banners, testimonials, FAQs and site/SEO settings.

## 5. Architecture

Layered 5-tier flow, mirroring the reference conventions:

```
route (validate Joi) → controller (asyncHandler) → service (business logic)
        → dao (Mongoose queries) → model (strict schema)
```

```
src/
  app.ts, server.ts           Express factory + bootstrap (socket init, graceful shutdown)
  config/                     environment (singleton), database, redis
  constants/                  india (states/cities/RTO), vehicleEnums, storagePaths, emailConstants
  middleware/                 auth, role (RBAC), validate (Joi), errorHandler, rateLimiter,
                              upload (multer memory), mongoSanitize
  models/                     19 Mongoose models (strict: true)
  validators/                 Joi schemas per module (reject unknown fields)
  controllers/                HTTP handlers
  services/                   business logic
  dao/                        data-access layer
  shared/helpers/             password, token, cookie, roles, registration (mask/regex), indian
  shared/lib/                 storage (S3-compatible + local fallback)
  shared/serializers/         toPublicVehicle / toStaffVehicle / toVehicleCard
  socket/                     Socket.io (JWT handshake, user/admin/ticket rooms)
  seeds/                      master, admin, vehicles, content
  utils/                      AppError, apiResponse (envelope), asyncHandler
  types/                      AuthenticatedRequest, express augmentation
scripts/                      generateOpenapi.js, checkOpenapi.ts, build.js
docs/openapi.json             static OpenAPI 3.0.3 spec (source of truth for the frontend)
```

### Response envelope

Success:

```json
{ "success": true, "message": "...", "data": { }, "pagination": { "page": 1, "limit": 20,
  "totalItems": 100, "totalPages": 5, "hasNextPage": true, "hasPrevPage": false } }
```

Error:

```json
{ "success": false, "message": "...", "error": "CODE", "errors": ["field: reason"] }
```

## 6. Auth

- Email + password. Passwords hashed with bcrypt (`BCRYPT_ROUNDS`).
- **Access token** — JWT (default 15m), returned in the response, sent as `Authorization: Bearer <token>`.
- **Refresh token** — JWT (default 7d) in the httpOnly cookie `vm_refresh`.
  - `POST /auth/login` sets the cookie; `POST /auth/refresh-token` (or `POST /auth/refresh`) rotates it.
- Roles: `USER`, `EMPLOYEE`, `ADMIN`. `requireRole(...)` returns 401 if unauthenticated, 403 if not allowed.
- Token blacklist (logout) is stored in Redis when configured, otherwise the in-memory store.

## 7. Key modules & routes

All endpoints are documented at `/api-docs`. Summary by tag:

- **Auth** — register, login, logout, refresh, forgot/reset password, verify-email, me (GET/PATCH), change password, profile image.
- **Vehicles (public)** — list with filters/sort/pagination, featured, filters-meta, by-slug, by-id, similar.
- **Vehicles (admin/employee)** — create/update, status, soft delete, multi-image add/remove, admin list & detail.
- **Buy Requests** — create (guest allowed, duplicate-window 409), mine, admin list, get, update (status/notes/assign).
- **Sell Requests** — create (guest allowed), mine, track by phone, admin list, get, update (pipeline/offer/inspection/notes/assign),
  `POST /:id/convert` → creates an `ACTIVE` Vehicle listing and marks the request `LISTED`.
- **Wishlist** — list, add, remove.
- **Master** — brands, models, locations, features (public reads + admin CRUD).
- **Chat** — tickets (create/mine/list/get/update), messages (list/send/image), read receipts.
- **Admin** — dashboard stats, users, notifications.
- **Content** — banners, testimonials, FAQs, contacts, site settings, SEO settings.
- **Uploads** — generic multipart upload (`files[]`) for the guest sell flow.
- **Sitemap** — `GET /sitemap.xml`.

### Socket.io

JWT handshake (token in `auth.token`). Rooms: `user:{id}`, `admin:notifications`, `ticket:{id}`.
Events: `new_message`, `ticket_updated`, `ticket:typing`, `ticket:read`.

## 8. Enum highlights (India-specific)

- **category**: TWO_WHEELER, THREE_WHEELER, PASSENGER_CAR, COMMERCIAL, CARAVAN_MOTORHOME
- **usageType**: PRIVATE, COMMERCIAL · **commercial subCategory**: LIGHT_COMMERCIAL … TRACTOR, E_RICKSHAW
- **bodyType**: HATCHBACK, SEDAN, SUV, MUV, OPEN_BODY, CLOSED_CONTAINER, TIPPER, TANKER, MOTORHOME, …
- **fuelType**: PETROL, DIESEL, CNG, LPG, ELECTRIC, HYBRID, PETROL_CNG, PETROL_LPG
- **transmission**: MANUAL, AUTOMATIC, AMT, CVT, DCT, IMT · **bsNorm**: BS3, BS4, BS6, BS6_PHASE_2, ELECTRIC_NA
- **status (vehicle)**: DRAFT, ACTIVE, RESERVED, SOLD, INACTIVE
- **BuyRequest status**: NEW, CONTACTED, TEST_DRIVE_SCHEDULED, NEGOTIATION, CLOSED_WON, CLOSED_LOST
- **SellRequest status**: SUBMITTED, UNDER_REVIEW, INSPECTION_SCHEDULED, INSPECTED, OFFER_MADE, ACCEPTED, REJECTED, NEGOTIATING, LISTED, CLOSED

## 9. Security

- `helmet`, CORS from `ALLOWED_ORIGINS`, global + strict rate limits, `express-mongo-sanitize`.
- Joi validation on every route; unknown fields rejected.
- RBAC on all mutating admin routes.
- Public responses mask/omit admin-only fields: full registration number (masked), chassis/engine numbers and inspection report URLs (removed), internal notes (admin/employee only). See `shared/serializers/vehicle.serializer.ts`.
- Uploads: MIME whitelist + size limits (`MAX_FILE_SIZE`), image count limit (`MAX_IMAGES_PER_VEHICLE`).

## 10. Environment variables

See `environment/development.env` and `.env.example`. Key ones:

| Var | Meaning |
| --- | --- |
| `PORT` | HTTP port (default 4000) |
| `MONGO_URI`, `DB_NAME` | MongoDB connection |
| `REDIS_URL`, `REDIS_TOKEN` | Optional Redis (in-memory fallback when empty) |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` / expiries | Token signing |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins |
| `RESEND_API_KEY` | Email provider; empty ⇒ console stub |
| `STORAGE_MODE`, `S3_*`, `LOCAL_UPLOAD_PATH` | Storage (local fallback) |
| `MAX_FILE_SIZE`, `MAX_IMAGES_PER_VEHICLE` | Upload limits |
| `RATE_LIMIT_*` | Rate limiting |
| `BCRYPT_ROUNDS` | Password hashing cost |
| `ADMIN_EMAIL` | Extra admin account created by the seeder |

## 11. Testing & verification

```bash
npm run build:check      # tsc --noEmit
npm test                 # 63 tests: unit (helpers/validators/envelope/rbac) + integration (full flows)
npm run docs:check       # every mounted route documented (99/99)
```

Integration tests run against an in-memory MongoDB (`mongodb-memory-server`) and cover:
health + spec, auth register/login/me, vehicle CRUD + filters, buy-request duplicate 409,
sell-request submit → track → pipeline → convert (creates listing), and RBAC 401/403.

## 12. Notes / assumptions

- The reference project's travel-only modules (trips, packages, payments/Razorpay, Google OAuth, careers, etc.) are intentionally dropped.
- Redis is optional; without it, token blacklist/refresh sessions use an in-memory store (fine for dev, single-instance).
- Email is a pluggable stub: console transport in dev, Resend when `RESEND_API_KEY` is set.
- The OpenAPI spec in `docs/openapi.json` is generated by `scripts/generateOpenapi.js` and is the **source of truth** for the frontend API layer.
