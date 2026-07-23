import { BookingForm } from '@/components/forms/BookingForm';
import { FeatureCard } from '@/components/shared/FeatureCard';
import { PageHero } from '@/components/shared/PageHero';
import {
  getConfigurablePageHero,
  getPublicCourses,
  getServiceOptions
} from '@/lib/data/live-content';

export default async function TrainingPage() {
  const [hero, serviceOptions, courses] = await Promise.all([
    getConfigurablePageHero('training-hero', {
      eyebrow: 'IT Training',
      title: 'Flexible IT learning programs from beginner to professional level.',
      description:
        'Present course categories, schedules, fees, trainer information and inquiry actions through a modular catalog managed in Supabase.',
      primaryCta: { href: '/bookings', label: 'Request enrolment support' },
      secondaryCta: { href: '/contact', label: 'Ask a question' }
    }),
    getServiceOptions(),
    getPublicCourses()
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
            {courses.map((course) => (
              <FeatureCard
                ctaLabel="Open course"
                description={`${course.description} Schedule: ${course.scheduleLabel}. Trainer: ${course.trainerName}.`}
                href={`/training/${course.slug}`}
                key={course.slug}
                mediaPath={course.mediaPath}
                mediaType={course.mediaType}
                meta={`${course.category} • ${course.durationLabel} • ${course.feeLabel}`}
                title={course.title}
              />
            ))}
          </div>
          <BookingForm defaultServiceSlug="it-courses" services={serviceOptions} />
        </div>
      </section>
    </>
  );
}
