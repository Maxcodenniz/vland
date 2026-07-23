import { BookingForm } from '@/components/forms/BookingForm';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { PageHero } from '@/components/shared/PageHero';
import { getConfigurablePageHero, getServiceOptions } from '@/lib/data/live-content';

const photoTypes = [
  {
    title: 'Visa Photos',
    description: 'Country-specific visa photo formats with configurable instructions and dimensions.',
    meta: 'From GHS 70'
  },
  {
    title: 'Passport Photos',
    description: 'Fast, accurate passport photos with print and digital copy options.',
    meta: 'From GHS 60'
  },
  {
    title: 'Documentation Photos',
    description: 'Official photos for school, work, certificates and other application requirements.',
    meta: 'Custom packs available'
  }
];

export default async function OfficialPhotosPage() {
  const [hero, serviceOptions] = await Promise.all([
    getConfigurablePageHero('official-photos-hero', {
      eyebrow: 'Official Photos',
      title: 'Offer compliant official photo services with editable instructions.',
      description:
        'Maintain requirements, pricing, turnaround guidance and appointment actions per official photo type.',
      primaryCta: { href: '/bookings', label: 'Book photo appointment' },
      secondaryCta: { href: '/contact', label: 'Ask about requirements' }
    }),
    getServiceOptions()
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
        <div className="container split">
          <div className="grid">
            {photoTypes.map((item) => (
              <FeatureCard
                description={item.description}
                key={item.title}
                meta={item.meta}
                title={item.title}
              />
            ))}
          </div>
          <BookingForm
            defaultServiceSlug="official-photos"
            services={serviceOptions}
          />
        </div>
      </section>
    </>
  );
}
