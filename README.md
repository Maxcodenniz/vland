# VIDEOLAND MULTIMEDIA

Modern modular website and web app scaffold for `VIDEOLAND MULTIMEDIA` in Saltpond, Ghana.

## Stack

- `Next.js` App Router
- `Supabase` for auth, Postgres, storage and RLS
- `Web3Forms` for contact form delivery
- Reusable component-driven frontend architecture

## Features

- Mobile-friendly public website
- Modular services and dynamic service detail pages
- Unified booking form and API route scaffold
- Community wall page with admin moderation architecture
- Admin dashboard structure for non-technical staff
- Supabase schema, seed data and policy examples
- WhatsApp contact integration

## Project Structure

```text
app/
  (public)/
    about/
    bookings/
    community/
    contact/
    gallery/
    official-photos/
    recruitment/
    services/
      [slug]/
    studio-booking/
    training/
  (dashboard)/
    admin/
      bookings/
      content/
      courses/
      faqs/
      gallery/
      posts/
      recruitment/
      services/
      settings/
      testimonials/
      users/
  api/
    bookings/
    contact/
components/
  admin/
  community/
  forms/
  layout/
  shared/
lib/
  config/
  data/
  schemas/
  supabase/
  utils/
supabase/
  schema.sql
  seed.sql
docs/
  architecture.md
  integrations.md
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Add your Supabase and Web3Forms keys.

4. Start the app:

```bash
npm run dev
```

5. Apply Supabase schema and seed files in your Supabase SQL editor:

- `supabase/schema.sql`
- `supabase/seed.sql`

## Content Model

- Services, FAQs and pricing are database-driven
- Homepage sections are driven by `content_blocks`
- Gallery uses albums and media records
- Community wall uses `posts`, `post_likes` and `comments`
- Contact and site identity are driven by settings tables

## Admin Experience

Non-technical staff can manage:

- Homepage sections and banners
- Services and pricing
- IT courses
- Recruitment records
- Bookings and statuses
- Gallery media and albums
- Community posts and comments
- FAQs and testimonials
- Contact details and WhatsApp number
- Roles and permissions

## Documentation

- `docs/architecture.md`
- `docs/integrations.md`
