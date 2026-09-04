# ivansays — curated people worth knowing

A deliberately small directory of developers, creators, and artists personally curated by Ivan.

## Product rules

- Public visitors can browse/search/filter published people.
- Anyone can submit work for review.
- Submission does **not** create a public profile.
- Only an admin can create, edit, publish, archive, or reorder directory entries.
- No profile photos are required or supported by the MVP.
- Listings are editorial, not pay-to-play.

## Supabase

This starter is wired to:

`https://aseauwtflvscetakpscc.supabase.co`

The client uses the Supabase publishable key via `.env.local`. A publishable key is appropriate in browser code; authorization is enforced by RLS, not by hiding that key.

### 1. Create the database

Open Supabase → SQL Editor and run:

`supabase/schema.sql`

### 2. Create Ivan's admin login

In Supabase → Authentication → Users, create the email/password account you want to use at `/admin`.

Copy that user's UUID and run:

```sql
insert into public.admins (user_id)
values ('YOUR-AUTH-USER-UUID');
```

Do not add public signup UI. The admin allow-list in `public.admins` is what authorizes curation writes.

### 3. Run locally

```bash
npm install
npm run dev
```

Routes:

- `/` — public directory
- `/apply` — application form
- `/admin` — private curation desk

## Deploy

For Vercel, add these environment variables to the project:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

Then deploy normally.

## Before public launch

The public application policy intentionally permits anonymous inserts. The form has a simple honeypot, but production abuse protection should eventually move submission through a Supabase Edge Function or another server-side endpoint with rate limiting / Turnstile. The directory itself is already protected by RLS.
