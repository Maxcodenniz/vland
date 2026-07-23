import Link from 'next/link';
import { notFound } from 'next/navigation';

import { BookingForm } from '@/components/forms/BookingForm';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { PageHero } from '@/components/shared/PageHero';
import { siteConfig } from '@/lib/config/site';
import {
  getPublicServices,
  getPublicServiceBySlug,
  getServiceOptions
} from '@/lib/data/live-content';
import { getEmbeddedVideoUrl } from '@/lib/media';

export async function generateStaticParams() {
  const services = await getPublicServices();
  return services.map((service) => ({ slug: service.slug }));
}

export default async function ServiceDetailPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [service, serviceOptions, services] = await Promise.all([
    getPublicServiceBySlug(slug),
    getServiceOptions(),
    getPublicServices()
  ]);

  if (!service) {
    notFound();
  }

  const activeService = service;
  const embeddedVideoUrl =
    activeService.mediaType === 'video' ? getEmbeddedVideoUrl(activeService.mediaPath) : null;
  const relatedServices = services
    .filter((item) => item.slug !== activeService.slug)
    .sort((left, right) => {
      const leftScore = left.category === activeService.category ? 0 : 1;
      const rightScore = right.category === activeService.category ? 0 : 1;
      return leftScore - rightScore;
    })
    .slice(0, 3);

  return (
    <>
      <PageHero
        description={activeService.summary}
        eyebrow={activeService.category}
        primaryCta={{ href: '/bookings', label: activeService.cta }}
        secondaryCta={{ href: '/contact', label: 'Talk to the team' }}
        title={activeService.title}
      />

      <section className="section">
        <div className="container split">
          <div className="grid">
            <article className="card content-panel stack">
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '0.75rem'
                }}
              >
                <span className="badge">{activeService.priceLabel}</span>
                <span className="badge">
                  {activeService.quoteOnly ? 'Custom quote available' : 'Direct booking ready'}
                </span>
                <span className="badge">{activeService.faqs.length} FAQs</span>
              </div>
              <p className="section-description">{activeService.description}</p>
              {activeService.mediaPath ? (
                <div className="post-media-preview">
                  {activeService.mediaType === 'video' ? (
                    embeddedVideoUrl ? (
                      <iframe
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="post-media-thumb community-post-embed"
                        referrerPolicy="strict-origin-when-cross-origin"
                        src={embeddedVideoUrl}
                        title={activeService.title}
                      />
                    ) : (
                      <video className="post-media-thumb" controls preload="metadata">
                        <source src={activeService.mediaPath} />
                      </video>
                    )
                  ) : (
                    <img
                      alt={activeService.title}
                      className="post-media-thumb"
                      src={activeService.mediaPath}
                    />
                  )}
                </div>
              ) : null}
            </article>

            <article className="card content-panel stack">
              <h2 style={{ margin: 0 }}>What this service includes</h2>
              <p className="muted" style={{ margin: 0 }}>
                Every service page can be tailored in the private workspace, and this public view
                now highlights the current live features for this offer.
              </p>
              <div className="grid columns-2">
                {activeService.features.map((feature) => (
                  <div
                    className="card"
                    key={feature}
                    style={{ padding: '1rem 1.1rem', background: 'rgba(255, 255, 255, 0.72)' }}
                  >
                    <strong>{feature}</strong>
                  </div>
                ))}
              </div>
            </article>

            {activeService.gallery.length ? (
              <article className="card content-panel stack">
                <div className="stack" style={{ gap: '0.35rem' }}>
                  <span className="badge">Service gallery</span>
                  <h2 style={{ margin: 0 }}>Recent visual references</h2>
                </div>
                <div className="grid columns-2">
                  {activeService.gallery.map((image) => (
                    <img
                      alt={activeService.title}
                      className="image-cover"
                      key={image}
                      src={image}
                    />
                  ))}
                </div>
              </article>
            ) : null}

            {activeService.faqs.length ? (
              <article className="card content-panel stack">
                <h2 style={{ margin: 0 }}>FAQs</h2>
                {activeService.faqs.map((faq) => (
                  <div key={faq.question}>
                    <strong>{faq.question}</strong>
                    <p className="muted">{faq.answer}</p>
                  </div>
                ))}
              </article>
            ) : null}
          </div>
          <div>
            <div className="grid">
              <article className="card content-panel stack">
                <span className="badge">Quick actions</span>
                <h2 style={{ margin: 0 }}>Ready to move forward?</h2>
                <p className="muted" style={{ margin: 0 }}>
                  Choose the booking form for structured requests or message the team directly for
                  timing, pricing and custom production needs.
                </p>
                <div className="grid columns-2">
                  <div className="card" style={{ padding: '1rem 1.1rem' }}>
                    <strong>Booking path</strong>
                    <p className="muted" style={{ marginBottom: 0 }}>
                      Best for appointments, session planning and service selection.
                    </p>
                  </div>
                  <div className="card" style={{ padding: '1rem 1.1rem' }}>
                    <strong>WhatsApp path</strong>
                    <p className="muted" style={{ marginBottom: 0 }}>
                      Best for urgent questions, custom quotes and rapid follow-up.
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '0.85rem'
                  }}
                >
                  <Link className="button" href={`https://wa.me/${siteConfig.whatsappNumber}`}>
                    Contact on WhatsApp
                  </Link>
                  <Link className="button-ghost" href="/contact">
                    Open contact page
                  </Link>
                </div>
              </article>

              <article className="card content-panel stack">
                <span className="badge">Booking form</span>
                <BookingForm
                  defaultServiceSlug={activeService.slug}
                  services={serviceOptions}
                />
              </article>
            </div>
          </div>
        </div>
      </section>

      {relatedServices.length ? (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container grid">
            <div className="stack" style={{ gap: '0.4rem' }}>
              <span className="badge">Related services</span>
              <h2 className="section-title" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)' }}>
                Keep exploring similar options
              </h2>
              <p className="section-description">
                These services often pair well with {activeService.title.toLowerCase()} or serve a
                similar client need.
              </p>
            </div>
            <div className="grid columns-3">
              {relatedServices.map((item) => (
                <FeatureCard
                  ctaLabel={item.quoteOnly ? 'Request custom quote' : 'Open service page'}
                  description={item.summary}
                  href={`/services/${item.slug}`}
                  key={item.slug}
                  mediaPath={item.mediaPath}
                  mediaType={item.mediaType}
                  meta={`${item.category} • ${item.priceLabel}`}
                  title={item.title}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
