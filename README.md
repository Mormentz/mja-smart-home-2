This is the **HomeConnect** housing marketplace built with [Next.js](https://nextjs.org).

## Getting Started

### 1. Environment

Copy `.env.example` to `.env.local` and set:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/homeconnect?schema=public"
AUTH_SECRET="<run: openssl rand -base64 32>"
AUTH_URL="http://localhost:3000"
```

### 2. Database

Start PostgreSQL (Docker example):

```bash
docker run -d --name homeconnect-db \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=homeconnect \
  -p 5432:5432 postgres:16
```

Push schema and seed demo data:

```bash
pnpm db:push
pnpm db:seed
```

### 3. Dev server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Auth & Roles

Auth uses **Auth.js (NextAuth v5)** with email/password credentials and optional Google OAuth.

| Route | Purpose |
|-------|---------|
| `/login` | Sign in |
| `/signup` | Create account with role selection |
| `/dashboard` | Role-based dashboard (protected) |

**Demo accounts** (after seeding): `admin@demo.com`, `user@demo.com`, `agent@demo.com`, `artisan@demo.com` — password: `password123`

**Roles:** Admin, User, Agent, Artisan — each gets tailored dashboard navigation. Agents cover former landlord use-cases. Users can rent and buy.

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server |
| `pnpm db:push` | Push Prisma schema to DB |
| `pnpm db:seed` | Seed demo users & properties |
| `pnpm db:studio` | Open Prisma Studio |

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
