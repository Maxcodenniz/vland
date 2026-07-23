import 'server-only';

import { cookies } from 'next/headers';

import type { ServiceItem } from '@/lib/data/site-content';
import {
  courses as fallbackCourses,
  galleryHighlights,
  homepageSections,
  recruitmentPrograms as fallbackRecruitmentPrograms,
  services as fallbackServices
} from '@/lib/data/site-content';
import {
  COMMUNITY_REACTIONS,
  COMMUNITY_SESSION_COOKIE,
  getReactionMeta,
  type CommunityReactionType
} from '@/lib/community';
import {
  inferMediaTypeFromPath,
  normalizeMediaGalleryPaths,
  type ContentMediaType
} from '@/lib/media';
import { siteConfig } from '@/lib/config/site';
import type { AppRole } from '@/lib/supabase/auth';
import {
  createPublicServerSupabaseClient,
  createServerSupabaseClient
} from '@/lib/supabase/server';

type ServiceRow = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  description: string;
  media_path: string | null;
  media_type: string | null;
  price_label: string | null;
  quote_only: boolean;
  cta_label: string;
  category_id: string | null;
};

type ServiceFaqRow = {
  service_id: string;
  question: string;
  answer: string;
  sort_order: number;
};

type CategoryRow = {
  id: string;
  name: string;
};

type ContentBlockRow = {
  id?: string;
  section_key: string;
  title?: string;
  subtitle?: string | null;
  body?: string | null;
  cta_label?: string | null;
  cta_href?: string | null;
  is_visible: boolean;
  sort_order: number;
  payload?: Record<string, unknown> | null;
};

type PostRow = {
  id: string;
  slug?: string;
  title: string;
  excerpt?: string | null;
  body?: string | null;
  category: string | null;
  status: string;
  cover_media_path?: string | null;
  media_gallery?: string[] | null;
  created_at?: string;
};

type LikeRow = {
  post_id: string;
  reaction_type?: string | null;
  session_key?: string | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  user_id?: string;
  guest_name?: string | null;
  session_key?: string | null;
  body: string;
  status: string;
  created_at?: string;
};

type GalleryAlbumRow = {
  id: string;
  slug?: string;
  title: string;
  category: string;
  description?: string | null;
  cover_url?: string | null;
  is_featured: boolean;
  is_active?: boolean;
};

type GalleryMediaRow = {
  id?: string;
  album_id: string | null;
  title?: string;
  media_type: string;
  file_path?: string;
  thumbnail_path?: string | null;
  alt_text?: string | null;
  sort_order?: number;
  is_featured?: boolean;
};

type CourseRow = {
  id: string;
  title: string;
  slug: string;
  category: string;
  duration_label: string;
  fee_label: string;
  schedule_label: string;
  trainer_name: string | null;
  description: string;
  media_path: string | null;
  media_type: string | null;
  is_active: boolean;
  sort_order: number;
};

type RecruitmentRow = {
  id: string;
  title: string;
  slug: string;
  status: string;
  deadline_label: string | null;
  fee_label: string | null;
  requirements: string[];
  instructions: string | null;
  media_path: string | null;
  media_type: string | null;
  is_active: boolean;
  sort_order: number;
};

type TestimonialRow = {
  id: string;
  client_name: string;
  role_label: string | null;
  quote: string;
  media_path: string | null;
  media_type: string | null;
  is_featured: boolean;
};

type ProfileRow = {
  id: string;
  full_name: string | null;
  phone: string | null;
  role: AppRole;
};

type ContactSettingsRow = {
  id?: string;
  business_name: string;
  phone: string;
  email: string;
  whatsapp_number: string;
  address: string;
  map_embed_url?: string | null;
};

type SiteSettingsRow = {
  id?: string;
  site_name?: string;
  domain: string;
  seo_title: string | null;
  seo_description?: string | null;
  hero_video_url?: string | null;
  active_theme: string;
};

export type AdminBookingRecord = {
  id: string;
  bookingReference: string;
  serviceTitle: string;
  status: 'pending' | 'confirmed' | 'completed' | 'canceled';
  preferredDate: string;
  fullName: string;
  notes: string;
};

export type AdminModerationItem = {
  id: string;
  targetType: 'comment' | 'post';
  title: string;
  type: 'Comment' | 'Post';
  status: string;
  owner: string;
  summary: string;
};

export type AdminSettingsRecord = {
  businessName: string;
  siteName: string;
  domain: string;
  phone: string;
  email: string;
  whatsappNumber: string;
  address: string;
  mapEmbedUrl: string;
  seoTitle: string;
  seoDescription: string;
  heroVideoUrl: string;
  activeTheme: string;
};

export type AdminServiceRecord = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'text';
  priceLabel: string;
  ctaLabel: string;
  categoryId: string | null;
  categoryName: string;
  quoteOnly: boolean;
  isActive: boolean;
  isFeatured: boolean;
  sortOrder: number;
};

export type AdminCourseRecord = {
  id: string;
  title: string;
  slug: string;
  category: string;
  durationLabel: string;
  feeLabel: string;
  scheduleLabel: string;
  trainerName: string;
  description: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'text';
  isActive: boolean;
  sortOrder: number;
};

export type PublicCourseRecord = {
  title: string;
  slug: string;
  category: string;
  durationLabel: string;
  feeLabel: string;
  scheduleLabel: string;
  trainerName: string;
  description: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'text';
};

export type AdminRecruitmentRecord = {
  id: string;
  title: string;
  slug: string;
  status: string;
  deadlineLabel: string;
  feeLabel: string;
  requirements: string[];
  instructions: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'text';
  isActive: boolean;
  sortOrder: number;
};

export type AdminGalleryAlbumRecord = {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  coverUrl: string;
  mediaType: string;
  isFeatured: boolean;
  isActive: boolean;
};

export type AdminGalleryMediaRecord = {
  id: string;
  albumId: string | null;
  title: string;
  mediaType: 'image' | 'video';
  fileUrl: string;
  thumbnailUrl: string;
  altText: string;
  sortOrder: number;
  isFeatured: boolean;
};

export type PublicGalleryMediaRecord = {
  id: string;
  albumTitle: string;
  category: string;
  mediaType: 'image' | 'video';
  fileUrl: string;
  thumbnailUrl: string;
  altText: string;
};

export type AdminContentBlockRecord = {
  id: string;
  sectionKey: string;
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  eyebrow: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  heroHighlightsText: string;
  visualBadge: string;
  visualTitle: string;
  visualDescription: string;
  topChipLabel: string;
  middleChipLabel: string;
  bottomChipLabel: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'text';
  isVisible: boolean;
  sortOrder: number;
};

export type AdminFaqRecord = {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export type AdminTestimonialRecord = {
  id: string;
  clientName: string;
  roleLabel: string;
  quote: string;
  mediaPath: string;
  mediaType: 'image' | 'video' | 'text';
  isFeatured: boolean;
};

export type AdminPostRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  category: string;
  tags: string[];
  coverMediaPath: string;
  mediaGalleryPaths: string[];
  coverMediaType: 'image' | 'video' | 'text';
  status: 'published' | 'hidden' | 'archived';
  likes: number;
  comments: number;
};

export type PublicCommunityComment = {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
};

export type PublicCommunityPostRecord = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  body: string;
  author: string;
  createdAt: string;
  reactionCount: number;
  commentCount: number;
  mediaType: 'image' | 'video' | 'text';
  coverMediaPath: string;
  mediaGalleryPaths: string[];
  viewerReaction: CommunityReactionType | null;
  topReactions: Array<{
    type: CommunityReactionType;
    emoji: string;
    count: number;
  }>;
  recentComments: PublicCommunityComment[];
};

export type AdminUserProfileRecord = {
  id: string;
  fullName: string;
  phone: string;
  role: AppRole;
};

export async function getPublicServices() {
  const supabase = createPublicServerSupabaseClient();

  if (!supabase) {
    return fallbackServices.map((service) => ({
      ...service,
      mediaPath: service.mediaPath ?? '',
      mediaType: service.mediaType ?? 'text'
    }));
  }

  const { data: serviceRows, error } = await supabase
    .from('services')
    .select(
      'id, slug, title, summary, description, media_path, media_type, price_label, quote_only, cta_label, category_id'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !serviceRows?.length) {
    return fallbackServices.map((service) => ({
      ...service,
      mediaPath: service.mediaPath ?? '',
      mediaType: service.mediaType ?? 'text'
    }));
  }

  const typedRows = serviceRows as ServiceRow[];
  const serviceIds = typedRows.map((service) => service.id);

  const { data: faqRows } = await supabase
    .from('service_faqs')
    .select('service_id, question, answer, sort_order')
    .in('service_id', serviceIds)
    .order('sort_order', { ascending: true });

  const faqsByService = new Map<string, ServiceFaqRow[]>();

  for (const faq of (faqRows as ServiceFaqRow[] | null) ?? []) {
    const current = faqsByService.get(faq.service_id) ?? [];
    current.push(faq);
    faqsByService.set(faq.service_id, current);
  }

  return typedRows.map((serviceRow) => {
    const fallback =
      fallbackServices.find((item) => item.slug === serviceRow.slug) ??
      createFallbackService(serviceRow.slug, serviceRow.title);

    return {
      ...fallback,
      slug: serviceRow.slug,
      title: serviceRow.title,
      summary: serviceRow.summary,
      description: serviceRow.description,
      ...getStoredMedia(serviceRow.media_path, serviceRow.media_type),
      priceLabel: serviceRow.price_label ?? fallback.priceLabel,
      quoteOnly: serviceRow.quote_only,
      cta: serviceRow.cta_label || fallback.cta,
      faqs:
        faqsByService.get(serviceRow.id)?.map((faq) => ({
          question: faq.question,
          answer: faq.answer
        })) ?? fallback.faqs
    };
  });
}

export async function getPublicServiceBySlug(slug: string) {
  const services = await getPublicServices();
  return services.find((service) => service.slug === slug) ?? null;
}

export async function getServiceOptions() {
  const services = await getPublicServices();
  return services.map((service) => ({
    slug: service.slug,
    title: service.title
  }));
}

export async function getPublicTestimonials() {
  const supabase = createPublicServerSupabaseClient();

  if (!supabase) {
    return getFallbackPublicTestimonials();
  }

  const { data, error } = await supabase
    .from('testimonials')
    .select('client_name, role_label, quote, media_path, media_type, is_featured')
    .order('created_at', { ascending: false });

  if (error || !data?.length) {
    return getFallbackPublicTestimonials();
  }

  return (data as TestimonialRow[]).map((item) => ({
    name: item.client_name,
    role: item.role_label ?? 'Client',
    quote: item.quote,
    ...getStoredMedia(item.media_path, item.media_type)
  }));
}

export async function getPublicCourses(): Promise<PublicCourseRecord[]> {
  const supabase = createPublicServerSupabaseClient();

  if (!supabase) {
    return fallbackCourses.map((course) => ({
      title: course.title,
      slug: toSlug(course.title),
      category: course.category,
      durationLabel: course.duration,
      feeLabel: course.fee,
      scheduleLabel: course.schedule,
      trainerName: course.trainer,
      description: course.description,
      mediaPath: '',
      mediaType: 'text' as const
    }));
  }

  const { data, error } = await supabase
    .from('courses')
    .select(
      'title, slug, category, duration_label, fee_label, schedule_label, trainer_name, description, media_path, media_type'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return fallbackCourses.map((course) => ({
      title: course.title,
      slug: toSlug(course.title),
      category: course.category,
      durationLabel: course.duration,
      feeLabel: course.fee,
      scheduleLabel: course.schedule,
      trainerName: course.trainer,
      description: course.description,
      mediaPath: '',
      mediaType: 'text' as const
    }));
  }

  return (data as CourseRow[]).map((course) => ({
    title: course.title,
    slug: course.slug,
    category: course.category,
    durationLabel: course.duration_label,
    feeLabel: course.fee_label,
    scheduleLabel: course.schedule_label,
    trainerName: course.trainer_name ?? '',
    description: course.description,
    ...getStoredMedia(course.media_path, course.media_type)
  }));
}

export async function getPublicCourseBySlug(slug: string) {
  const courses = await getPublicCourses();
  return courses.find((course) => course.slug === slug) ?? null;
}

export async function getPublicRecruitmentPrograms() {
  const supabase = createPublicServerSupabaseClient();

  if (!supabase) {
    return fallbackRecruitmentPrograms.map((program) => ({
      title: program.title,
      slug: toSlug(program.title),
      status: program.status,
      deadlineLabel: program.deadline,
      feeLabel: program.fee,
      requirements: program.requirements,
      instructions: program.instructions,
      mediaPath: '',
      mediaType: 'text' as const
    }));
  }

  const { data, error } = await supabase
    .from('recruitment_services')
    .select(
      'title, slug, status, deadline_label, fee_label, requirements, instructions, media_path, media_type'
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return fallbackRecruitmentPrograms.map((program) => ({
      title: program.title,
      slug: toSlug(program.title),
      status: program.status,
      deadlineLabel: program.deadline,
      feeLabel: program.fee,
      requirements: program.requirements,
      instructions: program.instructions,
      mediaPath: '',
      mediaType: 'text' as const
    }));
  }

  return (data as RecruitmentRow[]).map((program) => ({
    title: program.title,
    slug: program.slug,
    status: program.status,
    deadlineLabel: program.deadline_label ?? '',
    feeLabel: program.fee_label ?? '',
    requirements: program.requirements ?? [],
    instructions: program.instructions ?? '',
    ...getStoredMedia(program.media_path, program.media_type)
  }));
}

export async function getPublicCommunityPosts() {
  const supabase = await createServerSupabaseClient();
  const cookieStore = await cookies();
  const visitorSessionKey = cookieStore.get(COMMUNITY_SESSION_COOKIE)?.value ?? null;

  if (!supabase) {
    return [] satisfies PublicCommunityPostRecord[];
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, slug, title, excerpt, body, category, status, cover_media_path, media_gallery, created_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(6);

  if (error || !posts?.length) {
    return [] satisfies PublicCommunityPostRecord[];
  }

  const typedPosts = posts as PostRow[];
  const postIds = typedPosts.map((post) => post.id);

  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase
      .from('post_likes')
      .select('post_id, reaction_type, session_key')
      .in('post_id', postIds),
    supabase
      .from('comments')
      .select('id, post_id, body, guest_name, created_at, status')
      .eq('status', 'visible')
      .in('post_id', postIds)
      .order('created_at', { ascending: false })
  ]);

  const typedLikes = (likes as LikeRow[] | null) ?? [];
  const typedComments = (comments as CommentRow[] | null) ?? [];
  const reactionCountsByPost = groupReactionsByPost(typedLikes);
  const commentCounts = countByKey(typedComments, 'post_id');
  const recentCommentsByPost = groupCommentsByPost(typedComments);
  const viewerReactionByPost = new Map<string, CommunityReactionType | null>();

  if (visitorSessionKey) {
    for (const like of typedLikes) {
      if (
        like.session_key === visitorSessionKey &&
        like.reaction_type &&
        isKnownCommunityReaction(like.reaction_type)
      ) {
        viewerReactionByPost.set(like.post_id, like.reaction_type);
      }
    }
  }

  return typedPosts.map((post) => {
    const mediaGalleryPaths = normalizeMediaGalleryPaths(
      (post as { media_gallery?: string[] | null }).media_gallery?.length
        ? (post as { media_gallery?: string[] | null }).media_gallery ?? []
        : [(post as { cover_media_path?: string | null }).cover_media_path ?? '']
    );

    return {
      id: post.id,
      slug: post.slug ?? toSlug(post.title),
      title: post.title,
      category: post.category ?? 'Community',
      excerpt: trimSummary((post as { excerpt?: string | null }).excerpt ?? '', 180),
      body: (post.body ?? '').trim(),
      author: 'VIDEOLAND MULTIMEDIA',
      createdAt: post.created_at ?? new Date().toISOString(),
      reactionCount: typedLikes.filter((item) => item.post_id === post.id).length,
      commentCount: commentCounts.get(post.id) ?? 0,
      mediaType: inferMediaTypeFromPath(mediaGalleryPaths[0] ?? '') as PublicCommunityPostRecord['mediaType'],
      coverMediaPath: mediaGalleryPaths[0] ?? '',
      mediaGalleryPaths,
      viewerReaction: viewerReactionByPost.get(post.id) ?? null,
      topReactions: summarizeReactionCounts(reactionCountsByPost.get(post.id)),
      recentComments: recentCommentsByPost.get(post.id) ?? []
    };
  });
}

export async function getVisibleHomepageContentBlocks() {
  const blocks = await getPublicVisibleContentBlockRecords();

  return blocks
    .filter((block) => homepageSections.includes(block.sectionKey))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, 6);
}

export async function getVisibleContentBlockBySectionKey(sectionKey: string) {
  const blocks = await getPublicVisibleContentBlockRecords();

  return (
    blocks
      .filter((block) => block.sectionKey === sectionKey)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0] ?? null
  );
}

export async function getVisibleContentBlocksByPrefix(sectionKeyPrefix: string) {
  const blocks = await getPublicVisibleContentBlockRecords();

  return blocks
    .filter((block) => block.sectionKey.startsWith(sectionKeyPrefix))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export type PublicPageHeroContent = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCta?: { href: string; label: string };
  secondaryCta?: { href: string; label: string };
};

export async function getConfigurablePageHero(
  sectionKey: string,
  fallback: PublicPageHeroContent
) {
  const heroBlock = await getVisibleContentBlockBySectionKey(sectionKey);

  if (!heroBlock) {
    return fallback;
  }

  return {
    eyebrow: heroBlock.eyebrow || fallback.eyebrow,
    title: heroBlock.title || fallback.title,
    description: heroBlock.body || heroBlock.subtitle || fallback.description,
    primaryCta:
      heroBlock.ctaLabel && heroBlock.ctaHref
        ? { href: heroBlock.ctaHref, label: heroBlock.ctaLabel }
        : fallback.primaryCta,
    secondaryCta:
      heroBlock.secondaryCtaLabel && heroBlock.secondaryCtaHref
        ? {
            href: heroBlock.secondaryCtaHref,
            label: heroBlock.secondaryCtaLabel
          }
        : fallback.secondaryCta
  } satisfies PublicPageHeroContent;
}

export async function getPublicGalleryMedia() {
  const supabase = createPublicServerSupabaseClient();

  if (!supabase) {
    return galleryHighlights.map((item, index) => ({
      id: `fallback-gallery-${index + 1}`,
      albumTitle: item.title,
      category: item.category,
      mediaType: 'image' as const,
      fileUrl: item.image,
      thumbnailUrl: item.image,
      altText: item.title
    }));
  }

  const { data, error } = await supabase
    .from('gallery_media')
    .select(
      'id, title, media_type, file_path, thumbnail_path, alt_text, gallery_albums(title, category, is_active)'
    )
    .order('sort_order', { ascending: true })
    .limit(24);

  if (error || !data?.length) {
    return galleryHighlights.map((item, index) => ({
      id: `fallback-gallery-${index + 1}`,
      albumTitle: item.title,
      category: item.category,
      mediaType: 'image' as const,
      fileUrl: item.image,
      thumbnailUrl: item.image,
      altText: item.title
    }));
  }

  return (data as Array<
    GalleryMediaRow & {
      gallery_albums:
        | Array<{ title: string; category: string; is_active?: boolean }>
        | { title: string; category: string; is_active?: boolean }
        | null;
    }
  >)
    .filter((item) => {
      const album = Array.isArray(item.gallery_albums)
        ? item.gallery_albums[0]
        : item.gallery_albums;

      return album?.is_active ?? true;
    })
    .map((item) => {
      const album = Array.isArray(item.gallery_albums)
        ? item.gallery_albums[0]
        : item.gallery_albums;

      return {
        id: item.id ?? item.file_path ?? crypto.randomUUID(),
        albumTitle: album?.title ?? item.title ?? 'Gallery media',
        category: album?.category ?? 'Gallery',
        mediaType: item.media_type === 'video' ? 'video' : 'image',
        fileUrl: item.file_path ?? '',
        thumbnailUrl: item.thumbnail_path ?? item.file_path ?? '',
        altText: item.alt_text ?? item.title ?? album?.title ?? 'Gallery media'
      };
    })
    .filter((item) => Boolean(item.fileUrl));
}

export async function getServiceCategoryOptions() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [
      { id: 'fallback-photography', name: 'Photography' },
      { id: 'fallback-videography', name: 'Videography' },
      { id: 'fallback-training', name: 'Training' },
      { id: 'fallback-support-services', name: 'Support Services' }
    ];
  }

  const { data, error } = await supabase
    .from('service_categories')
    .select('id, name')
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return [
      { id: 'fallback-photography', name: 'Photography' },
      { id: 'fallback-videography', name: 'Videography' },
      { id: 'fallback-training', name: 'Training' },
      { id: 'fallback-support-services', name: 'Support Services' }
    ];
  }

  return (data as CategoryRow[]).map((category) => ({
    id: category.id,
    name: category.name
  }));
}

export async function getAdminBookingRecords(): Promise<AdminBookingRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [
      {
        id: 'fallback-booking-1',
        bookingReference: 'BK-1001',
        serviceTitle: 'Event Photography',
        status: 'pending',
        preferredDate: '2026-06-14',
        fullName: 'Walk-in client',
        notes: 'Awaiting review'
      },
      {
        id: 'fallback-booking-2',
        bookingReference: 'BK-1002',
        serviceTitle: 'Studio Session',
        status: 'confirmed',
        preferredDate: '2026-06-16',
        fullName: 'Repeat client',
        notes: 'Reminder sent'
      },
      {
        id: 'fallback-booking-3',
        bookingReference: 'BK-1003',
        serviceTitle: 'Official Photos',
        status: 'completed',
        preferredDate: '2026-06-18',
        fullName: 'Passport applicant',
        notes: 'Delivered'
      },
      {
        id: 'fallback-booking-4',
        bookingReference: 'BK-1004',
        serviceTitle: 'Recruitment Support',
        status: 'canceled',
        preferredDate: '2026-06-19',
        fullName: 'Rescheduled client',
        notes: 'Client rescheduled'
      }
    ] satisfies AdminBookingRecord[];
  }

  const { data, error } = await supabase
    .from('bookings')
    .select(
      'id, booking_reference, status, preferred_date, notes, services(title), full_name'
    )
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    return [];
  }

  if (!data?.length) {
    return [];
  }

  return data.map((booking) => ({
    id: booking.id,
    bookingReference: booking.booking_reference,
    serviceTitle: getJoinedServiceTitle(booking.services),
    status: booking.status as AdminBookingRecord['status'],
    preferredDate: booking.preferred_date,
    fullName: booking.full_name,
    notes: booking.notes?.trim() || `Requested by ${booking.full_name}`
  }));
}

export async function getAdminModerationItems(): Promise<AdminModerationItem[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [
      {
        id: 'fallback-comment-1',
        targetType: 'comment',
        title: 'Community reply on recruitment post',
        type: 'Comment',
        status: 'flagged',
        owner: 'Community member',
        summary:
          'This reply has been reported and is waiting for a keep, hide or delete decision.'
      },
      {
        id: 'fallback-post-1',
        targetType: 'post',
        title: 'Studio promo post',
        type: 'Post',
        status: 'hidden',
        owner: 'Publishing team',
        summary:
          'Post copy and media are ready, but a moderator should verify tone and public visibility.'
      }
    ] satisfies AdminModerationItem[];
  }

  const [{ data: comments }, { data: posts }] = await Promise.all([
    supabase
      .from('comments')
      .select('id, body, status, post_id')
      .in('status', ['flagged', 'hidden'])
      .order('updated_at', { ascending: false })
      .limit(4),
    supabase
      .from('posts')
      .select('id, title, category, status')
      .in('status', ['hidden', 'archived'])
      .order('updated_at', { ascending: false })
      .limit(4)
  ]);

  const queue: AdminModerationItem[] = [];

  for (const comment of (comments as CommentRow[] | null) ?? []) {
    queue.push({
      id: comment.id,
      targetType: 'comment',
      title: trimSummary(comment.body, 40),
      type: 'Comment',
      status: comment.status,
      owner: 'Community member',
      summary: trimSummary(comment.body, 120)
    });
  }

  for (const post of (posts as PostRow[] | null) ?? []) {
    queue.push({
      id: post.id,
      targetType: 'post',
      title: post.title,
      type: 'Post',
      status: post.status,
      owner: 'Publishing team',
      summary: `Review visibility and category settings for the ${post.category ?? 'community'} post.`
    });
  }

  return queue.length
    ? queue.slice(0, 8)
    : [
        {
          id: 'fallback-comment-1',
          targetType: 'comment',
          title: 'Community reply on recruitment post',
          type: 'Comment',
          status: 'flagged',
          owner: 'Community member',
          summary:
            'This reply has been reported and is waiting for a keep, hide or delete decision.'
        }
      ];
}

export async function getAdminSettingsRecord(): Promise<AdminSettingsRecord> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      businessName: siteConfig.legalName,
      siteName: siteConfig.legalName,
      domain: siteConfig.domain,
      phone: siteConfig.phone,
      email: siteConfig.email,
      whatsappNumber: siteConfig.whatsappLabel,
      address: siteConfig.address,
      mapEmbedUrl: '',
      seoTitle: '',
      seoDescription: '',
      heroVideoUrl: '',
      activeTheme: 'default'
    } satisfies AdminSettingsRecord;
  }

  const [{ data: contact }, { data: site }] = await Promise.all([
    supabase
      .from('contact_settings')
      .select('id, business_name, phone, email, whatsapp_number, address, map_embed_url')
      .limit(1)
      .maybeSingle(),
    supabase
      .from('site_settings')
      .select(
        'id, site_name, domain, seo_title, seo_description, hero_video_url, active_theme'
      )
      .limit(1)
      .maybeSingle()
  ]);

  const contactRecord = contact as ContactSettingsRow | null;
  const siteRecord = site as SiteSettingsRow | null;

  return {
    businessName: contactRecord?.business_name ?? siteConfig.legalName,
    siteName: siteRecord?.site_name ?? siteConfig.legalName,
    domain: siteRecord?.domain ?? siteConfig.domain,
    phone: contactRecord?.phone ?? siteConfig.phone,
    email: contactRecord?.email ?? siteConfig.email,
    whatsappNumber: contactRecord?.whatsapp_number ?? siteConfig.whatsappLabel,
    address: contactRecord?.address ?? siteConfig.address,
    mapEmbedUrl: contactRecord?.map_embed_url ?? '',
    seoTitle: siteRecord?.seo_title ?? '',
    seoDescription: siteRecord?.seo_description ?? '',
    heroVideoUrl: siteRecord?.hero_video_url ?? '',
    activeTheme: siteRecord?.active_theme ?? 'default'
  } satisfies AdminSettingsRecord;
}

export async function getAdminBookings() {
  const bookings = await getAdminBookingRecords();

  return bookings.map((booking) => [
    booking.bookingReference,
    booking.serviceTitle,
    formatBookingStatus(booking.status),
    booking.preferredDate,
    booking.notes
  ]);
}

export async function getAdminServiceRows() {
  const services = await getAdminServiceRecords();

  return services.map((service) => [
    service.title,
    service.categoryName,
    service.quoteOnly ? 'Request quote' : service.priceLabel,
    service.ctaLabel
  ]);
}

export async function getAdminServiceRecords(): Promise<AdminServiceRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return fallbackServices.map((service, index) => ({
      id: `fallback-service-${service.slug}`,
      title: service.title,
      slug: service.slug,
      summary: service.summary,
      description: service.description,
      mediaPath: service.mediaPath ?? '',
      mediaType: service.mediaType ?? 'text',
      priceLabel: service.priceLabel,
      ctaLabel: service.cta,
      categoryId: null,
      categoryName: service.category,
      quoteOnly: Boolean(service.quoteOnly),
      isActive: true,
      isFeatured: index < 3,
      sortOrder: index + 1
    }));
  }

  const { data: serviceRows, error } = await supabase
    .from('services')
    .select(
      'id, title, slug, summary, description, media_path, media_type, price_label, cta_label, category_id, quote_only, is_active, is_featured, sort_order'
    )
    .order('sort_order', { ascending: true });

  if (error || !serviceRows?.length) {
    return fallbackServices.map((service, index) => ({
      id: `fallback-service-${service.slug}`,
      title: service.title,
      slug: service.slug,
      summary: service.summary,
      description: service.description,
      mediaPath: service.mediaPath ?? '',
      mediaType: service.mediaType ?? 'text',
      priceLabel: service.priceLabel,
      ctaLabel: service.cta,
      categoryId: null,
      categoryName: service.category,
      quoteOnly: Boolean(service.quoteOnly),
      isActive: true,
      isFeatured: index < 3,
      sortOrder: index + 1
    }));
  }

  const typedRows = serviceRows as Array<
    ServiceRow & { is_active: boolean; is_featured: boolean; sort_order: number }
  >;
  const categoryIds = typedRows
    .map((service) => service.category_id)
    .filter((value): value is string => Boolean(value));

  const { data: categories } = await supabase
    .from('service_categories')
    .select('id, name')
    .in('id', categoryIds.length ? categoryIds : ['00000000-0000-0000-0000-000000000000']);

  const categoriesById = new Map(
    ((categories as CategoryRow[] | null) ?? []).map((category) => [category.id, category.name])
  );

  return typedRows.map((service) => ({
    id: service.id,
    title: service.title,
    slug: service.slug,
    summary: service.summary,
    description: service.description,
    ...getStoredMedia(service.media_path, service.media_type),
    priceLabel: service.price_label ?? 'Request quote',
    ctaLabel: service.cta_label || 'Book now',
    categoryId: service.category_id,
    categoryName: categoriesById.get(service.category_id ?? '') ?? 'Uncategorized',
    quoteOnly: service.quote_only,
    isActive: service.is_active,
    isFeatured: service.is_featured,
    sortOrder: service.sort_order
  }));
}

export async function getAdminCourseRecords(): Promise<AdminCourseRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [
      {
        id: 'fallback-course-1',
        title: 'Computer Basics & Internet Essentials',
        slug: 'computer-basics',
        category: 'Beginner',
        durationLabel: '4 weeks',
        feeLabel: 'GHS 450',
        scheduleLabel: 'Weekday mornings and Saturdays',
        trainerName: 'Training Coordinator',
        description: 'Typing, browsing, email, printing and file handling.',
        mediaPath: '',
        mediaType: 'text',
        isActive: true,
        sortOrder: 1
      },
      {
        id: 'fallback-course-2',
        title: 'Microsoft Office & Productivity Tools',
        slug: 'microsoft-office-productivity',
        category: 'Intermediate',
        durationLabel: '6 weeks',
        feeLabel: 'GHS 700',
        scheduleLabel: 'Weekday evenings and weekends',
        trainerName: 'Assigned coach',
        description: 'Word, Excel, PowerPoint and office workflow training.',
        mediaPath: '',
        mediaType: 'text',
        isActive: true,
        sortOrder: 2
      }
    ];
  }

  const { data, error } = await supabase
    .from('courses')
    .select(
      'id, title, slug, category, duration_label, fee_label, schedule_label, trainer_name, description, media_path, media_type, is_active, sort_order'
    )
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return [
      {
        id: 'fallback-course-1',
        title: 'Computer Basics & Internet Essentials',
        slug: 'computer-basics',
        category: 'Beginner',
        durationLabel: '4 weeks',
        feeLabel: 'GHS 450',
        scheduleLabel: 'Weekday mornings and Saturdays',
        trainerName: 'Training Coordinator',
        description: 'Typing, browsing, email, printing and file handling.',
        mediaPath: '',
        mediaType: 'text',
        isActive: true,
        sortOrder: 1
      },
      {
        id: 'fallback-course-2',
        title: 'Microsoft Office & Productivity Tools',
        slug: 'microsoft-office-productivity',
        category: 'Intermediate',
        durationLabel: '6 weeks',
        feeLabel: 'GHS 700',
        scheduleLabel: 'Weekday evenings and weekends',
        trainerName: 'Assigned coach',
        description: 'Word, Excel, PowerPoint and office workflow training.',
        mediaPath: '',
        mediaType: 'text',
        isActive: true,
        sortOrder: 2
      }
    ];
  }

  return (data as CourseRow[]).map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    category: course.category,
    durationLabel: course.duration_label,
    feeLabel: course.fee_label,
    scheduleLabel: course.schedule_label,
    trainerName: course.trainer_name ?? '',
    description: course.description,
    ...getStoredMedia(course.media_path, course.media_type),
    isActive: course.is_active,
    sortOrder: course.sort_order
  }));
}

export async function getAdminRecruitmentRecords(): Promise<AdminRecruitmentRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [
      {
        id: 'fallback-recruitment-1',
        title: 'BECE Registration Support',
        slug: 'bece-registration-support',
        status: 'Open',
        deadlineLabel: 'Admin configurable',
        feeLabel: 'From GHS 50',
        requirements: ['Candidate details', 'Passport photo', 'Supporting records'],
        instructions: 'Bring all required information for assisted registration.',
        mediaPath: '',
        mediaType: 'text',
        isActive: true,
        sortOrder: 1
      }
    ];
  }

  const { data, error } = await supabase
    .from('recruitment_services')
    .select(
      'id, title, slug, status, deadline_label, fee_label, requirements, instructions, media_path, media_type, is_active, sort_order'
    )
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return [
      {
        id: 'fallback-recruitment-1',
        title: 'BECE Registration Support',
        slug: 'bece-registration-support',
        status: 'Open',
        deadlineLabel: 'Admin configurable',
        feeLabel: 'From GHS 50',
        requirements: ['Candidate details', 'Passport photo', 'Supporting records'],
        instructions: 'Bring all required information for assisted registration.',
        mediaPath: '',
        mediaType: 'text',
        isActive: true,
        sortOrder: 1
      }
    ];
  }

  return (data as RecruitmentRow[]).map((program) => ({
    id: program.id,
    title: program.title,
    slug: program.slug,
    status: program.status,
    deadlineLabel: program.deadline_label ?? '',
    feeLabel: program.fee_label ?? '',
    requirements: program.requirements ?? [],
    instructions: program.instructions ?? '',
    ...getStoredMedia(program.media_path, program.media_type),
    isActive: program.is_active,
    sortOrder: program.sort_order
  }));
}

export async function getAdminGalleryAlbumRecords(): Promise<AdminGalleryAlbumRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return galleryHighlights.map((item, index) => ({
      id: `fallback-album-${index + 1}`,
      title: item.title,
      slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      category: item.category,
      description: '',
      coverUrl: item.image,
      mediaType: 'Image',
      isFeatured: true,
      isActive: true
    }));
  }

  const [{ data: albums, error: albumError }, { data: media }] = await Promise.all([
    supabase
      .from('gallery_albums')
      .select('id, slug, title, category, description, cover_url, is_featured, is_active')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('gallery_media').select('album_id, media_type')
  ]);

  if (albumError || !albums?.length) {
    return galleryHighlights.map((item, index) => ({
      id: `fallback-album-${index + 1}`,
      title: item.title,
      slug: item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      category: item.category,
      description: '',
      coverUrl: item.image,
      mediaType: 'Image',
      isFeatured: true,
      isActive: true
    }));
  }

  const mediaByAlbum = new Map<string, string>();

  for (const item of (media as GalleryMediaRow[] | null) ?? []) {
    if (item.album_id && !mediaByAlbum.has(item.album_id)) {
      mediaByAlbum.set(item.album_id, formatBookingStatus(item.media_type));
    }
  }

  return (albums as GalleryAlbumRow[]).map((album) => ({
    id: album.id,
    title: album.title,
    slug: album.slug ?? '',
    category: album.category,
    description: album.description ?? '',
    coverUrl: album.cover_url ?? '',
    mediaType: mediaByAlbum.get(album.id) ?? 'Media pending',
    isFeatured: album.is_featured,
    isActive: album.is_active ?? true
  }));
}

export async function getAdminGalleryMediaRecords(): Promise<AdminGalleryMediaRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return galleryHighlights.map((item, index) => ({
      id: `fallback-media-${index + 1}`,
      albumId: null,
      title: item.title,
      mediaType: 'image',
      fileUrl: item.image,
      thumbnailUrl: item.image,
      altText: item.title,
      sortOrder: index + 1,
      isFeatured: true
    }));
  }

  const { data, error } = await supabase
    .from('gallery_media')
    .select(
      'id, album_id, title, media_type, file_path, thumbnail_path, alt_text, sort_order, is_featured'
    )
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return galleryHighlights.map((item, index) => ({
      id: `fallback-media-${index + 1}`,
      albumId: null,
      title: item.title,
      mediaType: 'image',
      fileUrl: item.image,
      thumbnailUrl: item.image,
      altText: item.title,
      sortOrder: index + 1,
      isFeatured: true
    }));
  }

  return (data as GalleryMediaRow[]).map((item) => ({
    id: item.id ?? item.file_path ?? `media-${item.sort_order ?? 0}`,
    albumId: item.album_id,
    title: item.title ?? 'Gallery media',
    mediaType: item.media_type === 'video' ? 'video' : 'image',
    fileUrl: item.file_path ?? '',
    thumbnailUrl: item.thumbnail_path ?? item.file_path ?? '',
    altText: item.alt_text ?? item.title ?? 'Gallery media',
    sortOrder: item.sort_order ?? 0,
    isFeatured: item.is_featured ?? false
  }));
}

export async function getAdminContentRows() {
  const blocks = await getAdminContentBlockRecords();

  return blocks.map((block) => [
    block.sectionKey,
    block.isVisible ? 'Yes' : 'No',
    String(block.sortOrder)
  ]);
}

export async function getAdminContentBlockRecords(): Promise<AdminContentBlockRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return homepageSections.map((section, index) => ({
      id: `fallback-content-${index + 1}`,
      sectionKey: section,
      title: section,
      subtitle: '',
      body: '',
      ctaLabel: '',
      ctaHref: '',
      eyebrow: '',
      secondaryCtaLabel: '',
      secondaryCtaHref: '',
      heroHighlightsText: '',
      visualBadge: '',
      visualTitle: '',
      visualDescription: '',
      topChipLabel: '',
      middleChipLabel: '',
      bottomChipLabel: '',
      mediaPath: '',
      mediaType: 'text',
      isVisible: true,
      sortOrder: index + 1
    }));
  }

  const { data, error } = await supabase
    .from('content_blocks')
    .select('id, section_key, title, subtitle, body, cta_label, cta_href, is_visible, sort_order, payload')
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return homepageSections.map((section, index) => ({
      id: `fallback-content-${index + 1}`,
      sectionKey: section,
      title: section,
      subtitle: '',
      body: '',
      ctaLabel: '',
      ctaHref: '',
      eyebrow: '',
      secondaryCtaLabel: '',
      secondaryCtaHref: '',
      heroHighlightsText: '',
      visualBadge: '',
      visualTitle: '',
      visualDescription: '',
      topChipLabel: '',
      middleChipLabel: '',
      bottomChipLabel: '',
      mediaPath: '',
      mediaType: 'text',
      isVisible: true,
      sortOrder: index + 1
    }));
  }

  return mapContentBlockRows(data as ContentBlockRow[]);
}

export async function getAdminFaqRecords(): Promise<AdminFaqRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [
      {
        id: 'fallback-faq-1',
        question: 'Can administrators update content without developers?',
        answer:
          'Yes. The architecture is content-driven, with Supabase tables powering services, pricing, posts, FAQs, media, and settings.',
        sortOrder: 1
      },
      {
        id: 'fallback-faq-2',
        question: 'Can visitors book any service from one booking flow?',
        answer:
          'Yes. The booking system supports a unified service selector with date, time, notes, and status tracking.',
        sortOrder: 2
      }
    ];
  }

  const { data, error } = await supabase
    .from('faqs')
    .select('id, question, answer, sort_order')
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return [
      {
        id: 'fallback-faq-1',
        question: 'Can administrators update content without developers?',
        answer:
          'Yes. The architecture is content-driven, with Supabase tables powering services, pricing, posts, FAQs, media, and settings.',
        sortOrder: 1
      }
    ];
  }

  return (data as Array<{ id: string; question: string; answer: string; sort_order: number }>).map(
    (faq) => ({
      id: faq.id,
      question: faq.question,
      answer: faq.answer,
      sortOrder: faq.sort_order
    })
  );
}

export async function getAdminTestimonialRecords(): Promise<AdminTestimonialRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [
      {
        id: 'fallback-testimonial-1',
        clientName: 'Esi Mensah',
        roleLabel: 'Bride',
        quote:
          'The photography team was professional, calm and very creative. The gallery delivery was excellent.',
        mediaPath: '',
        mediaType: 'text',
        isFeatured: true
      }
    ];
  }

  const { data, error } = await supabase
    .from('testimonials')
    .select('id, client_name, role_label, quote, media_path, media_type, is_featured')
    .order('created_at', { ascending: false });

  if (error || !data?.length) {
    return [
      {
        id: 'fallback-testimonial-1',
        clientName: 'Esi Mensah',
        roleLabel: 'Bride',
        quote:
          'The photography team was professional, calm and very creative. The gallery delivery was excellent.',
        mediaPath: '',
        mediaType: 'text',
        isFeatured: true
      }
    ];
  }

  return (data as TestimonialRow[]).map((item) => ({
    id: item.id,
    clientName: item.client_name,
    roleLabel: item.role_label ?? '',
    quote: item.quote,
    ...getStoredMedia(item.media_path, item.media_type),
    isFeatured: item.is_featured
  }));
}

export async function getAdminPostRows() {
  const posts = await getAdminPostRecords();

  return posts.map((post) => [
    post.title,
    post.category || post.status,
    String(post.likes),
    String(post.comments)
  ]);
}

export async function getAdminPostRecords(): Promise<AdminPostRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data: posts, error } = await supabase
    .from('posts')
    .select('id, title, slug, excerpt, body, category, tags, cover_media_path, media_gallery, status')
    .order('published_at', { ascending: false })
    .limit(20);

  if (error || !posts?.length) {
    return [];
  }

  const typedPosts = posts as Array<
    PostRow & {
      slug: string;
      excerpt: string | null;
      body: string;
      tags: string[];
      cover_media_path: string | null;
      media_gallery: string[] | null;
    }
  >;
  const postIds = typedPosts.map((post) => post.id);

  const [{ data: likes }, { data: comments }] = await Promise.all([
    supabase.from('post_likes').select('post_id').in('post_id', postIds),
    supabase.from('comments').select('post_id').in('post_id', postIds)
  ]);

  const likeCounts = countByKey((likes as LikeRow[] | null) ?? [], 'post_id');
  const commentCounts = countByKey(
    ((comments as Array<Pick<CommentRow, 'post_id'>> | null) ?? []),
    'post_id'
  );

  return typedPosts.map((post) => {
    const mediaGalleryPaths = normalizeMediaGalleryPaths(
      post.media_gallery?.length ? post.media_gallery : [post.cover_media_path ?? '']
    );

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt ?? '',
      body: post.body,
      category: post.category ?? '',
      tags: post.tags ?? [],
      coverMediaPath: mediaGalleryPaths[0] ?? '',
      mediaGalleryPaths,
      coverMediaType: inferMediaTypeFromPath(mediaGalleryPaths[0] ?? ''),
      status: post.status as AdminPostRecord['status'],
      likes: likeCounts.get(post.id) ?? 0,
      comments: commentCounts.get(post.id) ?? 0
    };
  });
}

export async function getAdminCommentQueue() {
  const items = await getAdminModerationItems();
  const comments = items.filter((item) => item.targetType === 'comment');

  if (!comments.length) {
    return [
      {
        title: 'Question about studio appointment slots',
        type: 'Comment',
        status: 'Awaiting review',
        owner: 'Signed-in visitor',
        summary:
          'Useful question that may need an official reply or pinning for visibility.'
      },
      {
        title: 'Reported reply on recruitment thread',
        type: 'Comment',
        status: 'Flagged',
        owner: 'Community member',
        summary:
          'A reported message needs moderation before it continues to appear publicly.'
      }
    ];
  }

  return comments.map((comment) => ({
    title: comment.title,
    type: comment.type,
    status: formatBookingStatus(comment.status),
    owner: comment.owner,
    summary: comment.summary
  }));
}

export async function getModerationQueueItems() {
  const items = await getAdminModerationItems();

  return items.length
    ? items.map((item) => ({
        title: item.title,
        type: item.type,
        status: formatBookingStatus(item.status),
        owner: item.owner,
        summary: item.summary
      }))
    : [
        {
          title: 'Community reply on recruitment post',
          type: 'Comment',
          status: 'Flagged',
          owner: 'Visitor account',
          summary:
            'This reply has been reported and is waiting for a keep, hide or delete decision.'
        }
      ];
}

export async function getAdminGalleryRows() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return galleryHighlights.map((item) => [
      item.title,
      item.category,
      'Image',
      'Yes'
    ]);
  }

  const [{ data: albums, error: albumError }, { data: media }] = await Promise.all([
    supabase
      .from('gallery_albums')
      .select('id, title, category, is_featured')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase.from('gallery_media').select('album_id, media_type')
  ]);

  if (albumError || !albums?.length) {
    return galleryHighlights.map((item) => [
      item.title,
      item.category,
      'Image',
      'Yes'
    ]);
  }

  const mediaByAlbum = new Map<string, string>();

  for (const item of (media as GalleryMediaRow[] | null) ?? []) {
    if (item.album_id && !mediaByAlbum.has(item.album_id)) {
      mediaByAlbum.set(item.album_id, formatBookingStatus(item.media_type));
    }
  }

  return (albums as GalleryAlbumRow[]).map((album) => [
    album.title,
    album.category,
    mediaByAlbum.get(album.id) ?? 'Media pending',
    album.is_featured ? 'Yes' : 'No'
  ]);
}

export async function getAdminUserProfiles(): Promise<AdminUserProfileRecord[]> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [
      {
        id: 'fallback-user-1',
        fullName: 'Platform Owner',
        phone: siteConfig.phone,
        role: 'super_admin'
      }
    ];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role')
    .order('created_at', { ascending: false })
    .limit(30);

  if (error || !data?.length) {
    return [
      {
        id: 'fallback-user-1',
        fullName: 'Platform Owner',
        phone: siteConfig.phone,
        role: 'super_admin'
      }
    ];
  }

  return (data as ProfileRow[]).map((profile) => ({
    id: profile.id,
    fullName: profile.full_name || 'Unnamed user',
    phone: profile.phone || '',
    role: profile.role
  }));
}

export async function getCurrentAdminRole(): Promise<AppRole> {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return 'super_admin';
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return 'visitor';
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return (profile?.role as AppRole | undefined) ?? 'visitor';
}

export async function getAdminSettingsRows() {
  const settings = await getAdminSettingsRecord();

  return [
    ['Business name', settings.businessName],
    ['Site name', settings.siteName],
    ['Domain', settings.domain],
    ['Phone', settings.phone],
    ['Email', settings.email],
    ['WhatsApp', settings.whatsappNumber],
    ['Address', settings.address],
    ['SEO title', settings.seoTitle || 'Not set'],
    ['Active theme', settings.activeTheme]
  ];
}

export async function getAdminOverviewStats() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return {
      homepageSections: homepageSections.length,
      services: fallbackServices.length,
      communityPosts: 0,
      testimonials: 3
    };
  }

  const [
    contentResult,
    servicesResult,
    postsResult,
    testimonialsResult
  ] = await Promise.all([
    supabase.from('content_blocks').select('*', { count: 'exact', head: true }),
    supabase.from('services').select('*', { count: 'exact', head: true }),
    supabase.from('posts').select('*', { count: 'exact', head: true }),
    supabase.from('testimonials').select('*', { count: 'exact', head: true })
  ]);

  return {
    homepageSections: contentResult.count ?? homepageSections.length,
    services: servicesResult.count ?? fallbackServices.length,
    communityPosts: postsResult.count ?? 0,
    testimonials: testimonialsResult.count ?? 3
  };
}

export async function getAdminModuleRows() {
  const supabase = await createServerSupabaseClient();

  if (!supabase) {
    return [
      ['Services', String(fallbackServices.length)],
      ['Courses', '3'],
      ['Recruitment entries', '3'],
      ['FAQs', '3']
    ];
  }

  const [servicesResult, coursesResult, recruitmentResult, faqsResult] =
    await Promise.all([
      supabase.from('services').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase
        .from('recruitment_services')
        .select('*', { count: 'exact', head: true }),
      supabase.from('faqs').select('*', { count: 'exact', head: true })
    ]);

  return [
    ['Services', String(servicesResult.count ?? fallbackServices.length)],
    ['Courses', String(coursesResult.count ?? 3)],
    ['Recruitment entries', String(recruitmentResult.count ?? 3)],
    ['FAQs', String(faqsResult.count ?? 3)]
  ];
}

function createFallbackService(slug: string, title: string): ServiceItem {
  return {
    slug,
    title,
    category: 'Service',
    summary: `${title} by VIDEOLAND MULTIMEDIA.`,
    description: `${title} is available by appointment. Contact VIDEOLAND MULTIMEDIA for pricing and scheduling details.`,
    priceLabel: 'Request quote',
    quoteOnly: true,
    cta: 'Book now',
    features: ['Flexible scheduling', 'Customer support', 'WhatsApp follow-up'],
    faqs: [
      {
        question: 'How do I get started?',
        answer: 'Send a booking request and our team will confirm the next steps.'
      }
    ],
    gallery: [],
    mediaPath: '',
    mediaType: 'text'
  };
}

function getJoinedServiceTitle(value: unknown) {
  if (Array.isArray(value)) {
    return (value[0] as { title?: string } | undefined)?.title ?? 'Service request';
  }

  if (value && typeof value === 'object' && 'title' in value) {
    return (value as { title?: string }).title ?? 'Service request';
  }

  return 'Service request';
}

function toSlug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function formatBookingStatus(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function countByKey<T>(items: T[], key: keyof T) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const value = item[key];
    if (typeof value !== 'string') {
      continue;
    }
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }

  return counts;
}

function isKnownCommunityReaction(value: string): value is CommunityReactionType {
  return COMMUNITY_REACTIONS.some((reaction) => reaction.type === value);
}

function groupReactionsByPost(items: LikeRow[]) {
  const grouped = new Map<string, Map<CommunityReactionType, number>>();

  for (const item of items) {
    const reactionType = isKnownCommunityReaction(item.reaction_type ?? '')
      ? (item.reaction_type as CommunityReactionType)
      : 'like';
    const postCounts = grouped.get(item.post_id) ?? new Map<CommunityReactionType, number>();

    postCounts.set(reactionType, (postCounts.get(reactionType) ?? 0) + 1);
    grouped.set(item.post_id, postCounts);
  }

  return grouped;
}

function summarizeReactionCounts(counts?: Map<CommunityReactionType, number>) {
  if (!counts) {
    return [] as PublicCommunityPostRecord['topReactions'];
  }

  return [...counts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([type, count]) => ({
      type,
      count,
      emoji: getReactionMeta(type).emoji
    }));
}

function groupCommentsByPost(items: CommentRow[]) {
  const grouped = new Map<string, PublicCommunityComment[]>();

  for (const item of items) {
    if (item.status !== 'visible') {
      continue;
    }

    const current = grouped.get(item.post_id) ?? [];
    current.push({
      id: item.id,
      authorName: item.guest_name?.trim() || 'Guest',
      body: item.body,
      createdAt: item.created_at ?? new Date().toISOString()
    });
    grouped.set(item.post_id, current.slice(0, 3));
  }

  return grouped;
}

function getStoredMedia(mediaPath: string | null | undefined, mediaType?: string | null) {
  const normalizedPath = mediaPath ?? '';

  return {
    mediaPath: normalizedPath,
    mediaType: normalizeMediaType(normalizedPath, mediaType)
  };
}

function normalizeMediaType(
  mediaPath: string | null | undefined,
  mediaType?: string | null
): ContentMediaType {
  if (!mediaPath?.trim()) {
    return 'text';
  }

  if (mediaType === 'video') {
    return 'video';
  }

  if (mediaType === 'image') {
    return 'image';
  }

  return inferMediaTypeFromPath(mediaPath);
}

function getContentBlockMedia(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { mediaPath: '', mediaType: 'text' as const };
  }

  const record = payload as Record<string, unknown>;
  const mediaPath =
    typeof record.mediaPath === 'string'
      ? record.mediaPath
      : typeof record.media_path === 'string'
        ? record.media_path
        : '';

  const storedMediaType =
    typeof record.mediaType === 'string'
      ? record.mediaType
      : typeof record.media_type === 'string'
        ? record.media_type
        : null;

  return {
    mediaPath,
    mediaType: normalizeMediaType(mediaPath, storedMediaType)
  };
}

function getContentBlockExtras(payload: unknown) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return {
      eyebrow: '',
      secondaryCtaLabel: '',
      secondaryCtaHref: '',
      heroHighlightsText: '',
      visualBadge: '',
      visualTitle: '',
      visualDescription: '',
      topChipLabel: '',
      middleChipLabel: '',
      bottomChipLabel: ''
    };
  }

  const record = payload as Record<string, unknown>;

  return {
    eyebrow: typeof record.eyebrow === 'string' ? record.eyebrow : '',
    secondaryCtaLabel:
      typeof record.secondaryCtaLabel === 'string' ? record.secondaryCtaLabel : '',
    secondaryCtaHref: typeof record.secondaryCtaHref === 'string' ? record.secondaryCtaHref : '',
    heroHighlightsText:
      typeof record.heroHighlightsText === 'string' ? record.heroHighlightsText : '',
    visualBadge: typeof record.visualBadge === 'string' ? record.visualBadge : '',
    visualTitle: typeof record.visualTitle === 'string' ? record.visualTitle : '',
    visualDescription:
      typeof record.visualDescription === 'string' ? record.visualDescription : '',
    topChipLabel: typeof record.topChipLabel === 'string' ? record.topChipLabel : '',
    middleChipLabel: typeof record.middleChipLabel === 'string' ? record.middleChipLabel : '',
    bottomChipLabel: typeof record.bottomChipLabel === 'string' ? record.bottomChipLabel : ''
  };
}

async function getPublicVisibleContentBlockRecords(): Promise<AdminContentBlockRecord[]> {
  const supabase = createPublicServerSupabaseClient();

  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('content_blocks')
    .select('id, section_key, title, subtitle, body, cta_label, cta_href, is_visible, sort_order, payload')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });

  if (error || !data?.length) {
    return [];
  }

  return mapContentBlockRows(data as ContentBlockRow[]);
}

function mapContentBlockRows(rows: ContentBlockRow[]): AdminContentBlockRecord[] {
  return rows.map((block) => {
    const media = getContentBlockMedia(block.payload);
    const extras = getContentBlockExtras(block.payload);

    return {
      id: block.id ?? `content-${block.section_key}`,
      sectionKey: block.section_key,
      title: block.title ?? block.section_key,
      subtitle: block.subtitle ?? '',
      body: block.body ?? '',
      ctaLabel: block.cta_label ?? '',
      ctaHref: block.cta_href ?? '',
      eyebrow: extras.eyebrow,
      secondaryCtaLabel: extras.secondaryCtaLabel,
      secondaryCtaHref: extras.secondaryCtaHref,
      heroHighlightsText: extras.heroHighlightsText,
      visualBadge: extras.visualBadge,
      visualTitle: extras.visualTitle,
      visualDescription: extras.visualDescription,
      topChipLabel: extras.topChipLabel,
      middleChipLabel: extras.middleChipLabel,
      bottomChipLabel: extras.bottomChipLabel,
      mediaPath: media.mediaPath,
      mediaType: media.mediaType,
      isVisible: block.is_visible,
      sortOrder: block.sort_order
    };
  });
}

function getFallbackPublicTestimonials() {
  return [
    {
      name: 'Esi Mensah',
      role: 'Bride',
      quote:
        'The photography team was professional, calm and very creative. The gallery delivery was excellent.',
      mediaPath: '',
      mediaType: 'text' as const
    },
    {
      name: 'Kweku Nyarko',
      role: 'Training Student',
      quote:
        'The IT training was practical and easy to follow. I now use the skills for work every day.',
      mediaPath: '',
      mediaType: 'text' as const
    }
  ];
}

function trimSummary(value: string, length: number) {
  if (value.length <= length) {
    return value;
  }

  return `${value.slice(0, length).trimEnd()}...`;
}
