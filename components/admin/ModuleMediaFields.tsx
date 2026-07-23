'use client';

import { getEmbeddedVideoUrl } from '@/lib/media';
import type { ContentMediaType } from '@/lib/media';

type ModuleMediaFieldsProps = {
  mediaPath: string;
  mediaType: ContentMediaType;
  selectedFile: File | null;
  isUploading: boolean;
  previewLabel: string;
  onMediaPathChange: (value: string) => void;
  onSelectedFileChange: (file: File | null) => void;
  onUpload: () => void;
};

export function ModuleMediaFields({
  mediaPath,
  mediaType,
  selectedFile,
  isUploading,
  previewLabel,
  onMediaPathChange,
  onSelectedFileChange,
  onUpload
}: ModuleMediaFieldsProps) {
  const embeddedVideoUrl = mediaType === 'video' ? getEmbeddedVideoUrl(mediaPath) : null;

  return (
    <div className="stack">
      <div className="form-grid columns-2">
        <label>
          <span className="muted">Media URL</span>
          <input
            className="input"
            onChange={(event) => onMediaPathChange(event.target.value)}
            placeholder="https://..."
            value={mediaPath}
          />
        </label>
        <label>
          <span className="muted">Upload from device</span>
          <input
            className="input"
            onChange={(event) => onSelectedFileChange(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
      </div>

      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <span className="muted">{selectedFile ? selectedFile.name : 'Choose an image or video.'}</span>
        <button
          className="button-ghost"
          disabled={isUploading}
          onClick={onUpload}
          type="button"
        >
          {isUploading ? 'Uploading...' : 'Upload media from device'}
        </button>
      </div>

      {mediaPath ? (
        <div className="post-media-preview">
          {mediaType === 'video' ? (
            embeddedVideoUrl ? (
              <iframe
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="post-media-thumb community-post-embed"
                referrerPolicy="strict-origin-when-cross-origin"
                src={embeddedVideoUrl}
                title={previewLabel}
              />
            ) : (
              <video className="post-media-thumb" controls preload="metadata">
                <source src={mediaPath} />
              </video>
            )
          ) : (
            <img alt={previewLabel} className="post-media-thumb" src={mediaPath} />
          )}
        </div>
      ) : null}
    </div>
  );
}
