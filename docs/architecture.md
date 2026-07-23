# Architecture

## Goals

- Keep services, pricing, media, posts and settings editable without code changes
- Support public marketing pages, bookings and a moderated community wall
- Provide a clean admin dashboard for non-technical staff

## Module Design

### Public Website

- Home: modular spotlight sections for services, training, recruitment, gallery and testimonials
- Services: list page plus dynamic detail page per service
- Training: course catalog and enrollment request path
- Studio Booking: package overview and booking request flow
- Official Photos: requirement-driven service records
- Recruitment: status and instruction-driven support records
- Gallery: album and media structure with filters and featured content
- Community Wall: admin-authored posts plus authenticated likes and comments
- Contact: editable contact details, Web3Forms integration and WhatsApp CTA

### Admin Dashboard

- Content: manage homepage sections and banners
- Services: manage descriptions, prices, FAQs and featured service flags
- Courses: manage category, duration, fees and trainer details
- Recruitment: update deadlines, fees, requirements and instructions
- Bookings: review queue and update status
- Gallery: upload, categorize and feature media
- Posts: create posts and moderate interactions
- FAQs / Testimonials / Settings / Users: reusable configuration areas

## Folder Strategy

- `app/(public)`: public routes
- `app/(dashboard)`: dashboard routes
- `app/api`: route handlers for bookings and contact forms
- `components/shared`: reusable presentational building blocks
- `components/forms`: booking and contact forms
- `components/admin`: dashboard-specific UI
- `lib/data`: starter content and seed-like mock records
- `lib/schemas`: validation rules with `zod`
- `lib/supabase`: Supabase helpers and role utilities

## Database Model

### Core Tables

- `profiles`
- `service_categories`
- `services`
- `service_faqs`
- `bookings`
- `courses`
- `studio_packages`
- `official_photo_services`
- `recruitment_services`
- `gallery_albums`
- `gallery_media`
- `posts`
- `post_likes`
- `comments`
- `testimonials`
- `faqs`
- `contact_settings`
- `site_settings`
- `content_blocks`
- `notifications`

## Roles

- `super_admin`: full platform control
- `admin`: manage operational content, posts, bookings and settings
- `moderator`: moderate posts, comments and selected media
- `visitor`: authenticated user who can book, like and comment

## Booking Flow

1. User selects a service and preferred appointment slot
2. Form validates in the client and again in the API route
3. Record is inserted into `bookings`
4. Admin reviews and changes `status`
5. Optional notification is sent through email or WhatsApp workflow

## Community Flow

1. Admin publishes a post
2. Logged-in visitors like or comment
3. RLS ensures users only manage their own interactions
4. Moderators and admins can hide or delete unsafe content

## Security Notes

- Protect dashboard routes with Supabase session checks
- Enforce role-based data rules through RLS
- Restrict storage buckets by bucket and path conventions
- Sanitize user-generated content before rendering rich text
- Validate every form on both client and server
