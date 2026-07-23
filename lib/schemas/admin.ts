import { z } from 'zod';

export const bookingStatusSchema = z.enum([
  'pending',
  'confirmed',
  'completed',
  'canceled'
]);

export const commentStatusSchema = z.enum(['visible', 'hidden', 'flagged']);

export const postStatusSchema = z.enum(['published', 'hidden', 'archived']);

export const bookingUpdateSchema = z.object({
  status: bookingStatusSchema
});

export const moderationUpdateSchema = z.discriminatedUnion('targetType', [
  z.object({
    targetType: z.literal('comment'),
    targetId: z.string().uuid(),
    action: z.union([commentStatusSchema, z.literal('delete')])
  }),
  z.object({
    targetType: z.literal('post'),
    targetId: z.string().uuid(),
    action: z.union([postStatusSchema, z.literal('delete')])
  })
]);

export const adminSettingsSchema = z.object({
  businessName: z.string().trim().min(2).max(120),
  siteName: z.string().trim().min(2).max(120),
  domain: z.string().trim().min(3).max(120),
  phone: z.string().trim().min(7).max(40),
  email: z.string().trim().email(),
  whatsappNumber: z.string().trim().min(7).max(40),
  address: z.string().trim().min(5).max(240),
  mapEmbedUrl: z.string().trim().max(500).optional().or(z.literal('')),
  seoTitle: z.string().trim().max(120).optional().or(z.literal('')),
  seoDescription: z.string().trim().max(240).optional().or(z.literal('')),
  heroVideoUrl: z.string().trim().max(500).optional().or(z.literal('')),
  activeTheme: z.string().trim().min(1).max(60)
});

const optionalMediaPathSchema = z.string().trim().max(1000).optional().or(z.literal(''));
const adminMediaTypeSchema = z.enum(['image', 'video', 'text']);

export const adminServiceSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  summary: z.string().trim().min(10).max(240),
  description: z.string().trim().min(20).max(4000),
  mediaPath: optionalMediaPathSchema,
  mediaType: adminMediaTypeSchema,
  priceLabel: z.string().trim().min(2).max(120),
  ctaLabel: z.string().trim().min(2).max(80),
  categoryId: z.string().uuid().nullable(),
  quoteOnly: z.boolean(),
  isActive: z.boolean(),
  isFeatured: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999)
});

export const adminCourseSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  durationLabel: z.string().trim().min(2).max(80),
  feeLabel: z.string().trim().min(2).max(80),
  scheduleLabel: z.string().trim().min(2).max(120),
  trainerName: z.string().trim().max(120).optional().or(z.literal('')),
  description: z.string().trim().min(10).max(3000),
  mediaPath: optionalMediaPathSchema,
  mediaType: adminMediaTypeSchema,
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999)
});

export const adminRecruitmentSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  status: z.string().trim().min(2).max(80),
  deadlineLabel: z.string().trim().max(120).optional().or(z.literal('')),
  feeLabel: z.string().trim().max(80).optional().or(z.literal('')),
  requirements: z.array(z.string().trim().min(1).max(120)).max(20),
  instructions: z.string().trim().max(3000).optional().or(z.literal('')),
  mediaPath: optionalMediaPathSchema,
  mediaType: adminMediaTypeSchema,
  isActive: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999)
});

export const adminGalleryAlbumSchema = z.object({
  title: z.string().trim().min(2).max(120),
  slug: z.string().trim().min(2).max(120),
  category: z.string().trim().min(2).max(80),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  coverUrl: z.string().trim().max(500).optional().or(z.literal('')),
  isFeatured: z.boolean(),
  isActive: z.boolean()
});

export const galleryMediaTypeSchema = z.enum(['image', 'video']);

export const adminGalleryMediaSchema = z.object({
  albumId: z.string().uuid(),
  title: z.string().trim().min(2).max(120),
  mediaType: galleryMediaTypeSchema,
  fileUrl: z.string().trim().url().max(1000),
  thumbnailUrl: z.string().trim().url().max(1000).optional().or(z.literal('')),
  altText: z.string().trim().max(240).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isFeatured: z.boolean()
});

export const adminGalleryMediaUpdateSchema = z.object({
  title: z.string().trim().min(2).max(120),
  mediaType: galleryMediaTypeSchema,
  fileUrl: z.string().trim().url().max(1000),
  thumbnailUrl: z.string().trim().url().max(1000).optional().or(z.literal('')),
  altText: z.string().trim().max(240).optional().or(z.literal('')),
  sortOrder: z.coerce.number().int().min(0).max(9999),
  isFeatured: z.boolean()
});

export const adminContentBlockSchema = z.object({
  sectionKey: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(240).optional().or(z.literal('')),
  body: z.string().trim().max(4000).optional().or(z.literal('')),
  ctaLabel: z.string().trim().max(80).optional().or(z.literal('')),
  ctaHref: z.string().trim().max(240).optional().or(z.literal('')),
  eyebrow: z.string().trim().max(120).optional().or(z.literal('')),
  secondaryCtaLabel: z.string().trim().max(80).optional().or(z.literal('')),
  secondaryCtaHref: z.string().trim().max(240).optional().or(z.literal('')),
  heroHighlightsText: z.string().trim().max(1000).optional().or(z.literal('')),
  visualBadge: z.string().trim().max(120).optional().or(z.literal('')),
  visualTitle: z.string().trim().max(200).optional().or(z.literal('')),
  visualDescription: z.string().trim().max(1000).optional().or(z.literal('')),
  topChipLabel: z.string().trim().max(120).optional().or(z.literal('')),
  middleChipLabel: z.string().trim().max(120).optional().or(z.literal('')),
  bottomChipLabel: z.string().trim().max(120).optional().or(z.literal('')),
  mediaPath: optionalMediaPathSchema,
  mediaType: adminMediaTypeSchema,
  isVisible: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(9999)
});

export const adminFaqSchema = z.object({
  question: z.string().trim().min(5).max(240),
  answer: z.string().trim().min(10).max(3000),
  sortOrder: z.coerce.number().int().min(0).max(9999)
});

export const adminTestimonialSchema = z.object({
  clientName: z.string().trim().min(2).max(120),
  roleLabel: z.string().trim().max(120).optional().or(z.literal('')),
  quote: z.string().trim().min(10).max(2000),
  mediaPath: optionalMediaPathSchema,
  mediaType: adminMediaTypeSchema,
  isFeatured: z.boolean()
});

export const adminPostSchema = z.object({
  title: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160),
  excerpt: z.string().trim().max(240).optional().or(z.literal('')),
  body: z.string().trim().min(20).max(10000),
  category: z.string().trim().max(120).optional().or(z.literal('')),
  tags: z.array(z.string().trim().min(1).max(40)).max(20),
  coverMediaPath: z.string().trim().max(500).optional().or(z.literal('')),
  mediaGalleryPaths: z.array(z.string().trim().max(500)).max(20).default([]),
  status: postStatusSchema
});

export const adminUserRoleSchema = z.object({
  role: z.enum(['super_admin', 'admin', 'moderator', 'visitor'])
});

export type BookingStatus = z.infer<typeof bookingStatusSchema>;
export type CommentStatus = z.infer<typeof commentStatusSchema>;
export type PostStatus = z.infer<typeof postStatusSchema>;
export type BookingUpdateValues = z.infer<typeof bookingUpdateSchema>;
export type ModerationUpdateValues = z.infer<typeof moderationUpdateSchema>;
export type AdminSettingsValues = z.infer<typeof adminSettingsSchema>;
export type AdminServiceValues = z.infer<typeof adminServiceSchema>;
export type AdminCourseValues = z.infer<typeof adminCourseSchema>;
export type AdminRecruitmentValues = z.infer<typeof adminRecruitmentSchema>;
export type AdminGalleryAlbumValues = z.infer<typeof adminGalleryAlbumSchema>;
export type GalleryMediaType = z.infer<typeof galleryMediaTypeSchema>;
export type AdminGalleryMediaValues = z.infer<typeof adminGalleryMediaSchema>;
export type AdminGalleryMediaUpdateValues = z.infer<typeof adminGalleryMediaUpdateSchema>;
export type AdminContentBlockValues = z.infer<typeof adminContentBlockSchema>;
export type AdminFaqValues = z.infer<typeof adminFaqSchema>;
export type AdminTestimonialValues = z.infer<typeof adminTestimonialSchema>;
export type AdminPostValues = z.infer<typeof adminPostSchema>;
export type AdminUserRoleValues = z.infer<typeof adminUserRoleSchema>;
