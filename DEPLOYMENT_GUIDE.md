# 🚀 WA Marketing v2 — Temporary Demo Deployment Guide

## Architecture

```
Client Browser
     │
     ├──► Cloudflare Pages (frontend)   ← FREE, URL: xxx.pages.dev
     │         React + Socket.IO client
     │
     └──► Railway (backend)             ← FREE tier, URL: xxx.up.railway.app
               Node.js + Express + Socket.IO
               whatsapp-web.js (Puppeteer + Chrome)
               PostgreSQL database
               └── Cloudflare R2 (media storage)   ← optional for demo
```

---

## STEP 1 — Patch your local files

Apply these 4 changes to your project before pushing to GitHub.

### 1a. Replace `backend/lib/whatsapp.js`
→ Use the provided `whatsapp.js` (checks env var + Railway Nix paths for Chrome)

### 1b. Replace `frontend/src/context/WaContext.js`
→ Use the provided `WaContext.js` (replaces hardcoded localhost with env var)

### 1c. Replace `frontend/src/context/AuthContext.js`
→ Use the provided `AuthContext.js` (replaces hardcoded localhost with env var)

### 1d. Add `_redirects` to frontend public folder
Copy `_redirects` → `frontend/public/_redirects`
This makes React Router work on Cloudflare Pages.

### 1e. Add `nixpacks.toml` to your repo root
Copy `nixpacks.toml` to the **root of your repo** (same level as backend/ and frontend/).

---

## STEP 2 — Push to GitHub

```bash
git add .
git commit -m "deploy: env-based API URL, Railway Chrome support"
git push origin main
```

---

## STEP 3 — Deploy Backend on Railway

### 3a. Create Railway account
Go to https://railway.app → Sign up with GitHub (free)

### 3b. Create a new project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `WhatsApp-Web-Browser-Tool` repo
4. Railway will detect the `nixpacks.toml` at root

### 3c. Add PostgreSQL database
1. In your Railway project, click **"New Service"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway creates a Postgres instance and auto-sets `DATABASE_URL`

### 3d. Set environment variables
In your backend service → **Variables** tab, add:

```
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://YOUR-APP.pages.dev       ← fill after Cloudflare step
JWT_SECRET=generate_a_64_char_random_string_here
JWT_EXPIRES_IN=7d
DATABASE_URL=                                  ← auto-filled by Railway Postgres
PUPPETEER_SKIP_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/nix/var/nix/profiles/default/bin/chromium

# Cloudflare R2 (optional for demo — skip if not using media)
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET_NAME=wa-marketing-media
R2_ENDPOINT=https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://pub-xxxxx.r2.dev
```

To generate JWT_SECRET, run:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3e. Set the root directory
In Railway service settings → **Source** → set **Root Directory** to `backend`

### 3f. Deploy & get your URL
Railway will build and deploy. Once live, copy your Railway URL:
```
https://wa-marketing-backend-production.up.railway.app
```

---

## STEP 4 — Deploy Frontend on Cloudflare Pages

### 4a. Go to Cloudflare Pages
https://pages.cloudflare.com → Sign up free → **Create a project** → **Connect to Git**

### 4b. Connect your GitHub repo
Select your repo → branch: `main`

### 4c. Configure build settings
```
Framework preset:   Create React App
Root directory:     frontend
Build command:      npm run build
Build output dir:   build
```

### 4d. Add environment variable
Under **Environment Variables (advanced)**:
```
REACT_APP_API_URL = https://your-railway-url.up.railway.app
```
(the Railway URL from Step 3f — no trailing slash)

### 4e. Deploy!
Click **Save and Deploy**. In ~2 minutes you get:
```
https://wa-marketing.pages.dev    ← share this with your client!
```

---

## STEP 5 — Update Railway with Cloudflare URL

Go back to Railway → Backend service → Variables → update:
```
FRONTEND_URL = https://wa-marketing.pages.dev
```

Redeploy the backend service (Railway does this automatically on variable change).

---

## STEP 6 — Create your admin account

Once both are live, register your first admin user:

```bash
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin","email":"you@example.com","password":"YourPassword123"}'
```

Or just open `https://your-app.pages.dev` and use the Register form.

---

## STEP 7 — Connect WhatsApp

1. Open your Cloudflare Pages URL
2. Log in with your account
3. The Dashboard will show a **QR code**
4. Scan it with WhatsApp on your phone
5. ✅ WhatsApp is connected — campaigns can now be sent!

---

## Troubleshooting

### Chrome not found on Railway
If you see "Could not find Chrome", SSH into Railway and run:
```bash
which chromium
```
Then set `PUPPETEER_EXECUTABLE_PATH` to that path in Railway Variables.

### CORS errors in browser
Make sure `FRONTEND_URL` in Railway exactly matches your Cloudflare Pages URL
(no trailing slash, correct https://).

### Database errors
Railway auto-runs `npx prisma db push` on start (from nixpacks.toml).
If tables are missing, in Railway shell run:
```bash
npx prisma db push
```

### Socket.IO not connecting
Socket.IO needs WebSocket support. Railway supports this by default.
Make sure your Cloudflare Pages URL in `FRONTEND_URL` is correct.

---

## Free Tier Limits

| Service | Limit | Notes |
|---|---|---|
| Railway | $5 free credits/month | Enough for ~2-3 weeks demo |
| Cloudflare Pages | Unlimited requests | Fully free |
| Railway PostgreSQL | 1GB storage | More than enough for demo |

---

## Quick Reference — Your URLs

| What | URL |
|---|---|
| Client demo URL | `https://your-app.pages.dev` |
| Backend API | `https://your-app.up.railway.app` |
| Health check | `https://your-app.up.railway.app/health` |
| WA Status | `https://your-app.up.railway.app/api/wa/status` |
