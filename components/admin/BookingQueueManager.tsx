'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import type { AdminBookingRecord } from '@/lib/data/live-content';
import type { BookingStatus } from '@/lib/schemas/admin';

const statusOptions: Array<{ value: BookingStatus; label: string }> = [
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'canceled', label: 'Canceled' }
];

type FeedbackState = {
  type: 'error' | 'success';
  message: string;
};

export function BookingQueueManager({
  bookings
}: {
  bookings: AdminBookingRecord[];
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, FeedbackState>>({});
  const [statusById, setStatusById] = useState<Record<string, BookingStatus>>(() =>
    Object.fromEntries(
      bookings.map((booking) => [booking.id, booking.status])
    ) as Record<string, BookingStatus>
  );

  const recordCountLabel = useMemo(() => `${bookings.length} records`, [bookings.length]);
  const activeFeedback = Object.values(feedbackById).at(-1) ?? null;

  async function saveBookingStatus(bookingId: string) {
    if (bookingId.startsWith('fallback-')) {
      setFeedbackById((current) => ({
        ...current,
        [bookingId]: {
          type: 'error',
          message:
            'This is a preview booking row. A real visitor booking is needed before status can be updated.'
        }
      }));
      return;
    }

    setSavingId(bookingId);
    setFeedbackById((current) => {
      const next = { ...current };
      delete next[bookingId];
      return next;
    });

    const response = await fetch(`/api/admin/bookings/${bookingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        status: statusById[bookingId]
      })
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
    };

    setSavingId(null);

    if (!response.ok) {
      setFeedbackById((current) => ({
        ...current,
        [bookingId]: {
          type: 'error',
          message: result.message ?? 'Unable to update this booking right now.'
        }
      }));
      return;
    }

    setFeedbackById((current) => ({
      ...current,
      [bookingId]: {
        type: 'success',
        message: result.message ?? 'Booking updated successfully.'
      }
    }));
    router.refresh();
  }

  return (
    <section className="card content-panel stack">
      <AdminFeedbackToast feedback={activeFeedback} />
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Booking queue</h2>
        <span className="badge">{recordCountLabel}</span>
      </div>

      <div className="admin-records">
        {bookings.length ? bookings.map((booking) => {
          const isSaving = savingId === booking.id;

          return (
            <article className="admin-record-card" key={booking.id}>
              <div className="stack" style={{ gap: '0.65rem' }}>
                <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
                  <strong>{booking.bookingReference}</strong>
                  <span className="badge">{booking.serviceTitle}</span>
                </div>
                <p className="muted" style={{ margin: 0 }}>
                  Requested by {booking.fullName} for {booking.preferredDate}
                </p>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{booking.notes}</p>
              </div>

              <div className="admin-record-actions">
                <label className="stack" style={{ gap: '0.45rem' }}>
                  <span className="muted">Status</span>
                  <select
                    className="select"
                    disabled={isSaving}
                    onChange={(event) =>
                      setStatusById((current) => ({
                        ...current,
                        [booking.id]: event.target.value as BookingStatus
                      }))
                    }
                    value={statusById[booking.id]}
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="button-secondary"
                  disabled={isSaving}
                  onClick={() => saveBookingStatus(booking.id)}
                  type="button"
                >
                  {isSaving ? 'Saving...' : 'Save status'}
                </button>

              </div>
            </article>
          );
        }) : (
          <article className="card content-panel">
            <p className="muted" style={{ margin: 0 }}>
              No live bookings have been submitted yet.
            </p>
          </article>
        )}
      </div>
    </section>
  );
}
