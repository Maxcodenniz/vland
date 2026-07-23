'use client';

import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { AdminFeedbackToast } from '@/components/admin/AdminFeedbackToast';
import { ModuleMediaFields } from '@/components/admin/ModuleMediaFields';
import type { AdminContentBlockRecord } from '@/lib/data/live-content';
import { inferMediaTypeFromPath } from '@/lib/media';

type Draft = Omit<AdminContentBlockRecord, 'id'>;

const emptyDraft: Draft = {
  sectionKey: '',
  title: '',
  subtitle: '',
  body: '',
  ctaLabel: '',
  ctaHref: '',
  eyebrow: '',
  secondaryCtaLabel: '',
  secondaryCtaHref: '',
  heroHighlightsText: '',
  visualBadge: '',
  visualTitle: '',
  visualDescription: '',
  topChipLabel: '',
  middleChipLabel: '',
  bottomChipLabel: '',
  mediaPath: '',
  mediaType: 'text',
  isVisible: true,
  sortOrder: 0
};

export function ContentBlockManager({
  initialRecords
}: {
  initialRecords: AdminContentBlockRecord[];
}) {
  const router = useRouter();
  const [records, setRecords] = useState(initialRecords);
  const recordsRef = useRef(initialRecords);
  const [newRecord, setNewRecord] = useState<Draft>(emptyDraft);
  const newRecordRef = useRef<Draft>(emptyDraft);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploadingCreateMedia, setIsUploadingCreateMedia] = useState(false);
  const [uploadingRecordId, setUploadingRecordId] = useState<string | null>(null);
  const [newMediaFile, setNewMediaFile] = useState<File | null>(null);
  const [recordFiles, setRecordFiles] = useState<Record<string, File | null>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function updateRecord(id: string, patch: Partial<AdminContentBlockRecord>) {
    setRecords((current) => {
      const nextRecords = current.map((record) =>
        record.id === id ? { ...record, ...patch } : record
      );

      recordsRef.current = nextRecords;
      return nextRecords;
    });
  }

  function patchNewRecord(patch: Partial<Draft>) {
    const nextDraft = {
      ...newRecordRef.current,
      ...patch
    };

    newRecordRef.current = nextDraft;
    setNewRecord(nextDraft);
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
      patchNewRecord({
        mediaPath: result.publicUrl ?? '',
        mediaType: result.mediaType ?? 'image'
      });
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
      const currentRecord = recordsRef.current.find((record) => record.id === recordId);

      if (!currentRecord) {
        throw new Error('This content block could not be found. Refresh and try again.');
      }

      const nextRecord = {
        ...currentRecord,
        mediaPath: result.publicUrl ?? '',
        mediaType: result.mediaType ?? 'image'
      } satisfies AdminContentBlockRecord;

      updateRecord(recordId, {
        mediaPath: nextRecord.mediaPath,
        mediaType: nextRecord.mediaType
      });
      setRecordFiles((current) => ({ ...current, [recordId]: null }));
      await persistRecord(nextRecord, 'Media uploaded and saved.');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload media.');
    } finally {
      setUploadingRecordId(null);
    }
  }

  async function persistRecord(
    record: AdminContentBlockRecord,
    successMessage = 'Content block saved.'
  ) {
    setSavingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/content/${record.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    });

    const result = (await response.json()) as { ok: boolean; message?: string };
    setSavingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to save this content block.');
      return;
    }

    setMessage(result.message ?? successMessage);
    router.refresh();
  }

  async function saveRecord(recordId: string, successMessage = 'Content block saved.') {
    const record = recordsRef.current.find((item) => item.id === recordId);

    if (!record) {
      setError('This content block could not be found. Refresh and try again.');
      return;
    }

    const pendingFile = recordFiles[recordId];

    if (pendingFile) {
      await uploadRecordMedia(recordId);
      return;
    }

    await persistRecord(record, successMessage);
  }

  async function createRecord() {
    setIsCreating(true);
    setMessage(null);
    setError(null);

    let draft = newRecordRef.current;

    if (newMediaFile) {
      try {
        const result = await uploadMedia(newMediaFile);

        draft = {
          ...draft,
          mediaPath: result.publicUrl ?? '',
          mediaType: result.mediaType ?? 'image'
        };

        newRecordRef.current = draft;
        setNewRecord(draft);
        setNewMediaFile(null);
      } catch (uploadError) {
        setIsCreating(false);
        setError(uploadError instanceof Error ? uploadError.message : 'Unable to upload media.');
        return;
      }
    }

    const response = await fetch('/api/admin/content', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(draft)
    });

    const result = (await response.json()) as { ok: boolean; message?: string };
    setIsCreating(false);

    if (!response.ok) {
      setError(result.message ?? 'Unable to add this content block.');
      return;
    }

    newRecordRef.current = emptyDraft;
    setNewRecord(emptyDraft);
    setMessage(result.message ?? 'Content block created.');
    router.refresh();
  }

  async function deleteRecord(record: AdminContentBlockRecord) {
    if (
      !window.confirm(`Delete the content block "${record.title}"? This cannot be undone.`)
    ) {
      return;
    }

    setDeletingId(record.id);
    setMessage(null);
    setError(null);

    const response = await fetch(`/api/admin/content/${record.id}`, {
      method: 'DELETE'
    });
    const result = (await response.json()) as { ok: boolean; message?: string };
    setDeletingId(null);

    if (!response.ok) {
      setError(result.message ?? 'Unable to delete this content block.');
      return;
    }

    setRecords((current) => {
      const nextRecords = current.filter((item) => item.id !== record.id);
      recordsRef.current = nextRecords;
      return nextRecords;
    });
    setRecordFiles((current) => {
      const next = { ...current };
      delete next[record.id];
      return next;
    });
    setMessage(result.message ?? 'Content block deleted.');
    router.refresh();
  }

  return (
    <section className="stack">
      <AdminFeedbackToast error={error} message={message} />
      <section className="card content-panel stack">
        <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0 }}>Add content block</h2>
          <span className="badge">{records.length} blocks</span>
        </div>
        <div className="form-grid columns-2">
          <label><span className="muted">Section key</span><input className="input" value={newRecord.sectionKey} onChange={(e) => patchNewRecord({ sectionKey: e.target.value })} /></label>
          <label><span className="muted">Title</span><input className="input" value={newRecord.title} onChange={(e) => patchNewRecord({ title: e.target.value })} /></label>
          <label><span className="muted">Eyebrow</span><input className="input" value={newRecord.eyebrow} onChange={(e) => patchNewRecord({ eyebrow: e.target.value })} /></label>
          <label><span className="muted">Subtitle</span><input className="input" value={newRecord.subtitle} onChange={(e) => patchNewRecord({ subtitle: e.target.value })} /></label>
          <label><span className="muted">Sort order</span><input className="input" type="number" value={newRecord.sortOrder} onChange={(e) => patchNewRecord({ sortOrder: Number(e.target.value || 0) })} /></label>
          <label><span className="muted">CTA label</span><input className="input" value={newRecord.ctaLabel} onChange={(e) => patchNewRecord({ ctaLabel: e.target.value })} /></label>
          <label><span className="muted">CTA href</span><input className="input" value={newRecord.ctaHref} onChange={(e) => patchNewRecord({ ctaHref: e.target.value })} /></label>
          <label><span className="muted">Secondary CTA label</span><input className="input" value={newRecord.secondaryCtaLabel} onChange={(e) => patchNewRecord({ secondaryCtaLabel: e.target.value })} /></label>
          <label><span className="muted">Secondary CTA href</span><input className="input" value={newRecord.secondaryCtaHref} onChange={(e) => patchNewRecord({ secondaryCtaHref: e.target.value })} /></label>
          <label><span className="muted">Top chip label</span><input className="input" value={newRecord.topChipLabel} onChange={(e) => patchNewRecord({ topChipLabel: e.target.value })} /></label>
          <label><span className="muted">Middle chip label</span><input className="input" value={newRecord.middleChipLabel} onChange={(e) => patchNewRecord({ middleChipLabel: e.target.value })} /></label>
          <label><span className="muted">Bottom chip label</span><input className="input" value={newRecord.bottomChipLabel} onChange={(e) => patchNewRecord({ bottomChipLabel: e.target.value })} /></label>
          <label><span className="muted">Visual badge</span><input className="input" value={newRecord.visualBadge} onChange={(e) => patchNewRecord({ visualBadge: e.target.value })} /></label>
          <label><span className="muted">Visual title</span><input className="input" value={newRecord.visualTitle} onChange={(e) => patchNewRecord({ visualTitle: e.target.value })} /></label>
        </div>
        <label>
          <span className="muted">Hero highlights (one per line)</span>
          <textarea className="textarea" value={newRecord.heroHighlightsText} onChange={(e) => patchNewRecord({ heroHighlightsText: e.target.value })} />
        </label>
        <label>
          <span className="muted">Body</span>
          <textarea className="textarea" value={newRecord.body} onChange={(e) => patchNewRecord({ body: e.target.value })} />
        </label>
        <label>
          <span className="muted">Visual description</span>
          <textarea className="textarea" value={newRecord.visualDescription} onChange={(e) => patchNewRecord({ visualDescription: e.target.value })} />
        </label>
        <ModuleMediaFields
          isUploading={isUploadingCreateMedia}
          mediaPath={newRecord.mediaPath}
          mediaType={newRecord.mediaType}
          onMediaPathChange={(value) =>
            patchNewRecord({
              mediaPath: value,
              mediaType: inferMediaTypeFromPath(value)
            })
          }
          onSelectedFileChange={setNewMediaFile}
          onUpload={uploadCreateMedia}
          previewLabel={newRecord.title || 'Homepage media'}
          selectedFile={newMediaFile}
        />
        <label className="inline-actions">
          <input type="checkbox" checked={newRecord.isVisible} onChange={(e) => patchNewRecord({ isVisible: e.target.checked })} />
          <span className="muted">Visible on public site</span>
        </label>
        <div className="inline-actions">
          <button className="button-secondary" type="button" disabled={isCreating} onClick={createRecord}>
            {isCreating ? 'Adding...' : 'Add content block'}
          </button>
        </div>
      </section>

      <section className="admin-records">
        {records.map((record) => (
          <article className="card content-panel stack" key={record.id}>
            <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0 }}>{record.title}</h2>
              <span className="badge">{record.sectionKey}</span>
            </div>
            <div className="form-grid columns-2">
              <label><span className="muted">Section key</span><input className="input" value={record.sectionKey} onChange={(e) => updateRecord(record.id, { sectionKey: e.target.value })} /></label>
              <label><span className="muted">Title</span><input className="input" value={record.title} onChange={(e) => updateRecord(record.id, { title: e.target.value })} /></label>
              <label><span className="muted">Eyebrow</span><input className="input" value={record.eyebrow} onChange={(e) => updateRecord(record.id, { eyebrow: e.target.value })} /></label>
              <label><span className="muted">Subtitle</span><input className="input" value={record.subtitle} onChange={(e) => updateRecord(record.id, { subtitle: e.target.value })} /></label>
              <label><span className="muted">Sort order</span><input className="input" type="number" value={record.sortOrder} onChange={(e) => updateRecord(record.id, { sortOrder: Number(e.target.value || 0) })} /></label>
              <label><span className="muted">CTA label</span><input className="input" value={record.ctaLabel} onChange={(e) => updateRecord(record.id, { ctaLabel: e.target.value })} /></label>
              <label><span className="muted">CTA href</span><input className="input" value={record.ctaHref} onChange={(e) => updateRecord(record.id, { ctaHref: e.target.value })} /></label>
              <label><span className="muted">Secondary CTA label</span><input className="input" value={record.secondaryCtaLabel} onChange={(e) => updateRecord(record.id, { secondaryCtaLabel: e.target.value })} /></label>
              <label><span className="muted">Secondary CTA href</span><input className="input" value={record.secondaryCtaHref} onChange={(e) => updateRecord(record.id, { secondaryCtaHref: e.target.value })} /></label>
              <label><span className="muted">Top chip label</span><input className="input" value={record.topChipLabel} onChange={(e) => updateRecord(record.id, { topChipLabel: e.target.value })} /></label>
              <label><span className="muted">Middle chip label</span><input className="input" value={record.middleChipLabel} onChange={(e) => updateRecord(record.id, { middleChipLabel: e.target.value })} /></label>
              <label><span className="muted">Bottom chip label</span><input className="input" value={record.bottomChipLabel} onChange={(e) => updateRecord(record.id, { bottomChipLabel: e.target.value })} /></label>
              <label><span className="muted">Visual badge</span><input className="input" value={record.visualBadge} onChange={(e) => updateRecord(record.id, { visualBadge: e.target.value })} /></label>
              <label><span className="muted">Visual title</span><input className="input" value={record.visualTitle} onChange={(e) => updateRecord(record.id, { visualTitle: e.target.value })} /></label>
            </div>
            <label>
              <span className="muted">Hero highlights (one per line)</span>
              <textarea className="textarea" value={record.heroHighlightsText} onChange={(e) => updateRecord(record.id, { heroHighlightsText: e.target.value })} />
            </label>
            <label>
              <span className="muted">Body</span>
              <textarea className="textarea" value={record.body} onChange={(e) => updateRecord(record.id, { body: e.target.value })} />
            </label>
            <label>
              <span className="muted">Visual description</span>
              <textarea className="textarea" value={record.visualDescription} onChange={(e) => updateRecord(record.id, { visualDescription: e.target.value })} />
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
              <input type="checkbox" checked={record.isVisible} onChange={(e) => updateRecord(record.id, { isVisible: e.target.checked })} />
              <span className="muted">Visible on public site</span>
            </label>
            <div className="inline-actions">
              <button className="button-secondary" type="button" disabled={savingId === record.id || deletingId === record.id} onClick={() => saveRecord(record.id)}>
                {savingId === record.id ? 'Saving...' : 'Save block'}
              </button>
              <button className="button-ghost" type="button" disabled={savingId === record.id || deletingId === record.id} onClick={() => deleteRecord(record)}>
                {deletingId === record.id ? 'Deleting...' : 'Delete block'}
              </button>
            </div>
          </article>
        ))}
      </section>
    </section>
  );
}
