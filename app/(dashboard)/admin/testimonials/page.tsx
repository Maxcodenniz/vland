import { TestimonialManager } from '@/components/admin/TestimonialManager';
import { getAdminTestimonialRecords } from '@/lib/data/live-content';

export default async function AdminTestimonialsPage() {
  const records = await getAdminTestimonialRecords();

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Testimonials</h1>
      <p className="section-description">
        Add trust-building social proof, manage featured reviews and control
        where testimonial blocks appear.
      </p>
      <TestimonialManager initialRecords={records} />
    </div>
  );
}
