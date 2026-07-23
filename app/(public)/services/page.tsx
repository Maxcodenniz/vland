import { FeatureCard } from '@/components/shared/FeatureCard';
import { PageHero } from '@/components/shared/PageHero';
import {
  getConfigurablePageHero,
  getPublicServices,
} from '@/lib/data/live-content';

export default async function ServicesPage() {
  const [hero, services] = await Promise.all([
    getConfigurablePageHero('services-hero', {
      eyebrow: 'Services',
      title: 'Explore photography, videography, drone, studio, training and support services.',
      description:
        'Explore each service with clear descriptions, pricing guidance, gallery previews and easy ways to book or ask questions.',
      primaryCta: { href: '/bookings', label: 'Book any service' },
      secondaryCta: { href: '/contact', label: 'Request custom quote' }
    }),
    getPublicServices(),
  ]);

  return (
    <>
      <PageHero
        description={hero.description}
        eyebrow={hero.eyebrow}
        primaryCta={hero.primaryCta}
        secondaryCta={hero.secondaryCta}
        title={hero.title}
      />

      <section className="section">
        <div className="container grid">
          <div className="grid columns-3">
            {services.map((service) => (
              <FeatureCard
                ctaLabel={service.quoteOnly ? 'Request custom quote' : 'Open service page'}
                description={service.summary}
                href={`/services/${service.slug}`}
                key={service.slug}
                mediaPath={service.mediaPath}
                mediaType={service.mediaType}
                meta={`${service.category} • ${service.priceLabel}`}
                title={service.title}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
