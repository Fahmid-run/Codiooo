alter table "user" add column "createdAt" timestamptz default CURRENT_TIMESTAMP not null;

alter table "user" add column "updatedAt" timestamptz default CURRENT_TIMESTAMP not null;

alter table "session" add column "expiresAt" timestamptz not null;

alter table "session" add column "token" text not null;

alter table "session" add column "createdAt" timestamptz default CURRENT_TIMESTAMP not null;

alter table "session" add column "updatedAt" timestamptz not null;

alter table "session" add column "ipAddress" text;

alter table "session" add column "userAgent" text;

alter table "account" add column "accountId" text not null;

alter table "account" add column "providerId" text not null;

alter table "account" add column "accessToken" text;

alter table "account" add column "refreshToken" text;

alter table "account" add column "idToken" text;

alter table "account" add column "accessTokenExpiresAt" timestamptz;

alter table "account" add column "refreshTokenExpiresAt" timestamptz;

alter table "account" add column "password" text;

alter table "account" add column "createdAt" timestamptz default CURRENT_TIMESTAMP not null;

alter table "account" add column "updatedAt" timestamptz not null;

create table "verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null);

create unique index "session_token_uidx" on "session" ("token");

create index "verification_identifier_idx" on "verification" ("identifier");