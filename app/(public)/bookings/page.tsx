import { BookingForm } from '@/components/forms/BookingForm';
import { PageHero } from '@/components/shared/PageHero';
import { SectionHeader } from '@/components/shared/SectionHeader';
import { getConfigurablePageHero, getServiceOptions } from '@/lib/data/live-content';

export default async function BookingsPage() {
  const [hero, serviceOptions] = await Promise.all([
    getConfigurablePageHero('bookings-hero', {
      eyebrow: 'Booking System',
      title: 'One unified appointment flow for all major VIDEOLAND MULTIMEDIA services.',
      description:
        'Select the service you need, choose your preferred date and time, and send your request in a few simple steps.',
      primaryCta: { href: '#booking-form', label: 'Start booking' },
      secondaryCta: { href: '/contact', label: 'Need help first?' }
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
      <section className="section" id="booking-form">
        <div className="container split">
          <div className="stack">
            <SectionHeader
              description="Choose a service, pick a date, and submit your request. Our team will confirm shortly."
              label="Flow"
              title="A quick booking experience built to save you time."
            />
            <div className="card content-panel stack">
              <span className="badge">How it works</span>
              <div className="badge">Choose your service</div>
              <div className="badge">Pick your date and time</div>
              <div className="badge">Submit your request</div>
              <div className="badge">Hear back from our team</div>
            </div>
          </div>
          <BookingForm services={serviceOptions} />
        </div>
      </section>
    </>
  );
}
