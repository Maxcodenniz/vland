insert into public.service_categories (name, slug, description, sort_order)
values
  ('Photography', 'photography', 'Event and portrait photography services', 1),
  ('Videography', 'videography', 'Event and branded video services', 2),
  ('Training', 'training', 'IT and classroom programs', 3),
  ('Support Services', 'support-services', 'Official photos and recruitment support', 4)
on conflict (slug) do nothing;

insert into public.services (
  category_id,
  title,
  slug,
  summary,
  description,
  price_label,
  quote_only,
  cta_label,
  is_featured,
  sort_order
)
select
  sc.id,
  seed.title,
  seed.slug,
  seed.summary,
  seed.description,
  seed.price_label,
  seed.quote_only,
  seed.cta_label,
  seed.is_featured,
  seed.sort_order
from (
  values
    ('Photography', 'Event Photography', 'event-photography', 'Professional event photography coverage.', 'Capture weddings, birthdays, funerals, church and corporate events.', 'Packages from GHS 850', false, 'Book photography coverage', true, 1),
    ('Videography', 'Event Videography', 'event-videography', 'Cinematic event videography coverage.', 'Coverage includes highlight reels, interviews and social clips.', 'Packages from GHS 1,400', false, 'Book videography', true, 2),
    ('Support Services', 'Drone Aerial Coverage', 'drone-aerial-coverage', 'Aerial photography and video services.', 'Quote-based drone services for events, sites and promotions.', 'Request quote', true, 'Request aerial coverage', true, 3),
    ('Training', 'IT Courses', 'it-courses', 'Hands-on digital skills training.', 'Beginner to professional training programs with flexible schedules.', 'Programs from GHS 450', false, 'Apply for IT training', true, 4),
    ('Support Services', 'Recruitment Registration Center', 'recruitment-registration-center', 'Application support for public recruitment and exams.', 'Book registration assistance and document support.', 'Fees vary by program', false, 'Book registration support', true, 5)
) as seed(category_name, title, slug, summary, description, price_label, quote_only, cta_label, is_featured, sort_order)
join public.service_categories sc on sc.name = seed.category_name
on conflict (slug) do nothing;

insert into public.courses (
  title,
  slug,
  category,
  duration_label,
  fee_label,
  schedule_label,
  trainer_name,
  description,
  sort_order
)
values
  ('Computer Basics & Internet Essentials', 'computer-basics', 'Beginner', '4 weeks', 'GHS 450', 'Weekday mornings and Saturdays', 'Training Coordinator', 'Typing, browsing, email, printing and file handling.', 1),
  ('Microsoft Office & Productivity Tools', 'microsoft-office-productivity', 'Intermediate', '6 weeks', 'GHS 700', 'Weekday evenings and weekends', 'Assigned coach', 'Word, Excel, PowerPoint and office workflow training.', 2),
  ('Professional Digital Skills Track', 'professional-digital-skills', 'Professional', '8 to 12 weeks', 'From GHS 1,200', 'Custom intake schedule', 'Lead instructor', 'Structured digital skill development for work readiness.', 3)
on conflict (slug) do nothing;

insert into public.recruitment_services (
  title,
  slug,
  status,
  deadline_label,
  fee_label,
  requirements,
  instructions,
  sort_order
)
values
  ('BECE Registration Support', 'bece-registration-support', 'Open', 'Admin configurable', 'From GHS 50', array['Candidate details', 'Passport photo', 'Supporting records'], 'Bring all required information for assisted registration.', 1),
  ('WASCE Registration Support', 'wasce-registration-support', 'Open', 'Admin configurable', 'From GHS 50', array['Candidate details', 'Official photo', 'Supporting records'], 'Admins can update windows, fees and instructions.', 2),
  ('Police / Army / Fire / Immigration', 'security-services-recruitment', 'Monitored', 'Varies by institution', 'Request latest fees', array['Application details', 'Scanned documents', 'Official photo'], 'Book a support session to review the latest requirements.', 3)
on conflict (slug) do nothing;

insert into public.gallery_albums (title, slug, category, description, cover_url, is_featured)
values
  ('Wedding & Event Moments', 'wedding-event-moments', 'Photography', 'Featured event imagery.', 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1200&q=80', true),
  ('Studio Portrait Sessions', 'studio-portrait-sessions', 'Studio', 'Portrait and branding studio albums.', 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1200&q=80', true),
  ('Aerial Coverage Highlights', 'aerial-coverage-highlights', 'Drone', 'Aerial visuals and site footage.', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', true)
on conflict (slug) do nothing;

insert into public.posts (title, slug, excerpt, body, category, tags)
values
  ('Weekend studio portrait slots now open', 'weekend-studio-portrait-slots', 'New portrait slots are available this weekend.', 'Weekend studio portrait slots are available for graduates, birthdays and branding sessions.', 'Studio Booking', array['studio', 'portrait']),
  ('July IT training intake announced', 'july-it-training-intake', 'Applications are now open for the next intake.', 'The July intake covers beginner computer classes, office tools and digital skills development.', 'Training', array['training', 'courses']),
  ('Recruitment support updates this week', 'recruitment-support-updates-this-week', 'Check the latest appointment guidance.', 'This week includes updated support windows for monitored recruitment programs and assisted applications.', 'Recruitment', array['recruitment', 'support'])
on conflict (slug) do nothing;

insert into public.testimonials (client_name, role_label, quote, is_featured)
values
  ('Esi Mensah', 'Bride', 'The photography team was professional, calm and very creative.', true),
  ('Kweku Nyarko', 'Training Student', 'The IT training was practical and easy to follow.', true),
  ('Akosua Arthur', 'Recruitment Applicant', 'They helped me complete my registration without stress.', true);

insert into public.faqs (question, answer, sort_order)
values
  ('Can administrators update content without developers?', 'Yes. Services, pricing, posts, contact details and galleries are all data-driven.', 1),
  ('Can visitors book different services from one place?', 'Yes. A unified booking form supports all major services.', 2),
  ('How is community content moderated?', 'Logged-in users can interact, while moderators and admins can hide or delete abusive content.', 3);

insert into public.contact_settings (
  business_name,
  phone,
  email,
  whatsapp_number,
  address,
  map_embed_url,
  opening_hours
)
values (
  'VIDEOLAND MULTIMEDIA',
  '0243133780',
  'videoland@gmail.com',
  '233243133780',
  'Saltpond, Central Region, Ghana',
  'https://www.google.com/maps/search/?api=1&query=Saltpond%2C+Central+Region%2C+Ghana',
  '["Mon - Fri: 8:00 AM - 6:00 PM", "Sat: 8:30 AM - 4:00 PM", "Sun: By appointment"]'::jsonb
)
on conflict do nothing;

insert into public.site_settings (
  site_name,
  domain,
  seo_title,
  seo_description,
  active_theme
)
values (
  'VIDEOLAND MULTIMEDIA',
  'vland.info',
  'VIDEOLAND MULTIMEDIA | Photography, Training and Service Center',
  'Photography, videography, drone coverage, studio booking, training and support services in Saltpond.',
  'default-dark'
)
on conflict do nothing;
