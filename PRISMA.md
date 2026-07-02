# Prisma + Neon Command Reference

## One-time setup

```bash
# Create dev branch off production (copy of all real data)
neonctl branches create --name dev --parent production
```
Point local `.env` at the `dev` branch connection string. Keep Vercel's production env pointed at `production`.

## Feature development loop (local, against `dev` branch)

```bash
# 1. Edit prisma/schema.prisma with your changes

# 2. Generate + apply migration against dev branch
npx prisma migrate dev --name <change_description>

# 3. Test your feature locally
```

## Deploying to production

```bash
# Applies pending migrations in order, no shadow DB, no reset risk
npx prisma migrate deploy
```
Run this in your Vercel build step (build command or postinstall), with `DATABASE_URL` pointed at `production`.

## Resetting dev branch back to match production

```bash
neonctl branches reset dev --parent production
```
Run before starting a new feature to avoid drift/stale test data.

## Checking migration status

```bash
npx prisma migrate status
```

## If drift/history ever gets out of sync again (recovery only — avoid if possible)

```bash
# 1. Snapshot first
neonctl branches create --name pre-baseline-snapshot --parent production

# 2. Confirm schema.prisma matches live DB
npx prisma db pull --print

# 3. Drop stale migration tracking table (run against DB directly)
DROP TABLE IF EXISTS "_prisma_migrations";

# 4. Generate baseline migration
mkdir -p prisma/migrations/0_init
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script > prisma/migrations/0_init/migration.sql

# 5. Mark baseline as applied
npx prisma migrate resolve --applied 0_init

# 6. Verify
npx prisma migrate status
```

## Rules of thumb
- Never run `migrate dev` against `production`.
- Never use `db push` if you want migration history preserved.
- Never edit schema directly in Neon dashboard.