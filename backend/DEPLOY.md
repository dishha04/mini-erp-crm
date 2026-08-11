# Backend Deployment Instructions (Render)

## Render Dashboard Settings

- **Environment**: Node
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`

## Required Environment Variables

You must set the following environment variables in the Render dashboard:

- `DATABASE_URL`: Your production database URL (e.g., Neon connection string).
- `JWT_SECRET`: A secure random string for signing JWT tokens.
- `NODE_ENV`: `production`
- `FRONTEND_URL`: The URL of your deployed Vercel frontend (e.g., `https://mini-erp-crm.vercel.app`). *Leave blank or set to `*` until the frontend is deployed, then update this value.*
- `PORT`: (Render sets its own `PORT` automatically. Our app already uses `process.env.PORT` with a fallback, so no action is required here, but do not override it).

## Database Initialization (Important!)

After the **first successful deployment** on Render, you must initialize the production database schema and seed the initial users.

1. Open the **Shell** tab for your Web Service in the Render dashboard.
2. Run the production migration command (do *not* use `migrate dev`):
   ```bash
   npx prisma migrate deploy
   ```
3. Run the seed script to populate the database with the 4 test users for evaluators:
   ```bash
   npm run db:seed
   ```
