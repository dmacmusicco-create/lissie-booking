# Lissie Marion Show Productions — Booking System
## Complete Setup & Deployment Guide

---

## 📁 Project Structure

```
booking-system/
├── frontend/          ← Next.js app (the calendar UI)
│   ├── src/
│   │   ├── app/       ← Pages and layout
│   │   ├── components/← Calendar, modal, admin panel
│   │   └── lib/       ← API client
│   └── .env.local     ← Frontend env vars
│
├── backend/           ← Node.js/Express API
│   ├── src/
│   │   ├── routes/    ← calendar, booking, auth, admin
│   │   ├── services/  ← Google Calendar, email, scheduler
│   │   ├── middleware/← rate limiting, admin auth
│   │   └── data/
│   │       └── clients.json  ← Your 55+ client list
│   └── .env           ← Backend secrets
│
└── docs/
    └── SETUP.md       ← This file
```

---

## STEP 1 — Google Cloud Console Setup

### 1.1 Create a Project
1. Go to https://console.cloud.google.com
2. Click **New Project** → name it "Lissie Marion Booking"
3. Select it as your active project

### 1.2 Enable Required APIs
In the left menu → **APIs & Services** → **Library**:
- Search and enable: **Google Calendar API**
- Search and enable: **Gmail API**

### 1.3 Create OAuth2 Credentials
1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. If prompted, configure OAuth consent screen:
   - User type: External
   - App name: "Lissie Marion Booking System"
   - Add your email as a test user
4. Back at Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Booking System"
   - Authorized redirect URIs: Add both:
     - `http://localhost:4000/api/auth/google/callback` (for development)
     - `https://YOUR-BACKEND.vercel.app/api/auth/google/callback` (for production)
5. Click **Create** → copy your **Client ID** and **Client Secret**

### 1.4 Get Your Gmail App Password
1. Go to https://myaccount.google.com with dmac.music.co@gmail.com
2. Security → 2-Step Verification (enable if not already)
3. Security → **App Passwords**
4. Select app: Mail → Select device: Other → name it "Booking System"
5. Copy the 16-character password

---

## STEP 2 — Configure Environment Variables

### Backend `.env` (copy from `.env.example`)
```bash
cd backend
cp .env.example .env
```

Fill in:
```
GOOGLE_CLIENT_ID=your_client_id_from_step_1.3
GOOGLE_CLIENT_SECRET=your_client_secret_from_step_1.3
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/google/callback
GOOGLE_CALENDAR_EMAIL=dmac.music.co@gmail.com
GMAIL_USER=dmac.music.co@gmail.com
GMAIL_APP_PASSWORD=your_16_char_app_password
BOOKING_NOTIFICATION_EMAIL=Derrick.mackey@lissiemarionshowproductions.com
ADMIN_SECRET=choose_a_long_random_string_like_this_xK9mP2qR7v
FRONTEND_URL=http://localhost:3000
```

### Frontend `.env.local`
```bash
cd frontend
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_API_URL=http://localhost:4000
```

---

## STEP 3 — First-Time Google Calendar Authorization

This must be done once to get your refresh token.

### 3.1 Start the backend
```bash
cd backend
npm install
npm run dev
```

### 3.2 Get the auth URL
In your terminal or browser, visit:
```
GET http://localhost:4000/api/auth/google
Headers: x-admin-secret: YOUR_ADMIN_SECRET
```

Or use curl:
```bash
curl -H "x-admin-secret: YOUR_ADMIN_SECRET" http://localhost:4000/api/auth/google
```

### 3.3 Complete OAuth flow
1. Open the `authUrl` from the response in your browser
2. Sign in as **dmac.music.co@gmail.com**
3. Accept the permissions
4. You'll be redirected to a page showing your **GOOGLE_REFRESH_TOKEN**
5. Copy it and paste it into your `.env`:
   ```
   GOOGLE_REFRESH_TOKEN=1//0g...your_token_here
   ```
6. Restart the backend

✅ The calendar is now connected. This token is permanent — you only need to do this once.

---

## STEP 4 — Add Your 55+ Clients

Edit `backend/src/data/clients.json`:

```json
[
  {
    "id": "1",
    "name": "John Smith",
    "email": "john@example.com",
    "active": true,
    "addedAt": "2024-01-01"
  },
  {
    "id": "2",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "active": true,
    "addedAt": "2024-01-01"
  }
]
```

Add all 55+ clients here. You can also add/remove/toggle them from the admin panel in the live app (click the logo 5 times to open it).

---

## STEP 5 — Local Development

### Start everything:
```bash
# Terminal 1 - Backend
cd backend && npm install && npm run dev

# Terminal 2 - Frontend
cd frontend && npm install && npm run dev
```

Visit: http://localhost:3000

---

## STEP 6 — Deploy to Vercel

### 6.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/lissie-marion-booking
git push -u origin main
```

### 6.2 Deploy Backend to Vercel
1. Go to https://vercel.com → **New Project**
2. Import your repo
3. **Root Directory**: set to `backend`
4. Framework: **Other** (or Node.js)
5. **Environment Variables** — add all from your `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_REDIRECT_URI` → update to your Vercel URL
   - `GOOGLE_REFRESH_TOKEN`
   - `GMAIL_USER`
   - `GMAIL_APP_PASSWORD`
   - `BOOKING_NOTIFICATION_EMAIL`
   - `ADMIN_SECRET`
   - `FRONTEND_URL` → your frontend Vercel URL
6. Deploy → copy your backend URL (e.g. `https://lissie-backend.vercel.app`)

### 6.3 Update Google Console Redirect URI
Add your live backend URL to the redirect URIs:
```
https://lissie-backend.vercel.app/api/auth/google/callback
```

### 6.4 Deploy Frontend to Vercel
1. **New Project** → same repo
2. **Root Directory**: set to `frontend`
3. Framework: **Next.js**
4. **Environment Variables**:
   - `NEXT_PUBLIC_API_URL` = `https://lissie-backend.vercel.app`
5. Deploy

### 6.5 Re-run OAuth (one time, with prod URLs)
Repeat Step 3 using your live backend URL to get a fresh refresh token. Update the environment variable in Vercel dashboard.

---

## HOW TO: Manage Client List

### Via Admin Panel (easiest):
1. Open the booking calendar URL
2. Click the logo **5 times** rapidly
3. Enter your `ADMIN_SECRET`
4. Go to the "Clients" tab — add, remove, or toggle active status

### Via JSON file:
Edit `backend/src/data/clients.json` directly and redeploy.

**Important**: On Vercel, file writes (via admin panel) are ephemeral — use the JSON file approach for a permanent list, or upgrade to a database (see Scaling section).

---

## HOW TO: Adjust Newsletter Schedule

Edit `NEWSLETTER_CRON` in your backend `.env`:

| Schedule | Cron Expression |
|---|---|
| Every 2 weeks, Monday 9am | `0 9 */14 * *` |
| Every 2 weeks, Friday 10am | `0 10 */14 * *` |
| Every month, 1st at 9am | `0 9 1 * *` |
| Every week, Monday 9am | `0 9 * * 1` |

Cron syntax: `minute hour day-of-month month day-of-week`

---

## HOW TO: Block Dates Manually

**Via Admin Panel**:
1. Open admin panel (click logo 5 times)
2. "Block Date" tab → pick a date → click Block

**Via Google Calendar**:
Simply create any event on that day in dmac.music.co@gmail.com's calendar — it will automatically show as Booked.

---

## ADMIN PANEL ACCESS

The admin panel is hidden in the UI. To open it:
1. Go to your booking calendar
2. Click the **LM logo in the header 5 times**
3. Enter your `ADMIN_SECRET`

Admin features:
- ✅ View/add/remove/toggle clients
- ✅ Block dates on Google Calendar
- ✅ Send newsletter manually
- ✅ View client stats

---

## SCALING & IMPROVEMENTS

### For 100+ clients / high traffic:
- **Database**: Replace `clients.json` with PostgreSQL (Neon, Supabase) or MongoDB Atlas
- **Email queue**: Use SendGrid or Resend instead of Gmail SMTP (higher limits, better deliverability)
- **Redis cache**: Replace in-memory calendar cache with Redis for multi-server setups

### Recommended next upgrades:
1. **Resend.com** for email (free tier: 3,000/month, much better than Gmail SMTP limits)
2. **Neon.tech** for Postgres (free tier, serverless-friendly for Vercel)
3. **Upstash** for Redis caching

### Gmail SMTP limits:
- 500 emails/day for regular accounts
- 2,000/day for Google Workspace accounts
- For 55 clients every 2 weeks: well within limits ✅

---

## TROUBLESHOOTING

**Calendar shows wrong data**
→ Check `GOOGLE_REFRESH_TOKEN` is set correctly. Visit `/api/auth/google` again if needed.

**Emails not sending**
→ Verify Gmail App Password (must be 16 chars, no spaces). Make sure 2FA is enabled on the account.

**CORS errors on frontend**
→ Make sure `FRONTEND_URL` in backend .env matches your exact frontend URL (no trailing slash).

**Admin panel won't authenticate**
→ Make sure `ADMIN_SECRET` in frontend matches backend. Clear localStorage and try again.

---

## SUPPORT

For technical issues, check:
- Backend logs in Vercel dashboard → Functions → Logs
- Google Cloud Console → APIs & Services → Credentials (token expiry)
