import Link from 'next/link';

import { ContactForm } from '@/components/forms/ContactForm';
import { PageHero } from '@/components/shared/PageHero';
import { getConfigurablePageHero } from '@/lib/data/live-content';
import { siteConfig } from '@/lib/config/site';

export default async function ContactPage() {
  const hero = await getConfigurablePageHero('contact-hero', {
    eyebrow: 'Contact',
    title: 'Offer fast contact options across phone, email, WhatsApp and form submissions.',
    description:
      'Reach us quickly through phone, email, WhatsApp or the contact form whenever you need to ask a question or book a service.',
    primaryCta: { href: `tel:${siteConfig.phone}`, label: 'Call now' },
    secondaryCta: { href: '/bookings', label: 'Book an appointment' }
  });

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
          <div className="stack">
            <div className="card content-panel stack">
              <span className="badge">Direct contact</span>
              <Link className="button-ghost" href={`tel:${siteConfig.phone}`}>
                {siteConfig.phone}
              </Link>
              <Link className="button-ghost" href={`mailto:${siteConfig.email}`}>
                {siteConfig.email}
              </Link>
              <Link
                className="button-secondary"
                href={`https://wa.me/${siteConfig.whatsappNumber}`}
              >
                WhatsApp Chat
              </Link>
              <span className="muted">{siteConfig.address}</span>
              <span className="muted">{siteConfig.hours.join(' | ')}</span>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}
