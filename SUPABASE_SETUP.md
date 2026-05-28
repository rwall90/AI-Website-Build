# Supabase Setup

Use this when you are ready to deploy the public version with centralized lead
storage.

## 1. Create the leads table

In Supabase, open SQL Editor and run:

```sql
create extension if not exists pgcrypto;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  company text not null,
  phone text not null,
  volume text not null,
  message text not null,
  source text not null default 'website',
  submitted_at timestamptz not null default now()
);

alter table public.leads enable row level security;
```

The app uses the Supabase service role key only inside the Vercel serverless API,
so the browser never receives database credentials.

## 2. Add Vercel environment variables

Add these in your Vercel project settings:

```text
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=choose-a-long-private-password
```

Keep `SUPABASE_SERVICE_ROLE_KEY` private. Do not put it in frontend JavaScript.

## 3. Deploy

```bash
vercel deploy --prod
```

After deploy, submit the landing page form, then open `/admin` and sign in with
`ADMIN_PASSWORD`.
