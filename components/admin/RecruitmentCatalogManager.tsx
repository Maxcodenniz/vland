'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { ModuleMediaFields } from '@/components/admin/ModuleMediaFields';
import type { AdminRecruitmentRecord } from '@/lib/data/live-content';
import { inferMediaTypeFromPath } from '@/lib/media';

type RecruitmentDraft = Omit<AdminRecruitmentRecord, 'id' | 'requirements'> & {
  requirementsText: string;
};

const emptyRecruitment: RecruitmentDraft = {
  title: '',
  slug: '',
  status: '',
  deadlineLabel: '',
  feeLabel: '',
  instructions: '',
  mediaPath: '',
  mediaType: 'text',
  isActive: true,
  sortOrder: 0,
  requirementsText: ''
};

function serializeRequirements(value: string) {
  return value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function RecruitmentCatalogManager({
  initialRecords
}: {
  initialRecords: AdminRecruitmentRecord[];
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const [newRecord, setNewRecord] = useState<RecruitmentDraft>(emptyRecruitment);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingCreateMedia, setIsUploadingCreateMedia] = useState(false);
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null);
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [recordFiles, setRecordFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateRecord(id: string, patch: Partial<AdminRecruitmentRecord>) {
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

  async function saveRecord(record: AdminRecruitmentRecord) {
    setSavingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/recruitment/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...record, sortOrder: Number(record.sortOrder) })
    });

    const result = (await response.json()) as { ok: boolean; message?: string };
    setSavingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to save this recruitment item.');
      return;
    }

    setMessage(result.message ?? 'Recruitment item saved.');
    router.refresh();
  }

  async function createRecord() {
    setIsCreating(true);
    setMessage(null);
    setError(null);

    const response = await fetch('/api/admin/recruitment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newRecord.title,
        slug: newRecord.slug,
        status: newRecord.status,
        deadlineLabel: newRecord.deadlineLabel,
        feeLabel: newRecord.feeLabel,
        requirements: serializeRequirements(newRecord.requirementsText),
        instructions: newRecord.instructions,
        isActive: newRecord.isActive,
        sortOrder: Number(newRecord.sortOrder)
      })
    });

    const result = (await response.json()) as { ok: boolean; message?: string };
    setIsCreating(false);

    if (!response.ok) {
      setError(result.message ?? 'Unable to add this recruitment item.');
      return;
    }

    setNewRecord(emptyRecruitment);
    setMessage(result.message ?? 'Recruitment item created.');
    router.refresh();
  }

  async function deleteRecord(record: AdminRecruitmentRecord) {
    if (
      !window.confirm(`Delete the recruitment item "${record.title}"? This cannot be undone.`)
    ) {
      return;
    }

    setDeletingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/recruitment/${record.id}`, {
      method: 'DELETE'
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setDeletingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to delete this recruitment item.');
      return;
    }

    setRecords((current) => current.filter((item) => item.id !== record.id));
    setRecordFiles((current) => {
      const next = { ...current };
      delete next[record.id];
      return next;
    });
    setMessage(result.message ?? 'Recruitment item deleted.');
    router.refresh();
  }

  return (
    <section className="stack">
      <AdminFeedbackToast error={error} message={message} />
      <section className="card content-panel stack">
        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Add recruitment service</h2>
          <span className="badge">{records.length} records</span>
        </div>
        <div className="form-grid columns-2">
          <label><span className="muted">Title</span><input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, title: e.target.value }))} value={newRecord.title} /></label>
          <label><span className="muted">Slug</span><input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, slug: e.target.value }))} value={newRecord.slug} /></label>
          <label><span className="muted">Status</span><input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, status: e.target.value }))} value={newRecord.status} /></label>
          <label><span className="muted">Deadline label</span><input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, deadlineLabel: e.target.value }))} value={newRecord.deadlineLabel} /></label>
          <label><span className="muted">Fee label</span><input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, feeLabel: e.target.value }))} value={newRecord.feeLabel} /></label>
          <label><span className="muted">Sort order</span><input className="input" onChange={(e) => setNewRecord((c) => ({ ...c, sortOrder: Number(e.target.value || 0) }))} type="number" value={newRecord.sortOrder} /></label>
        </div>
        <label>
          <span className="muted">Requirements (one per line)</span>
          <textarea className="textarea" onChange={(e) => setNewRecord((c) => ({ ...c, requirementsText: e.target.value }))} value={newRecord.requirementsText} />
        </label>
        <label>
          <span className="muted">Instructions</span>
          <textarea className="textarea" onChange={(e) => setNewRecord((c) => ({ ...c, instructions: e.target.value }))} value={newRecord.instructions} />
        </label>
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
          previewLabel={newRecord.title || 'Recruitment media'}
          selectedFile={newMediaFile}
        />
        <label className="inline-actions">
          <input checked={newRecord.isActive} onChange={(e) => setNewRecord((c) => ({ ...c, isActive: e.target.checked }))} type="checkbox" />
          <span className="muted">Active</span>
        </label>
        <div className="inline-actions">
          <button className="button-secondary" disabled={isCreating} onClick={createRecord} type="button">
            {isCreating ? 'Adding...' : 'Add recruitment item'}
          </button>
        </div>
      </section>

      <section className="admin-records">
        {records.map((record) => (
          <article className="card content-panel stack" key={record.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{record.title}</h2>
              <span className="badge">{record.status}</span>
            </div>
            <div className="form-grid columns-2">
              <label><span className="muted">Title</span><input className="input" onChange={(e) => updateRecord(record.id, { title: e.target.value })} value={record.title} /></label>
              <label><span className="muted">Slug</span><input className="input" onChange={(e) => updateRecord(record.id, { slug: e.target.value })} value={record.slug} /></label>
              <label><span className="muted">Status</span><input className="input" onChange={(e) => updateRecord(record.id, { status: e.target.value })} value={record.status} /></label>
              <label><span className="muted">Deadline label</span><input className="input" onChange={(e) => updateRecord(record.id, { deadlineLabel: e.target.value })} value={record.deadlineLabel} /></label>
              <label><span className="muted">Fee label</span><input className="input" onChange={(e) => updateRecord(record.id, { feeLabel: e.target.value })} value={record.feeLabel} /></label>
              <label><span className="muted">Sort order</span><input className="input" onChange={(e) => updateRecord(record.id, { sortOrder: Number(e.target.value || 0) })} type="number" value={record.sortOrder} /></label>
            </div>
            <label>
              <span className="muted">Requirements (one per line)</span>
              <textarea
                className="textarea"
                onChange={(e) => updateRecord(record.id, { requirements: serializeRequirements(e.target.value) })}
                value={record.requirements.join('\n')}
              />
            </label>
            <label>
              <span className="muted">Instructions</span>
              <textarea className="textarea" onChange={(e) => updateRecord(record.id, { instructions: e.target.value })} value={record.instructions} />
            </label>
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
              previewLabel={record.title}
              selectedFile={recordFiles[record.id] ?? null}
            />
            <label className="inline-actions">
              <input checked={record.isActive} onChange={(e) => updateRecord(record.id, { isActive: e.target.checked })} type="checkbox" />
              <span className="muted">Active</span>
            </label>
            <div className="inline-actions">
              <button className="button-secondary" disabled={savingId === record.id || deletingId === record.id} onClick={() => saveRecord(record)} type="button">
                {savingId === record.id ? 'Saving...' : 'Save recruitment item'}
              </button>
              <button className="button-ghost" disabled={savingId === record.id || deletingId === record.id} onClick={() => deleteRecord(record)} type="button">
                {deletingId === record.id ? 'Deleting...' : 'Delete recruitment item'}
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
