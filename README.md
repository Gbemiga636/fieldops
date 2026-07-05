# FieldOps

Real-time field agent location tracking platform built for MultiChoice operations teams.

## Features

### For Field Agents
- One-tap live location sharing via GPS
- Name saved locally — return and share instantly
- Continuous live tracking mode
- Automatic capture of timestamp, coordinates, accuracy, address, device & browser

### For Admins
- Secure login (username: `oluwaseyi`, password set on first visit)
- Password setup modal with "Remind Me Later" option
- Real-time dashboard with live Supabase updates
- Search by agent name or location
- Filter by date range and status
- List and map views
- Delete records
- Export to CSV
- Stats: total shares, today, unique agents, active now

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Copy `.env.local.example` to `.env.local`
3. Fill in your Supabase URL and keys
4. Run the SQL in `supabase/schema.sql` in the Supabase SQL Editor

### 3. Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
JWT_SECRET=your-random-secret-string
```

### 4. Run locally

```bash
npm run dev
```

- **Home:** http://localhost:3002
- **Agent share link:** http://localhost:3002/share
- **Admin login:** http://localhost:3002/admin/login

## Deploy on Netlify

[Next.js 16 is supported on Netlify](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) with zero extra configuration.

### 1. Connect the repo

1. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**
2. Choose **GitHub** and select [Gbemiga636/fieldops](https://github.com/Gbemiga636/fieldops)
3. Netlify auto-detects Next.js — build settings are already in `netlify.toml`

### 2. Add environment variables

In **Site configuration → Environment variables**, add:

| Variable | Value |
|----------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `JWT_SECRET` | A long random secret string |
| `ADMIN_MASTER_PASSWORD` | Backup admin password (e.g. `Gbemiga@1234`) |

### 3. Deploy

Click **Deploy site**. After the build finishes, your live URLs will be:

- **Agent share link:** `https://your-site.netlify.app/share`
- **Admin login:** `https://your-site.netlify.app/admin/login`

HTTPS is enabled automatically — required for mobile GPS on agents' phones.

### 4. Supabase (if not done yet)

Run `supabase/schema.sql` in your Supabase SQL Editor before going live.

## Admin Login

- Username: `oluwaseyi`
- On first login, you'll be prompted to set a password
- You can choose "Remind Me Later" to skip temporarily
- Once set, use that password for all future logins

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Supabase (PostgreSQL + Realtime)
- Framer Motion
- Leaflet Maps
- JWT session auth with bcrypt
