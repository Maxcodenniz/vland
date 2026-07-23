'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import type { AdminModerationItem } from '@/lib/data/live-content';

const moderationOptions = {
  comment: [
    { value: 'visible', label: 'Visible' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'flagged', label: 'Flagged' },
    { value: 'delete', label: 'Delete permanently' }
  ],
  post: [
    { value: 'published', label: 'Published' },
    { value: 'hidden', label: 'Hidden' },
    { value: 'archived', label: 'Archived' },
    { value: 'delete', label: 'Delete permanently' }
  ]
} as const;

type FeedbackState = {
  type: 'error' | 'success';
  message: string;
};

export function ModerationActionPanel({
  items
}: {
  items: AdminModerationItem[];
}) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, FeedbackState>>({});
  const [actionById, setActionById] = useState<Record<string, string>>(() =>
    Object.fromEntries(items.map((item) => [item.id, item.status]))
  );
  const activeFeedback = Object.values(feedbackById).at(-1) ?? null;

  async function saveModerationDecision(item: AdminModerationItem) {
    setSavingId(item.id);
    setFeedbackById((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });

    const response = await fetch('/api/admin/moderation', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetType: item.targetType,
        targetId: item.id,
        action: actionById[item.id]
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
        [item.id]: {
          type: 'error',
          message: result.message ?? 'Unable to save this moderation decision.'
        }
      }));
      return;
    }

    setFeedbackById((current) => ({
      ...current,
      [item.id]: {
        type: 'success',
        message: result.message ?? 'Moderation decision saved.'
      }
    }));
    router.refresh();
  }

  return (
    <section className="card content-panel stack">
      <AdminFeedbackToast feedback={activeFeedback} />
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>Live moderation queue</h2>
        <span className="badge">{items.length} items</span>
      </div>

      <div className="admin-records">
        {items.map((item) => {
          const isSaving = savingId === item.id;
          const options = moderationOptions[item.targetType];

          return (
            <article className="admin-record-card" key={item.id}>
              <div className="stack" style={{ gap: '0.65rem' }}>
                <div className="inline-actions">
                  <span className="badge">{item.type}</span>
                  <span className="badge">{item.status}</span>
                </div>
                <strong>{item.title}</strong>
                <p className="muted" style={{ margin: 0 }}>
                  Owner: {item.owner}
                </p>
                <p style={{ margin: 0, lineHeight: 1.6 }}>{item.summary}</p>
              </div>

              <div className="admin-record-actions">
                <label className="stack" style={{ gap: '0.45rem' }}>
                  <span className="muted">Decision</span>
                  <select
                    className="select"
                    disabled={isSaving}
                    onChange={(event) =>
                      setActionById((current) => ({
                        ...current,
                        [item.id]: event.target.value
                      }))
                    }
                    value={actionById[item.id]}
                  >
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  className="button-secondary"
                  disabled={isSaving}
                  onClick={() => saveModerationDecision(item)}
                  type="button"
                >
                  {isSaving ? 'Saving...' : 'Save decision'}
                </button>

              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
