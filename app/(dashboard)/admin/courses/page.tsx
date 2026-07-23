import { CourseCatalogManager } from '@/components/admin/CourseCatalogManager';
import { getAdminCourseRecords } from '@/lib/data/live-content';

export default async function AdminCoursesPage() {
  const records = await getAdminCourseRecords();

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Course catalog</h1>
      <p className="section-description">
        Update categories, duration, fees, schedules, trainers and enrollment
        availability from structured course records.
      </p>
      <CourseCatalogManager initialRecords={records} />
    </div>
  );
}
