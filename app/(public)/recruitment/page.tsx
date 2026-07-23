import { BookingForm } from '@/components/forms/BookingForm';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { PageHero } from '@/components/shared/PageHero';
import {
  getConfigurablePageHero,
  getPublicRecruitmentPrograms,
  getServiceOptions
} from '@/lib/data/live-content';

export default async function RecruitmentPage() {
  const [hero, serviceOptions, recruitmentPrograms] = await Promise.all([
    getConfigurablePageHero('recruitment-hero', {
      eyebrow: 'Recruitment Registration Center',
      title: 'Keep registration support clear, current and easy to manage.',
      description:
        'Admins can publish recruitment categories, statuses, deadlines, fees, requirements and support instructions from dedicated database records.',
      primaryCta: { href: '/bookings', label: 'Book support appointment' },
      secondaryCta: { href: '/contact', label: 'Request latest update' }
    }),
    getServiceOptions(),
    getPublicRecruitmentPrograms()
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
            {recruitmentPrograms.map((program) => (
              <FeatureCard
                description={`${program.instructions} Requirements: ${program.requirements.join(', ')}.`}
                key={program.slug}
                mediaPath={program.mediaPath}
                mediaType={program.mediaType}
                meta={`${program.status} • ${program.feeLabel}`}
                title={program.title}
              />
            ))}
          </div>
          <BookingForm
            defaultServiceSlug="recruitment-registration-center"
            services={serviceOptions}
          />
        </div>
      </section>
    </>
  );
}
