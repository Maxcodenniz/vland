'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import type { AdminFaqRecord } from '@/lib/data/live-content';

type Draft = Omit<AdminFaqRecord, 'id'>;

const emptyDraft: Draft = {
  question: '',
  answer: '',
  sortOrder: 0
};

export function FaqManager({ initialRecords }: { initialRecords: AdminFaqRecord[] }) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [newRecord, setNewRecord] = useState<Draft>(emptyDraft);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateRecord(id: string, patch: Partial<AdminFaqRecord>) {
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, ...patch } : record))
    );
  }

  async function saveRecord(record: AdminFaqRecord) {
    setSavingId(record.id);
    setMessage(null);
    setError(null);
    const response = await fetch(`/api/admin/faqs/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setSavingId(null);
    if (!response.ok) {
      setError(result.message ?? 'Unable to save this FAQ.');
      return;
    }
    setMessage(result.message ?? 'FAQ saved.');
    router.refresh();
  }

  async function createRecord() {
    setIsCreating(true);
    setMessage(null);
    setError(null);
    const response = await fetch('/api/admin/faqs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setIsCreating(false);
    if (!response.ok) {
      setError(result.message ?? 'Unable to add this FAQ.');
      return;
    }
    setNewRecord(emptyDraft);
    setMessage(result.message ?? 'FAQ created.');
    router.refresh();
  }

  async function deleteRecord(record: AdminFaqRecord) {
    if (!window.confirm(`Delete the FAQ "${record.question}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/faqs/${record.id}`, {
      method: 'DELETE'
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setDeletingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to delete this FAQ.');
      return;
    }

    setRecords((current) => current.filter((item) => item.id !== record.id));
    setMessage(result.message ?? 'FAQ deleted.');
    router.refresh();
  }

  return (
    <section className="stack">
      <AdminFeedbackToast error={error} message={message} />
      <section className="card content-panel stack">
        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Add FAQ</h2>
          <span className="badge">{records.length} entries</span>
        </div>
        <label><span className="muted">Question</span><input className="input" value={newRecord.question} onChange={(e) => setNewRecord((c) => ({ ...c, question: e.target.value }))} /></label>
        <label><span className="muted">Answer</span><textarea className="textarea" value={newRecord.answer} onChange={(e) => setNewRecord((c) => ({ ...c, answer: e.target.value }))} /></label>
        <label><span className="muted">Sort order</span><input className="input" type="number" value={newRecord.sortOrder} onChange={(e) => setNewRecord((c) => ({ ...c, sortOrder: Number(e.target.value || 0) }))} /></label>
        <div className="inline-actions">
          <button className="button-secondary" type="button" disabled={isCreating} onClick={createRecord}>
            {isCreating ? 'Adding...' : 'Add FAQ'}
          </button>
        </div>
      </section>
      <section className="admin-records">
        {records.map((record) => (
          <article className="card content-panel stack" key={record.id}>
            <label><span className="muted">Question</span><input className="input" value={record.question} onChange={(e) => updateRecord(record.id, { question: e.target.value })} /></label>
            <label><span className="muted">Answer</span><textarea className="textarea" value={record.answer} onChange={(e) => updateRecord(record.id, { answer: e.target.value })} /></label>
            <label><span className="muted">Sort order</span><input className="input" type="number" value={record.sortOrder} onChange={(e) => updateRecord(record.id, { sortOrder: Number(e.target.value || 0) })} /></label>
            <div className="inline-actions">
              <button className="button-secondary" type="button" disabled={savingId === record.id || deletingId === record.id} onClick={() => saveRecord(record)}>
                {savingId === record.id ? 'Saving...' : 'Save FAQ'}
              </button>
              <button className="button-ghost" type="button" disabled={savingId === record.id || deletingId === record.id} onClick={() => deleteRecord(record)}>
                {deletingId === record.id ? 'Deleting...' : 'Delete FAQ'}
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
