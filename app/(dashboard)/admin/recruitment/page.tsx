import { RecruitmentCatalogManager } from '@/components/admin/RecruitmentCatalogManager';
import { getAdminRecruitmentRecords } from '@/lib/data/live-content';

export default async function AdminRecruitmentPage() {
  const records = await getAdminRecruitmentRecords();

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Recruitment services</h1>
      <p className="section-description">
        Track registration status, deadlines, fees and instructions for each
        supported program from one dashboard table.
      </p>
      <RecruitmentCatalogManager initialRecords={records} />
    </div>
  );
}
