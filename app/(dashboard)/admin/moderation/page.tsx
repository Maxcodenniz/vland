import { AdminTable } from '@/components/admin/AdminTable';
import { ModerationActionPanel } from '@/components/admin/ModerationActionPanel';
import { ModerationQueue } from '@/components/admin/ModerationQueue';
import {
  getAdminModerationItems,
  getModerationQueueItems
} from '@/lib/data/live-content';

const actionRows = [
  ['Comment', 'Flagged', 'Hide or delete abusive or misleading replies'],
  ['Post', 'Needs review', 'Approve, archive or send back for edits'],
  ['Media', 'Pending approval', 'Approve or reject before public publishing'],
  ['User activity', 'Escalated', 'Review suspicious behavior and limit abuse quickly']
];

export default async function AdminModerationPage() {
  const [flaggedContent, moderationItems] = await Promise.all([
    getModerationQueueItems(),
    getAdminModerationItems()
  ]);

  return (
    <div className="stack">
      <div className="stack">
        <span className="section-label">Moderator Tools</span>
        <h1 style={{ margin: 0 }}>Moderation Center</h1>
        <p className="section-description">
          This private area is for moderators and admins only. Review community
          activity, manage flagged content, and keep the public experience safe.
        </p>
      </div>

      <ModerationQueue items={flaggedContent} title="Items waiting for review" />

      <ModerationActionPanel items={moderationItems} />

      <AdminTable
        columns={['Content type', 'State', 'Moderator action']}
        rows={actionRows}
        title="Moderation playbook"
      />
    </div>
  );
}
