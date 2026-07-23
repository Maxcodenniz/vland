import { BookingForm } from '@/components/forms/BookingForm';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { PageHero } from '@/components/shared/PageHero';
import { getConfigurablePageHero, getServiceOptions } from '@/lib/data/live-content';

const packages = [
  {
    title: 'Quick Portrait Session',
    description: '30-minute session for professional headshots, passport-ready portraits or mini portraits.',
    meta: '30 mins • From GHS 250'
  },
  {
    title: 'Creative Portrait Package',
    description: 'Extended session with multiple outfit changes, backdrop options and edited digital delivery.',
    meta: '90 mins • From GHS 550'
  },
  {
    title: 'Branding / Product Session',
    description: 'A flexible studio setup for products, business visuals and creator content.',
    meta: 'Custom duration • Quote available'
  }
];

export default async function StudioBookingPage() {
  const [hero, serviceOptions] = await Promise.all([
    getConfigurablePageHero('studio-booking-hero', {
      eyebrow: 'Studio Booking',
      title: 'Studio sessions made simple, flexible and easy to request.',
      description:
        'Choose the studio package that fits your session, compare durations, and request your preferred slot with ease.',
      primaryCta: { href: '/bookings', label: 'Reserve a slot' },
      secondaryCta: { href: '/gallery', label: 'View studio gallery' }
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
            {packages.map((item) => (
              <FeatureCard
                description={item.description}
                key={item.title}
                meta={item.meta}
                title={item.title}
              />
            ))}
          </div>
          <BookingForm
            defaultServiceSlug="studio-session-booking"
            services={serviceOptions}
          />
        </div>
      </section>
    </>
  );
}
