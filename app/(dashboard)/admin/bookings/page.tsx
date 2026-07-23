import { BookingQueueManager } from '@/components/admin/BookingQueueManager';
import { getAdminBookingRecords } from '@/lib/data/live-content';

export default async function AdminBookingsPage() {
  const bookings = await getAdminBookingRecords();

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Appointment management</h1>
      <p className="section-description">
        View bookings, update status, assign staff, review notes and trigger
        follow-up communication from a single queue.
      </p>
      <BookingQueueManager bookings={bookings} />
    </div>
  );
}
