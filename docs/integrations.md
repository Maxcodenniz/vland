# Integrations

## Supabase Setup

1. Create a new Supabase project.
2. Add the following environment variables to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
WEB3FORMS_ACCESS_KEY=...
```

3. Run `supabase/schema.sql` in the SQL editor.
4. Run `supabase/seed.sql` to load starter records.
5. Create storage buckets:

- `gallery-media`
- `post-media`
- `documents`

## Auth and Role Flow

- Use Supabase Auth email or OTP login for staff and members
- Create a `profiles` row after signup
- Assign one of: `super_admin`, `admin`, `moderator`, `visitor`
- Use the `current_app_role()` function in SQL policies
- On protected dashboard routes, verify the session and role before render

## Web3Forms

The `app/api/contact/route.ts` file already validates the payload and forwards it to Web3Forms when `WEB3FORMS_ACCESS_KEY` is present.

### Steps

1. Create a form in Web3Forms
2. Copy the access key
3. Set `WEB3FORMS_ACCESS_KEY` in `.env.local`
4. Submit the contact form from `/contact`

### Recommended Fields

- `subject`
- `from_name`
- `email`
- `phone`
- `message`

## WhatsApp Integration

Use the global floating button plus CTA links built from:

```text
https://wa.me/<number>?text=<encoded message>
```

### Current Example

```text
https://wa.me/233243133780?text=Hello%20VIDEOLAND%20MULTIMEDIA%2C%20I%20need%20help%20with%20your%20services.
```

## Storage Recommendations

- Store gallery images in `gallery-media`
- Store community post attachments in `post-media`
- Store recruitment support documents in `documents`
- Save only file paths in Postgres tables

## Suggested Next Steps

1. Replace mock data in `lib/data/site-content.ts` with Supabase queries
2. Add authentication screens and protected server actions
3. Add a rich text editor for posts and page content
4. Add storage upload forms with preview handling
5. Add analytics, spam protection and email notifications
