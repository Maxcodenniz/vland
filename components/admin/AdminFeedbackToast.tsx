'use client';

import { useEffect, useMemo, useState } from 'react';

type FeedbackItem = {
  type: 'error' | 'success';
  message: string;
};

type AdminFeedbackToastProps = {
  error?: string | null;
  message?: string | null;
  feedback?: FeedbackItem | null;
  autoDismissMs?: number;
};

export function AdminFeedbackToast({
  error,
  message,
  feedback,
  autoDismissMs = 5000
}: AdminFeedbackToastProps) {
  const notices = useMemo(() => {
    const nextItems: FeedbackItem[] = [];

    if (feedback?.message) {
      nextItems.push(feedback);
    }

    if (error) {
      nextItems.push({ type: 'error', message: error });
    }

    if (message) {
      nextItems.push({ type: 'success', message });
    }

    return nextItems;
  }, [error, feedback, message]);
  const [isVisible, setIsVisible] = useState(false);
  const noticeKey = notices.map((item) => `${item.type}:${item.message}`).join('|');

  useEffect(() => {
    if (!notices.length) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);

    const timeoutId = window.setTimeout(() => {
      setIsVisible(false);
    }, autoDismissMs);

    return () => window.clearTimeout(timeoutId);
  }, [autoDismissMs, noticeKey, notices.length]);

  if (!isVisible || !notices.length) {
    return null;
  }

  return (
    <div className="admin-feedback-toast" role="status" aria-live="polite">
      {notices.map((item) => (
        <div className="admin-feedback-toast-card" key={`${item.type}-${item.message}`}>
          <p className={item.type === 'error' ? 'auth-error' : 'auth-success'}>{item.message}</p>
          <button
            aria-label="Dismiss message"
            className="admin-feedback-toast-close"
            onClick={() => setIsVisible(false)}
            type="button"
          >
            Close
          </button>
        </div>
      ))}
    </div>
  );
}
