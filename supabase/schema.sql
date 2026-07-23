drop trigger if exists on_auth_user_created on auth.users;

drop table if exists public.content_blocks cascade;
drop table if exists public.notifications cascade;
drop table if exists public.site_settings cascade;
drop table if exists public.contact_settings cascade;
drop table if exists public.faqs cascade;
drop table if exists public.testimonials cascade;
drop table if exists public.comments cascade;
drop table if exists public.post_likes cascade;
drop table if exists public.posts cascade;
drop table if exists public.gallery_media cascade;
drop table if exists public.gallery_albums cascade;
drop table if exists public.recruitment_services cascade;
drop table if exists public.official_photo_services cascade;
drop table if exists public.studio_packages cascade;
drop table if exists public.courses cascade;
drop table if exists public.bookings cascade;
drop table if exists public.service_faqs cascade;
drop table if exists public.services cascade;
drop table if exists public.service_categories cascade;
drop table if exists public.profiles cascade;

drop function if exists public.can_moderate() cascade;
drop function if exists public.can_manage_content() cascade;
drop function if exists public.current_app_role() cascade;
drop function if exists public.toggle_public_post_reaction(uuid, text, public.post_reaction_type) cascade;
drop function if exists public.create_public_comment(uuid, text, text, text) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.set_updated_at() cascade;

drop type if exists public.post_reaction_type cascade;
drop type if exists public.comment_status cascade;
drop type if exists public.post_status cascade;
drop type if exists public.media_type cascade;
drop type if exists public.booking_status cascade;
drop type if exists public.app_role cascade;

create extension if not exists "pgcrypto";

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'app_role'
  ) then
    create type public.app_role as enum ('super_admin', 'admin', 'moderator', 'visitor');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'booking_status'
  ) then
    create type public.booking_status as enum ('pending', 'confirmed', 'completed', 'canceled');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'media_type'
  ) then
    create type public.media_type as enum ('image', 'video', 'document');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'post_status'
  ) then
    create type public.post_status as enum ('published', 'hidden', 'archived');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'comment_status'
  ) then
    create type public.comment_status as enum ('visible', 'hidden', 'flagged');
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_type where typnamespace = 'public'::regnamespace and typname = 'post_reaction_type'
  ) then
    create type public.post_reaction_type as enum ('like', 'love', 'haha', 'wow', 'sad', 'angry');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  phone text,
  role public.app_role not null default 'visitor',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'visitor'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.current_app_role()
returns public.app_role
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(
    (
      select role
      from public.profiles
      where id = auth.uid()
    ),
    'visitor'::public.app_role
  );
$$;

create or replace function public.can_manage_content()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('super_admin', 'admin');
$$;

create or replace function public.can_moderate()
returns boolean
language sql
stable
as $$
  select public.current_app_role() in ('super_admin', 'admin', 'moderator');
$$;

create or replace function public.toggle_public_post_reaction(
  target_post_id uuid,
  visitor_session_key text,
  selected_reaction public.post_reaction_type
)
returns public.post_reaction_type
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_reaction public.post_reaction_type;
begin
  if visitor_session_key is null or length(trim(visitor_session_key)) < 8 then
    raise exception 'A valid visitor session is required.';
  end if;

  select reaction_type
  into existing_reaction
  from public.post_likes
  where post_id = target_post_id
    and session_key = visitor_session_key
  limit 1;

  if existing_reaction = selected_reaction then
    delete from public.post_likes
    where post_id = target_post_id
      and session_key = visitor_session_key;

    return null;
  end if;

  insert into public.post_likes (post_id, session_key, reaction_type)
  values (target_post_id, visitor_session_key, selected_reaction)
  on conflict (post_id, session_key)
  where session_key is not null
  do update set
    reaction_type = excluded.reaction_type,
    created_at = timezone('utc', now());

  return selected_reaction;
end;
$$;

create or replace function public.create_public_comment(
  target_post_id uuid,
  visitor_session_key text,
  visitor_name text,
  comment_body text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted_comment_id uuid;
  normalized_name text;
begin
  if visitor_session_key is null or length(trim(visitor_session_key)) < 8 then
    raise exception 'A valid visitor session is required.';
  end if;

  if comment_body is null or length(trim(comment_body)) < 2 then
    raise exception 'Comment must be at least 2 characters.';
  end if;

  normalized_name := nullif(left(trim(coalesce(visitor_name, 'Guest')), 60), '');

  insert into public.comments (post_id, guest_name, session_key, body, status)
  values (
    target_post_id,
    coalesce(normalized_name, 'Guest'),
    visitor_session_key,
    left(trim(comment_body), 1000),
    'visible'
  )
  returning id into inserted_comment_id;

  return inserted_comment_id;
end;
$$;

create table if not exists public.service_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.service_categories(id) on delete set null,
  title text not null,
  slug text not null unique,
  summary text not null,
  description text not null,
  media_path text,
  media_type public.media_type not null default 'image',
  price_label text,
  quote_only boolean not null default false,
  cta_label text not null default 'Book now',
  is_featured boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.service_faqs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.services(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_reference text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
  user_id uuid references auth.users(id) on delete set null,
  service_id uuid references public.services(id) on delete set null,
  full_name text not null,
  email text not null,
  phone text not null,
  preferred_date date not null,
  preferred_time time not null,
  notes text,
  status public.booking_status not null default 'pending',
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  duration_label text not null,
  fee_label text not null,
  schedule_label text not null,
  trainer_name text,
  description text not null,
  media_path text,
  media_type public.media_type not null default 'image',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.studio_packages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  duration_minutes integer not null,
  price_label text not null,
  availability_notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.official_photo_services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  requirements text,
  price_label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.recruitment_services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  status text not null,
  deadline_label text,
  fee_label text,
  requirements text[] not null default '{}',
  instructions text,
  media_path text,
  media_type public.media_type not null default 'image',
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category text not null,
  description text,
  cover_url text,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.gallery_media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid references public.gallery_albums(id) on delete cascade,
  title text not null,
  media_type public.media_type not null default 'image',
  file_path text not null,
  thumbnail_path text,
  alt_text text,
  sort_order integer not null default 0,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references public.profiles(id) on delete set null,
  title text not null,
  slug text not null unique,
  excerpt text,
  body text not null,
  category text,
  tags text[] not null default '{}',
  cover_media_path text,
  media_gallery text[] not null default '{}',
  status public.post_status not null default 'published',
  published_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.posts
add column if not exists media_gallery text[] not null default '{}';

update public.posts
set media_gallery = case
  when cover_media_path is null or btrim(cover_media_path) = '' then '{}'
  else array[cover_media_path]
end
where coalesce(array_length(media_gallery, 1), 0) = 0;

create table if not exists public.post_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  session_key text,
  reaction_type public.post_reaction_type not null default 'like',
  created_at timestamptz not null default timezone('utc', now()),
  unique (post_id, user_id)
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  guest_name text,
  session_key text,
  parent_id uuid references public.comments(id) on delete cascade,
  body text not null,
  status public.comment_status not null default 'visible',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.post_likes alter column user_id drop not null;
alter table public.post_likes add column if not exists session_key text;
alter table public.post_likes add column if not exists reaction_type public.post_reaction_type not null default 'like';
create unique index if not exists post_likes_post_session_key_idx
on public.post_likes (post_id, session_key)
where session_key is not null;

alter table public.comments alter column user_id drop not null;
alter table public.comments add column if not exists guest_name text;
alter table public.comments add column if not exists session_key text;

create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  role_label text,
  quote text not null,
  media_path text,
  media_type public.media_type not null default 'image',
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  service_id uuid references public.services(id) on delete cascade,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.contact_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  phone text not null,
  email text not null,
  whatsapp_number text not null,
  address text not null,
  map_embed_url text,
  opening_hours jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null,
  domain text not null,
  seo_title text,
  seo_description text,
  hero_video_url text,
  active_theme text not null default 'default-dark',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.content_blocks (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique,
  title text not null,
  subtitle text,
  body text,
  cta_label text,
  cta_href text,
  is_visible boolean not null default true,
  sort_order integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.services
  add column if not exists media_path text,
  add column if not exists media_type public.media_type not null default 'image';

alter table public.courses
  add column if not exists media_path text,
  add column if not exists media_type public.media_type not null default 'image';

alter table public.recruitment_services
  add column if not exists media_path text,
  add column if not exists media_type public.media_type not null default 'image';

alter table public.testimonials
  add column if not exists media_path text,
  add column if not exists media_type public.media_type not null default 'image';

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists set_services_updated_at on public.services;
create trigger set_services_updated_at
before update on public.services
for each row execute function public.set_updated_at();

drop trigger if exists set_bookings_updated_at on public.bookings;
create trigger set_bookings_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

drop trigger if exists set_comments_updated_at on public.comments;
create trigger set_comments_updated_at
before update on public.comments
for each row execute function public.set_updated_at();

drop trigger if exists set_contact_settings_updated_at on public.contact_settings;
create trigger set_contact_settings_updated_at
before update on public.contact_settings
for each row execute function public.set_updated_at();

drop trigger if exists set_site_settings_updated_at on public.site_settings;
create trigger set_site_settings_updated_at
before update on public.site_settings
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.services enable row level security;
alter table public.service_categories enable row level security;
alter table public.service_faqs enable row level security;
alter table public.bookings enable row level security;
alter table public.courses enable row level security;
alter table public.studio_packages enable row level security;
alter table public.official_photo_services enable row level security;
alter table public.recruitment_services enable row level security;
alter table public.gallery_albums enable row level security;
alter table public.gallery_media enable row level security;
alter table public.posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.contact_settings enable row level security;
alter table public.site_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.content_blocks enable row level security;

create policy "public read active services" on public.services
for select using (is_active = true);

create policy "public read categories" on public.service_categories
for select using (is_active = true);

create policy "public read service faqs" on public.service_faqs
for select using (true);

create policy "public read active courses" on public.courses
for select using (is_active = true);

create policy "public read active studio packages" on public.studio_packages
for select using (is_active = true);

create policy "public read active official photo services" on public.official_photo_services
for select using (is_active = true);

create policy "public read active recruitment services" on public.recruitment_services
for select using (is_active = true);

create policy "public read active albums" on public.gallery_albums
for select using (is_active = true);

create policy "public read gallery media" on public.gallery_media
for select using (true);

create policy "public read published posts" on public.posts
for select using (status = 'published');

create policy "moderators read all posts" on public.posts
for select using (public.can_moderate());

create policy "public read visible comments" on public.comments
for select using (status = 'visible');

create policy "moderators read all comments" on public.comments
for select using (public.can_moderate());

create policy "public read testimonials" on public.testimonials
for select using (true);

create policy "public read faqs" on public.faqs
for select using (true);

create policy "public read contact settings" on public.contact_settings
for select using (true);

create policy "public read site settings" on public.site_settings
for select using (true);

create policy "public read visible content blocks" on public.content_blocks
for select using (is_visible = true);

create policy "admin manage content blocks" on public.content_blocks
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage services" on public.services
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage service categories" on public.service_categories
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage service faqs" on public.service_faqs
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage courses" on public.courses
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage studio packages" on public.studio_packages
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage official photo services" on public.official_photo_services
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage recruitment services" on public.recruitment_services
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage galleries" on public.gallery_albums
for all using (public.can_moderate()) with check (public.can_moderate());

create policy "admin manage gallery media" on public.gallery_media
for all using (public.can_moderate()) with check (public.can_moderate());

create policy "admin manage testimonials" on public.testimonials
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage faqs" on public.faqs
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage settings" on public.contact_settings
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admin manage site settings" on public.site_settings
for all using (public.can_manage_content()) with check (public.can_manage_content());

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles
for select using (auth.uid() = id);

create policy "super admins read profiles" on public.profiles
for select using (public.current_app_role() = 'super_admin');

drop policy if exists "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
for update using (auth.uid() = id or public.current_app_role() = 'super_admin')
with check (auth.uid() = id or public.current_app_role() = 'super_admin');

drop policy if exists "admins manage profiles" on public.profiles;
create policy "admins manage profiles" on public.profiles
for insert with check (public.current_app_role() = 'super_admin');

create policy "users manage own bookings" on public.bookings
for select using (auth.uid() = user_id or public.can_manage_content());

create policy "users create bookings" on public.bookings
for insert with check (auth.uid() = user_id or user_id is null);

create policy "admins manage bookings" on public.bookings
for update using (public.can_manage_content()) with check (public.can_manage_content());

create policy "admins publish posts" on public.posts
for all using (public.can_manage_content()) with check (public.can_manage_content());

create policy "moderators review posts" on public.posts
for update using (public.can_moderate()) with check (public.can_moderate());

drop policy if exists "users like posts" on public.post_likes;
drop policy if exists "users insert likes" on public.post_likes;
drop policy if exists "users delete own likes" on public.post_likes;
drop policy if exists "public read post reactions" on public.post_likes;
drop policy if exists "moderators manage post reactions" on public.post_likes;
create policy "public read post reactions" on public.post_likes
for select using (true);
create policy "moderators manage post reactions" on public.post_likes
for all using (public.can_moderate()) with check (public.can_moderate());

drop policy if exists "users create comments" on public.comments;
drop policy if exists "users manage own comments" on public.comments;
drop policy if exists "moderators delete comments" on public.comments;
drop policy if exists "moderators manage comments" on public.comments;
create policy "moderators manage comments" on public.comments
for all using (public.can_moderate()) with check (public.can_moderate());

create policy "users read own notifications" on public.notifications
for select using (auth.uid() = user_id);

create policy "admins manage notifications" on public.notifications
for all using (public.can_manage_content()) with check (public.can_manage_content());

insert into storage.buckets (id, name, public)
values
  ('gallery-media', 'gallery-media', true),
  ('post-media', 'post-media', true),
  ('content-media', 'content-media', true),
  ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "public read gallery media storage" on storage.objects;
create policy "public read gallery media storage" on storage.objects
for select using (bucket_id = 'gallery-media');

drop policy if exists "admins upload gallery media storage" on storage.objects;
create policy "admins upload gallery media storage" on storage.objects
for insert with check (
  bucket_id = 'gallery-media'
  and (public.can_moderate() or public.can_manage_content())
);

drop policy if exists "admins update gallery media storage" on storage.objects;
create policy "admins update gallery media storage" on storage.objects
for update using (
  bucket_id = 'gallery-media'
  and (public.can_moderate() or public.can_manage_content())
) with check (
  bucket_id = 'gallery-media'
  and (public.can_moderate() or public.can_manage_content())
);

drop policy if exists "admins delete gallery media storage" on storage.objects;
create policy "admins delete gallery media storage" on storage.objects
for delete using (
  bucket_id = 'gallery-media'
  and (public.can_moderate() or public.can_manage_content())
);

drop policy if exists "public read post media storage" on storage.objects;
create policy "public read post media storage" on storage.objects
for select using (bucket_id = 'post-media');

drop policy if exists "admins upload post media storage" on storage.objects;
create policy "admins upload post media storage" on storage.objects
for insert with check (
  bucket_id = 'post-media'
  and public.can_manage_content()
);

drop policy if exists "admins update post media storage" on storage.objects;
create policy "admins update post media storage" on storage.objects
for update using (
  bucket_id = 'post-media'
  and public.can_manage_content()
) with check (
  bucket_id = 'post-media'
  and public.can_manage_content()
);

drop policy if exists "admins delete post media storage" on storage.objects;
create policy "admins delete post media storage" on storage.objects
for delete using (
  bucket_id = 'post-media'
  and public.can_manage_content()
);

drop policy if exists "public read content media storage" on storage.objects;
create policy "public read content media storage" on storage.objects
for select using (bucket_id = 'content-media');

drop policy if exists "admins upload content media storage" on storage.objects;
create policy "admins upload content media storage" on storage.objects
for insert with check (
  bucket_id = 'content-media'
  and public.can_manage_content()
);

drop policy if exists "admins update content media storage" on storage.objects;
create policy "admins update content media storage" on storage.objects
for update using (
  bucket_id = 'content-media'
  and public.can_manage_content()
) with check (
  bucket_id = 'content-media'
  and public.can_manage_content()
);

drop policy if exists "admins delete content media storage" on storage.objects;
create policy "admins delete content media storage" on storage.objects
for delete using (
  bucket_id = 'content-media'
  and public.can_manage_content()
);
insert into public.profiles (id, full_name, phone, role)
select
  id,
  coalesce(raw_user_meta_data->>'full_name', email, 'Admin User'),
  coalesce(raw_user_meta_data->>'phone', ''),
  'super_admin'::public.app_role
from auth.users
where email = 'maxcodennis@gmail.com'
on conflict (id)
do update set role = 'super_admin'::public.app_role;