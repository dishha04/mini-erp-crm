# Mini ERP + CRM Operations Portal

A complete operations portal providing CRM and mini-ERP functionalities. It manages customers, inventory, and sales challans with role-based access control (Admin, Sales, Warehouse, Accounts).

## Tech Stack
- **Backend:** Node.js, TypeScript, Express, Prisma ORM, PostgreSQL (Neon)
- **Frontend:** React, Vite, TypeScript
- **Deployment:** Render (Backend), Vercel (Frontend)

## Live URLs
- **Frontend:** https://mini-erp-crm-nu-nine.vercel.app
- **Backend:** https://mini-erp-crm-wohn.onrender.com

## Test Credentials
The database has been seeded with test accounts for each role:
- **Admin:** `admin@erp.test` / `Admin@123`
- **Sales:** `sales@erp.test` / `Sales@123`
- **Warehouse:** `warehouse@erp.test` / `Warehouse@123`
- **Accounts:** `accounts@erp.test` / `Accounts@123`

## Local Setup Instructions

### Backend
1. `cd backend`
2. `npm install`
3. Create a `.env` file based on `.env.example` and set the following variables:
   - `PORT=5000`
   - `DATABASE_URL=postgresql://...` (your PostgreSQL connection string)
   - `JWT_SECRET=your_jwt_secret`
   - `FRONTEND_URL=http://localhost:5173`
4. `npx prisma migrate dev`
5. `npm run db:seed`
6. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. Create a `.env` file based on `.env.example` and set:
   - `VITE_API_URL=http://localhost:5000`
4. `npm run dev`

## Deployment Instructions

### Backend (Render)
Deployed as a Web Service on Render using the free tier.
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm run start`
- **Environment Variables:** `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`
- Reference `backend/DEPLOY.md` for full details.

### Frontend (Vercel)
Deployed on Vercel linked directly to the GitHub repository.
- **Build Command:** `npm run build`
- **Environment Variables:** `VITE_API_URL` set to the live Render backend URL.
- Reference `frontend/DEPLOY.md` for full details.

## Architecture Overview
The project is structured as a monorepo containing an Express REST API backend and a React SPA frontend. The backend uses the Prisma ORM to interface with a PostgreSQL database hosted on Neon, and implements JWT-based authentication with role-based middleware for secure endpoint access. The React frontend consumes this REST API to provide a seamless user interface for managing customers, products, and challans.

## Known Limitations
- **Role-based UI:** The frontend does not conditionally hide UI actions by role. The backend enforces all authorization securely, so unauthorized actions will simply return a `403 Forbidden` error rather than being hidden from the UI.
- **Automated Tests:** No automated tests are included.
- **AWS Deployment:** Not used. The application is deployed to Render and Vercel free tiers instead, as AWS was marked as an optional/bonus requirement in the assignment.
- **Omitted Bonus Features:** Docker, GitHub Actions, PDF export, and S3 image upload were explicitly marked as bonus/optional and have not been implemented.
- **Styling:** Frontend styling is intentionally minimal and functional rather than fully polished.

## Assumptions Made
- **Role-Permission Mapping:**
  - **Read (GET):** Allowed for all roles (`ADMIN`, `SALES`, `WAREHOUSE`, `ACCOUNTS`) across all modules (Customers, Products, Challans).
  - **Customers Write (POST/PUT):** Allowed only for `ADMIN` and `SALES`.
  - **Products Write & Stock Movements (POST/PUT):** Allowed only for `ADMIN` and `WAREHOUSE`.
  - **Challans Write (POST/PUT):** Allowed only for `ADMIN` and `SALES`.
- **Challan Format:** Challan numbers are auto-generated linearly in the format `CH-00001`, `CH-00002`, etc., based on the total count of existing challans.
- **Challan Stock Impact:** Challans only impact product stock when explicitly confirmed (moving from `DRAFT` to `CONFIRMED`). Cancelling a confirmed challan returns the stock via an `IN` stock movement.
