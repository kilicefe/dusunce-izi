# Database Setup & Prisma Migration Guide (PostgreSQL)

## Required Environment Variables
```env
DATABASE_URL="postgresql://<user>:<password>@<host>:5432/<dbname>?schema=public&pgbouncer=true"
DIRECT_URL="postgresql://<user>:<password>@<host>:5432/<dbname>?schema=public"
```

## Migration Commands
1. Validate & Format Schema:
   `npx prisma format`
   `npx prisma validate`

2. Generate Client:
   `npx prisma generate`

3. Execute Migrations:
   `npx prisma migrate deploy`

4. Seed Synthetic Development Data:
   `npx prisma db seed`
