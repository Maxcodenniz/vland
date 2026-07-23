'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { ModuleMediaFields } from '@/components/admin/ModuleMediaFields';
import type { AdminTestimonialRecord } from '@/lib/data/live-content';
import { inferMediaTypeFromPath } from '@/lib/media';

type Draft = Omit<AdminTestimonialRecord, 'id'>;

const emptyDraft: Draft = {
  clientName: '',
  roleLabel: '',
  quote: '',
  mediaPath: '',
  mediaType: 'text',
  isFeatured: false
};

export function TestimonialManager({
  initialRecords
}: {
  initialRecords: AdminTestimonialRecord[];
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [newRecord, setNewRecord] = useState<Draft>(emptyDraft);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingCreateMedia, setIsUploadingCreateMedia] = useState(false);
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null);
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [recordFiles, setRecordFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateRecord(id: string, patch: Partial<AdminTestimonialRecord>) {
    setRecords((current) =>
      current.map((record) => (record.id === id ? { ...record, ...patch } : record))
    );
  }

  async function uploadMedia(file: File) {
    const formData = new FormData();
    formData.set('file', file);

    const response = await fetch('/api/admin/content-media/upload', {
      method: 'POST',
      body: formData
    });

    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      publicUrl?: string;
      mediaType?: 'image' | 'video';
    };

    if (!response.ok || !result.publicUrl || !result.mediaType) {
      throw new Error(result.message ?? 'Unable to upload this media.');
    }

    return result;
  }

  async function uploadCreateMedia() {
    if (!newMediaFile) {
      setError('Choose a media file before uploading.');
      return;
    }

    setIsUploadingCreateMedia(true);
    setError(null);
    setMessage(null);

    try {
      const result = await uploadMedia(newMediaFile);
      setNewRecord((current) => ({
        ...current,
        mediaPath: result.publicUrl ?? '',
        mediaType: result.mediaType ?? 'image'
      }));
      setNewMediaFile(null);
      setMessage(result.message ?? 'Media uploaded.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload media.');
    } finally {
      setIsUploadingCreateMedia(false);
    }
  }

  async function uploadRecordMedia(recordId: string) {
    const file = recordFiles[recordId];

    if (!file) {
      setError('Choose a media file before uploading.');
      return;
    }

    setUploadingRecordId(recordId);
    setError(null);
    setMessage(null);

    try {
      const result = await uploadMedia(file);
      updateRecord(recordId, {
        mediaPath: result.publicUrl ?? '',
        mediaType: result.mediaType ?? 'image'
      });
      setRecordFiles((current) => ({ ...current, [recordId]: null }));
      setMessage(result.message ?? 'Media uploaded.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload media.');
    } finally {
      setUploadingRecordId(null);
    }
  }

  async function saveRecord(record: AdminTestimonialRecord) {
    setSavingId(record.id);
    setMessage(null);
    setError(null);
    const response = await fetch(`/api/admin/testimonials/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setSavingId(null);
    if (!response.ok) {
      setError(result.message ?? 'Unable to save this testimonial.');
      return;
    }
    setMessage(result.message ?? 'Testimonial saved.');
    router.refresh();
  }

  async function createRecord() {
    setIsCreating(true);
    setMessage(null);
    setError(null);
    const response = await fetch('/api/admin/testimonials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRecord)
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setIsCreating(false);
    if (!response.ok) {
      setError(result.message ?? 'Unable to add this testimonial.');
      return;
    }
    setNewRecord(emptyDraft);
    setMessage(result.message ?? 'Testimonial created.');
    router.refresh();
  }

  async function deleteRecord(record: AdminTestimonialRecord) {
    if (
      !window.confirm(`Delete the testimonial from "${record.clientName}"? This cannot be undone.`)
    ) {
      return;
    }

    setDeletingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/testimonials/${record.id}`, {
      method: 'DELETE'
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setDeletingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to delete this testimonial.');
      return;
    }

    setRecords((current) => current.filter((item) => item.id !== record.id));
    setRecordFiles((current) => {
      const next = { ...current };
      delete next[record.id];
      return next;
    });
    setMessage(result.message ?? 'Testimonial deleted.');
    router.refresh();
  }

  return (
    <section className="stack">
      <AdminFeedbackToast error={error} message={message} />
      <section className="card content-panel stack">
        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Add testimonial</h2>
          <span className="badge">{records.length} entries</span>
        </div>
        <div className="form-grid columns-2">
          <label><span className="muted">Client name</span><input className="input" value={newRecord.clientName} onChange={(e) => setNewRecord((c) => ({ ...c, clientName: e.target.value }))} /></label>
          <label><span className="muted">Role label</span><input className="input" value={newRecord.roleLabel} onChange={(e) => setNewRecord((c) => ({ ...c, roleLabel: e.target.value }))} /></label>
        </div>
        <label><span className="muted">Quote</span><textarea className="textarea" value={newRecord.quote} onChange={(e) => setNewRecord((c) => ({ ...c, quote: e.target.value }))} /></label>
        <ModuleMediaFields
          isUploading={isUploadingCreateMedia}
          mediaPath={newRecord.mediaPath}
          mediaType={newRecord.mediaType}
          onMediaPathChange={(value) =>
            setNewRecord((current) => ({
              ...current,
              mediaPath: value,
              mediaType: inferMediaTypeFromPath(value)
            }))
          }
          onSelectedFileChange={setNewMediaFile}
          onUpload={uploadCreateMedia}
          previewLabel={newRecord.clientName || 'Testimonial media'}
          selectedFile={newMediaFile}
        />
        <label className="inline-actions">
          <input type="checkbox" checked={newRecord.isFeatured} onChange={(e) => setNewRecord((c) => ({ ...c, isFeatured: e.target.checked }))} />
          <span className="muted">Featured</span>
        </label>
        <div className="inline-actions">
          <button className="button-secondary" type="button" disabled={isCreating} onClick={createRecord}>
            {isCreating ? 'Adding...' : 'Add testimonial'}
          </button>
        </div>
      </section>
      <section className="admin-records">
        {records.map((record) => (
          <article className="card content-panel stack" key={record.id}>
            <div className="form-grid columns-2">
              <label><span className="muted">Client name</span><input className="input" value={record.clientName} onChange={(e) => updateRecord(record.id, { clientName: e.target.value })} /></label>
              <label><span className="muted">Role label</span><input className="input" value={record.roleLabel} onChange={(e) => updateRecord(record.id, { roleLabel: e.target.value })} /></label>
            </div>
            <label><span className="muted">Quote</span><textarea className="textarea" value={record.quote} onChange={(e) => updateRecord(record.id, { quote: e.target.value })} /></label>
            <ModuleMediaFields
              isUploading={uploadingRecordId === record.id}
              mediaPath={record.mediaPath}
              mediaType={record.mediaType}
              onMediaPathChange={(value) =>
                updateRecord(record.id, {
                  mediaPath: value,
                  mediaType: inferMediaTypeFromPath(value)
                })
              }
              onSelectedFileChange={(file) =>
                setRecordFiles((current) => ({ ...current, [record.id]: file }))
              }
              onUpload={() => uploadRecordMedia(record.id)}
              previewLabel={record.clientName}
              selectedFile={recordFiles[record.id] ?? null}
            />
            <label className="inline-actions">
              <input type="checkbox" checked={record.isFeatured} onChange={(e) => updateRecord(record.id, { isFeatured: e.target.checked })} />
              <span className="muted">Featured</span>
            </label>
            <div className="inline-actions">
              <button className="button-secondary" type="button" disabled={savingId === record.id || deletingId === record.id} onClick={() => saveRecord(record)}>
                {savingId === record.id ? 'Saving...' : 'Save testimonial'}
              </button>
              <button className="button-ghost" type="button" disabled={savingId === record.id || deletingId === record.id} onClick={() => deleteRecord(record)}>
                {deletingId === record.id ? 'Deleting...' : 'Delete testimonial'}
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
