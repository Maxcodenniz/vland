import { ServiceCatalogManager } from '@/components/admin/ServiceCatalogManager';
import {
  getAdminServiceRecords,
  getServiceCategoryOptions
} from '@/lib/data/live-content';

export default async function AdminServicesPage() {
  const [records, categories] = await Promise.all([
    getAdminServiceRecords(),
    getServiceCategoryOptions()
  ]);

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Services module</h1>
      <p className="section-description">
        Edit descriptions, pricing labels, galleries, FAQs, featured flags and
        CTAs for each service page.
      </p>
      <ServiceCatalogManager categories={categories} initialRecords={records} />
    </div>
  );
}
