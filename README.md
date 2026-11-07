# Codiooo

Browser-based collaborative cloud IDE: projects, rooms, real-time
editing (Yjs/Hocuspocus), Monaco editor and an in-browser runtime
(WebContainer).

## Monorepo

pnpm + Turborepo. Node `>=24`.

| Path | What it is |
|---|---|
| `apps/web` | Next.js 16 app (UI + API routes + Better Auth) |
| `apps/collab-server` | Hocuspocus WebSocket server (JWT auth + PostgreSQL persistence) |
| `packages/db` | Prisma 8 RC contract + `@codiooo/db` runtime client |
| `packages/collab-token` | Shared collaboration JWT sign/verify (`jose`) |
| `packages/eslint-config`, `packages/typescript-config` | Shared configs |

## Quick start

```sh
cp apps/web/.env.example apps/web/.env.local   # fill in values
cp apps/collab-server/.env.example apps/collab-server/.env
cp packages/db/.env.example packages/db/.env   # DATABASE_URL
pnpm install
docker compose up -d                            # PostgreSQL on :5433
pnpm --filter @codiooo/db contract:emit
pnpm --filter @codiooo/db db:verify             # schema in sync
pnpm dev                                        # turbo: web :3000 + collab :1234
```

`COLLAB_TOKEN_SECRET` must be identical in `apps/web/.env.local` and
`apps/collab-server/.env`. Generate with `openssl rand -base64 48`.

## Commands

```sh
pnpm build / lint / check-types   # turbo across all packages
pnpm --filter web test            # security + auth + collab-token suites
pnpm --filter @codiooo/collab-token test
pnpm --filter @codiooo/collab-server test
```

## Database (Prisma 8 RC)

- Contract source: `packages/db/src/prisma/contract/*.prisma`.
- Emit: `pnpm --filter @codiooo/db contract:emit`.
- Migrations live in `packages/db/migrations/` (planner: `migration plan`,
  apply: `db migrate`). `db update` is dev-only and writes no history.
- Better Auth tables are created by the Prisma migration; do **not** run
  `better-auth migrate`.

## Authentication & authorization

- Better Auth (`apps/web/src/lib/auth.ts`) owns identity: email/password
  + GitHub OAuth, opaque sessions, `COLLAB_TOKEN_SECRET` never reaches
  the browser. Email verification is disabled (no mail provider).
- API authorization is server-side (`withAuth` + service layers): users
  reach only projects they own or are `ProjectMember` of; rooms resolve
  through their project. Room token issuance (`GET /api/rooms/:id/token`)
  re-checks access and returns 404 otherwise.
- The collaboration server verifies the 5-minute JWT
  (`packages/collab-token`) in `onAuthenticate` and persists Yjs state
  to PostgreSQL (`DocumentState`, debounced). Rooms without a `Document`
  are live-sync-only.

## Environment variables

See `apps/web/.env.example` and `apps/collab-server/.env.example`.
Server secrets are validated at startup (`apps/web/src/lib/env.ts`);
client-visible variables are limited to `NEXT_PUBLIC_COLLAB_URL`.
