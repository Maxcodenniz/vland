import Link from 'next/link';
import {
  Aperture,
  ArrowRight,
  CalendarDays,
  Camera,
  Clapperboard,
  FileBadge2,
  GraduationCap,
  MessageCircleMore
} from 'lucide-react';

import { PostCard } from '@/components/community/PostCard';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { galleryHighlights } from '@/lib/data/site-content';
import { siteConfig } from '@/lib/config/site';
import {
  getVisibleContentBlockBySectionKey,
  getPublicCommunityPosts,
  getPublicTestimonials
} from '@/lib/data/live-content';

const visitorServices = [
  {
    title: 'Photography & Video',
    description:
      'Cinematic coverage for weddings, events, portraits, brand stories and memorable celebrations.',
    href: '/services',
    icon: Camera
  },
  {
    title: 'Studio Booking',
    description:
      'Book a polished studio session for portraits, branding, products or creative content.',
    href: '/studio-booking',
    icon: Aperture
  },
  {
    title: 'IT Training',
    description:
      'Friendly digital skills training for beginners, workers and students who want to grow confidently.',
    href: '/training',
    icon: GraduationCap
  },
  {
    title: 'Official Photos',
    description:
      'Fast visa, passport and documentation photos with clean studio quality and simple guidance.',
    href: '/official-photos',
    icon: FileBadge2
  },
  {
    title: 'Recruitment Support',
    description:
      'Practical help for registration, forms and required documents when deadlines matter most.',
    href: '/recruitment',
    icon: Clapperboard
  }
];

const defaultHeroHighlights = [
  'Creative event coverage',
  'Studio portraits and branding',
  'Fast official photo support',
  'Training and registration assistance'
];

export default async function HomePage() {
  const [testimonials, communityPosts, heroBlock] = await Promise.all([
    getPublicTestimonials(),
    getPublicCommunityPosts(),
    getVisibleContentBlockBySectionKey('home-hero')
  ]);
  const heroHighlights = (heroBlock?.heroHighlightsText ?? '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
  const activeHeroHighlights = heroHighlights.length ? heroHighlights : defaultHeroHighlights;
  const heroVisualImageStyle = heroBlock?.mediaPath
    ? {
        backgroundImage: `linear-gradient(rgba(11, 29, 79, 0.18), rgba(11, 29, 79, 0.38)), url(${heroBlock.mediaPath})`
      }
    : undefined;

  return (
    <>
      <section className="page-hero">
        <div className="container hero-shell">
          <div className="card hero-panel stack home-hero-card">
            <span className="section-label">
              {heroBlock?.eyebrow || 'Saltpond, Central Region, Ghana'}
            </span>
            <h1 className="section-title home-hero-title">
              {heroBlock?.title || 'Timeless visuals, memorable stories, and simple service booking.'}
            </h1>
            <p className="section-description home-hero-copy">
              {heroBlock?.body ||
                'VIDEOLAND MULTIMEDIA brings together photography, videography, studio sessions, official photos, IT training and recruitment support in one welcoming experience.'}
            </p>
            <div className="inline-actions hero-actions">
              <Link className="button" href={heroBlock?.ctaHref || '/bookings'}>
                {heroBlock?.ctaLabel || 'Start Booking'}
              </Link>
              <Link className="button-secondary" href={heroBlock?.secondaryCtaHref || '/contact'}>
                {heroBlock?.secondaryCtaLabel || 'Contact Us'}
              </Link>
            </div>
            <div className="hero-highlights">
              {activeHeroHighlights.map((item) => (
                <div className="badge" key={item}>
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div className="card content-panel stack hero-visual-card">
            <div className="hero-visual-image" style={heroVisualImageStyle} />
            <div className="hero-visual-overlay" />
            <div className="hero-floating-chip hero-chip-top">
              <Camera size={18} />
              {heroBlock?.topChipLabel || 'Photography & Video'}
            </div>
            <div className="hero-floating-chip hero-chip-middle">
              <CalendarDays size={18} />
              {heroBlock?.middleChipLabel || 'Easy appointment requests'}
            </div>
            <div className="hero-floating-chip hero-chip-bottom">
              <MessageCircleMore size={18} />
              {heroBlock?.bottomChipLabel || 'Quick response on WhatsApp'}
            </div>
            <div className="hero-visual-copy">
              <span className="badge">{heroBlock?.visualBadge || 'Visual Storytelling'}</span>
              <h3 style={{ margin: 0, fontSize: '1.5rem' }}>
                {heroBlock?.visualTitle || 'Easy way to explore and book services.'}
              </h3>
              <p className="muted" style={{ margin: 0, lineHeight: 1.7 }}>
                {heroBlock?.visualDescription ||
                  'Discover the services you need, browse recent work, and reach out easily when you are ready.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            description="Explore the main experiences visitors come for most often, from event coverage to official photos and practical support."
            label="Our Services"
            title="Choose the service that fits your story, schedule, or next step."
          />
          <div className="grid columns-3 home-service-grid">
            {visitorServices.map((service) => {
              const Icon = service.icon;

              return (
                <article className="card content-panel stack service-card" key={service.title}>
                  <span className="service-icon">
                    <Icon size={22} />
                  </span>
                  <h3 style={{ margin: 0, fontSize: '1.35rem' }}>{service.title}</h3>
                  <p className="muted" style={{ margin: 0, lineHeight: 1.75 }}>
                    {service.description}
                  </p>
                  <Link className="service-link" href={service.href}>
                    Explore Service
                    <ArrowRight size={18} />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader
            description="A glimpse into recent visuals, sessions and polished storytelling from the VIDEOLAND MULTIMEDIA experience."
            label="Gallery"
            title="Moments, portraits and productions presented with a clean visual rhythm."
          />
          <div className="gallery-showcase">
            {galleryHighlights.map((item, index) => (
              <article
                className={`card gallery-showcase-item gallery-item-${index + 1}`}
                key={item.title}
                style={{ overflow: 'hidden' }}
              >
                <img alt={item.title} className="image-cover" src={item.image} />
                <div className="gallery-caption">
                  <span className="badge">{item.category}</span>
                  <h3 style={{ margin: 0 }}>{item.title}</h3>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split">
          <div>
            <SectionHeader
              description="Kind words from clients who trusted us to capture important moments and support meaningful milestones."
              label="Why Clients Return"
              title="Creative service with a warm and professional touch."
            />
            <div className="grid">
              {testimonials.map((item) => (
                <article className="card content-panel stack" key={item.name}>
                  {item.mediaPath ? (
                    <div className="post-media-preview">
                      {item.mediaType === 'video' ? (
                        <video className="post-media-thumb" controls preload="metadata">
                          <source src={item.mediaPath} />
                        </video>
                      ) : (
                        <img alt={item.name} className="post-media-thumb" src={item.mediaPath} />
                      )}
                    </div>
                  ) : null}
                  <p className="section-description">{item.quote}</p>
                  <div>
                    <strong>{item.name}</strong>
                    <div className="muted">{item.role}</div>
                  </div>
                </article>
              ))}
            </div>
          </div>
          <SectionHeader
            description="Stay connected with recent updates, community highlights, and moments worth sharing."
            label="Community Wall"
            title="Fresh highlights from our creative and community space."
          />
          {communityPosts.length ? (
            <div className="grid">
              {communityPosts.map((post) => (
                <PostCard key={post.id} {...post} />
              ))}
            </div>
          ) : (
            <div className="card content-panel empty-state">
              <h3 style={{ marginTop: 0 }}>Community posts are coming soon</h3>
              <p className="muted" style={{ marginBottom: 0 }}>
                Published posts from the Community Wall will appear here automatically.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="section">
        <div className="container card content-panel split contact-cta-panel">
          <div className="stack">
            <span className="section-label">Let’s Create Something Beautiful</span>
            <h2 style={{ margin: 0 }}>Ready to book, ask a question, or visit us?</h2>
            <p className="section-description">
              Reach out by phone, email or WhatsApp. We are here to help you
              plan your session, event coverage, training or support request.
            </p>
          </div>
          <div className="stack">
            <Link className="button" href="/contact">
              Contact Us
            </Link>
            <Link className="button-ghost" href={`tel:${siteConfig.phone}`}>
              {siteConfig.phone}
            </Link>
            <Link className="button-ghost" href={`mailto:${siteConfig.email}`}>
              {siteConfig.email}
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
