# User Management & Database Setup

This project uses **Prisma ORM** with **SQLite** for data management. This setup is production-ready and can be easily switched to **PostgreSQL** or **MySQL** by changing the provider in `prisma/schema.prisma`.

## Setup
The database is already initialized at `dev.db`.

If you need to reset or modify the schema:
1. Edit `prisma/schema.prisma`
2. Run `npx prisma generate` (to update the client)
3. Run `npx prisma db push` (to update the database)

## Authentication
An `AuthService` (`src/services/authService.ts`) is provided with:
- `register(email, password, name)`
- `login(email, password)`

Passwords are hashed using `bcryptjs`.
Login returns a JWT token signed with `JWT_SECRET` (from `.env`).

## Usage
To use the database in your services:
```typescript
import { getPrisma } from './services/prismaService';

const prisma = getPrisma();
const users = await prisma.user.findMany();
```

## Flydrive Integration
Files are still stored using Flydrive (`StorageService`), but project metadata (ownership, etc.) is now stored in the database.
model Project {
  ...
  localPath String? // Links to Flydrive/Disk path
  owner     User    @relation(...)
}
```
