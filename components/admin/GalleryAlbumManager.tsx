'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { GalleryMediaManager } from '@/components/admin/GalleryMediaManager';
import type {
  AdminGalleryAlbumRecord,
  AdminGalleryMediaRecord
} from '@/lib/data/live-content';

type GalleryDraft = Omit<AdminGalleryAlbumRecord, 'id' | 'mediaType'>;

const emptyAlbum: GalleryDraft = {
  title: '',
  slug: '',
  category: '',
  description: '',
  coverUrl: '',
  isFeatured: false,
  isActive: true
};

export function GalleryAlbumManager({
  initialMediaRecords,
  initialRecords
}: {
  initialMediaRecords: AdminGalleryMediaRecord[];
  initialRecords: AdminGalleryAlbumRecord[];
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [newRecord, setNewRecord] = useState<GalleryDraft>(emptyAlbum);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateRecord(id: string, patch: Partial<AdminGalleryAlbumRecord>) {
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, ...patch } : record))
    );
  }

  async function saveRecord(record: AdminGalleryAlbumRecord) {
    setSavingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/gallery/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: record.title,
        slug: record.slug,
        category: record.category,
        description: record.description,
        coverUrl: record.coverUrl,
        isFeatured: record.isFeatured,
        isActive: record.isActive
      })
    });

    const result = (await response.json()) as { ok: boolean; message?: string };
    setSavingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to save this gallery album.');
      return;
    }

    setMessage(result.message ?? 'Gallery album saved.');
    router.refresh();
  }

  async function createRecord() {
    setIsCreating(true);
    setMessage(null);
    setError(null);

    const response = await fetch('/api/admin/gallery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });

    const result = (await response.json()) as { ok: boolean; message?: string };
    setIsCreating(false);

    if (!response.ok) {
      setError(result.message ?? 'Unable to add this gallery album.');
      return;
    }

    setNewRecord(emptyAlbum);
    setMessage(result.message ?? 'Gallery album created.');
    router.refresh();
  }

  async function deleteRecord(record: AdminGalleryAlbumRecord) {
    if (!window.confirm(`Delete the gallery album "${record.title}"? This cannot be undone.`)) {
      return;
    }

    setDeletingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/gallery/${record.id}`, {
      method: 'DELETE'
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setDeletingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to delete this gallery album.');
      return;
    }

    setRecords((current) => current.filter((item) => item.id !== record.id));
    setMessage(result.message ?? 'Gallery album deleted.');
    router.refresh();
  }

  return (
    <section className="stack">
      <AdminFeedbackToast error={error} message={message} />
      <section className="card content-panel stack">
        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Add gallery album</h2>
          <span className="badge">{records.length} albums</span>
        </div>
        <div className="form-grid columns-2">
          <label><span className="muted">Title</span><input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, title: e.target.value }))} value={newRecord.title} /></label>
          <label><span className="muted">Slug</span><input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, slug: e.target.value }))} value={newRecord.slug} /></label>
          <label><span className="muted">Category</span><input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, category: e.target.value }))} value={newRecord.category} /></label>
          <label><span className="muted">Cover URL</span><input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, coverUrl: e.target.value }))} value={newRecord.coverUrl} /></label>
        </div>
        <label>
          <span className="muted">Description</span>
          <textarea className="textarea" onChange={(e) => setNewRecord((c) => ({ ...c, description: e.target.value }))} value={newRecord.description} />
        </label>
        <div className="inline-actions">
          <label className="inline-actions"><input checked={newRecord.isFeatured} onChange={(e) => setNewRecord((c) => ({ ...c, isFeatured: e.target.checked }))} type="checkbox" /><span className="muted">Featured</span></label>
          <label className="inline-actions"><input checked={newRecord.isActive} onChange={(e) => setNewRecord((c) => ({ ...c, isActive: e.target.checked }))} type="checkbox" /><span className="muted">Active</span></label>
        </div>
        <div className="inline-actions">
          <button className="button-secondary" disabled={isCreating} onClick={createRecord} type="button">
            {isCreating ? 'Adding...' : 'Add gallery album'}
          </button>
        </div>
      </section>

      <section className="admin-records">
        {records.map((record) => (
          <article className="card content-panel stack" key={record.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{record.title}</h2>
              <span className="badge">{record.mediaType}</span>
            </div>
            <div className="form-grid columns-2">
              <label><span className="muted">Title</span><input className="input" onChange={(e) => updateRecord(record.id, { title: e.target.value })} value={record.title} /></label>
              <label><span className="muted">Slug</span><input className="input" onChange={(e) => updateRecord(record.id, { slug: e.target.value })} value={record.slug} /></label>
              <label><span className="muted">Category</span><input className="input" onChange={(e) => updateRecord(record.id, { category: e.target.value })} value={record.category} /></label>
              <label><span className="muted">Cover URL</span><input className="input" onChange={(e) => updateRecord(record.id, { coverUrl: e.target.value })} value={record.coverUrl} /></label>
            </div>
            <label>
              <span className="muted">Description</span>
              <textarea className="textarea" onChange={(e) => updateRecord(record.id, { description: e.target.value })} value={record.description} />
            </label>
            <div className="inline-actions">
              <label className="inline-actions"><input checked={record.isFeatured} onChange={(e) => updateRecord(record.id, { isFeatured: e.target.checked })} type="checkbox" /><span className="muted">Featured</span></label>
              <label className="inline-actions"><input checked={record.isActive} onChange={(e) => updateRecord(record.id, { isActive: e.target.checked })} type="checkbox" /><span className="muted">Active</span></label>
            </div>
            <div className="inline-actions">
              <button className="button-secondary" disabled={savingId === record.id || deletingId === record.id} onClick={() => saveRecord(record)} type="button">
                {savingId === record.id ? 'Saving...' : 'Save album'}
              </button>
              <button className="button-ghost" disabled={savingId === record.id || deletingId === record.id} onClick={() => deleteRecord(record)} type="button">
                {deletingId === record.id ? 'Deleting...' : 'Delete album'}
              </button>
            </div>
            <GalleryMediaManager
              albumId={record.id}
              initialRecords={initialMediaRecords.filter((item) => item.albumId === record.id)}
            />
          </article>
        ))}
      </section>
    </section>
  );
}
