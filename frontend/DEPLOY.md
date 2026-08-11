# Frontend Deployment Instructions (Vercel)

## Vercel Dashboard Settings

- **Framework Preset**: Vite (should be auto-detected by Vercel)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Required Environment Variables

You must set the following environment variable in the Vercel dashboard before deploying:

- `VITE_API_URL`: The URL of your deployed Render backend (e.g., `https://mini-erp-crm-backend.onrender.com`).

*Note: Once this frontend is deployed, remember to copy its URL and add it to the `FRONTEND_URL` environment variable in your Render backend settings so CORS allows requests from this frontend!*
