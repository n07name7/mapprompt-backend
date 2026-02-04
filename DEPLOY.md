# Deployment Guide

## Railway.app Setup

### Step 1: Create GitHub Repository
Repository already created and pushed to GitHub.

### Step 2: Deploy to Railway

1. **Sign up** at https://railway.app (use GitHub login)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose repository: `n07name7/mapprompt-backend`
5. Railway will auto-detect Node.js and deploy automatically

### Step 3: Configure Environment Variables

In Railway dashboard, add these variables:

```
NODE_ENV=production
PORT=3000
CORS_ORIGIN=https://n07name7.github.io
```

### Step 4: Get Production URL

After deployment, Railway will provide a URL like:
```
https://mapprompt-backend-production.up.railway.app
```

Copy this URL — you'll need it to update the frontend.

---

## How to Update

1. Push changes to `main` branch on GitHub
2. Railway auto-deploys (watch logs in dashboard)

---

## Monitoring

- **Logs:** Railway dashboard → your project → Deployments
- **Health check:** `https://your-app.railway.app/health`

---

## API Endpoints

- `POST /api/geocode` - Geocode addresses using Mapy.cz
- `GET /health` - Health check endpoint

---

## Frontend Integration

After getting the Railway URL, update frontend `.env`:

```
VITE_API_URL=https://your-railway-url.railway.app
```

Then rebuild and redeploy frontend.

---

## Troubleshooting

**Problem:** App crashes on Railway
- Check logs in Railway dashboard
- Verify environment variables are set
- Ensure `npm start` works locally

**Problem:** CORS errors
- Add your frontend URL to `CORS_ORIGIN` environment variable
- Restart the Railway deployment

**Problem:** Health check fails
- Visit `/health` endpoint directly
- Check Railway logs for startup errors
