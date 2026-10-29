Yes. You can access Better Auth's user data from your Prisma 8 application. You don't need to move authentication to Prisma or create a second database.

For CollabCode, the cleanest approach is:

- Better Auth owns authentication and manages its `user`, `session`, `account`, and `verification` tables.
- Prisma 8 manages your application data, such as projects, rooms, and memberships.
- Both connect to the same PostgreSQL database.
- When an API needs user information, Prisma can query the authentication tables too, provided you expose those tables in its schema/contract and your Prisma 8 runtime supports querying them.

## 1. First, make sure Prisma can see Better Auth's tables

Your Prisma 8 configuration uses:

```
contract: "./src/prisma/contract/**/*.prisma",
db: {
  connection: process.env["DATABASE_URL"]!,
},
```

That means Prisma 8 uses its contract to determine which database tables and fields your application can query.

If Better Auth's tables are in the same PostgreSQL database, you can include them in the Prisma 8 contract. Prisma 8 supports inferring a contract from an existing PostgreSQL database.&#x20;

[image](https://www.google.com/s2/favicons?domain=https://www.prisma.io&sz=32)

Prisma Documentation+1

Before doing this, confirm whether Better Auth created its tables in `public` or a separate `auth` schema. They must be visible to your Prisma connection and included in the contract.

## 2. Infer the existing tables into your Prisma 8 contract

Back up your current contract files first. Then, from your monorepo root, run the Prisma 8 contract-inference command in your database workspace:

```
pnpm --filter @codiooo/db exec prisma contract infer --output ./src/prisma/contract.prisma
```

Inspect the generated contract before replacing or merging any existing models. The output path must be compatible with the contract glob in your Prisma config.

Important: inference reads the database structure; it doesn't mean Prisma should own Better Auth's migrations. Continue letting Better Auth manage its authentication schema, and avoid using Prisma migrations to modify those same tables.

## 3. How an API should access the data

There are two different use cases.

### A. Get the currently authenticated user

Use Better Auth's session API. You generally should not query the `session` table directly.

```
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

const session = await auth.api.getSession({
  headers: await headers(),
});

if (!session) {
  throw new Error("Unauthorized");
}

const userId = session.user.id;
```

This is the right approach for protecting APIs and identifying the current user.

### B. Query authentication-related user data through Prisma 8

Suppose you need a user's profile while handling a project API. Once the Better Auth `user` table is included in your Prisma 8 contract, you can query it through the generated Prisma 8 database API.

The exact model accessor and query syntax depend on your emitted contract and Prisma 8 runtime. Use the actual generated API rather than copying Prisma 7's `prisma.user.findUnique()` syntax without checking compatibility.

For ordinary CollabCode APIs, though, you usually don't need to query the Better Auth user table at all. You can use `session.user.id` to query your own application tables.

For example, your data model might conceptually look like:

```
Better Auth
└── user
    └── id

CollabCode
├── Project
│   └── ownerId → Better Auth user.id
├── Room
└── Membership
    ├── userId → Better Auth user.id
    └── roomId → Room.id
```

The IDs must have compatible types. Your API should check the current user's ownership or membership before returning or modifying project data.

## My recommendation

- Use Better Auth's session API for authentication.
- Use Prisma 8 for project, room, and membership queries.
- Include Better Auth's user model in the Prisma 8 contract only when you actually need to query user records through Prisma.
- Avoid updating password hashes, sessions, or OAuth accounts directly through Prisma. Let Better Auth manage those operations.

One detail would help me give you the exact Prisma 8 query code: did Better Auth create its tables in the `public` schema or in a separate `auth` schema?
