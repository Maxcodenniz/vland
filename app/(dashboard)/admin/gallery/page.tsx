import { GalleryAlbumManager } from '@/components/admin/GalleryAlbumManager';
import {
  getAdminGalleryAlbumRecords,
  getAdminGalleryMediaRecords
} from '@/lib/data/live-content';

export default async function AdminGalleryPage() {
  const [records, mediaRecords] = await Promise.all([
    getAdminGalleryAlbumRecords(),
    getAdminGalleryMediaRecords()
  ]);

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Gallery and media</h1>
      <p className="section-description">
        Upload, feature, categorize and moderate media items stored in Supabase
        Storage with album relationships.
      </p>
      <GalleryAlbumManager initialMediaRecords={mediaRecords} initialRecords={records} />
    </div>
  );
}
