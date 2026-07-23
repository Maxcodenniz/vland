import { ModerationQueue } from '@/components/admin/ModerationQueue';
import { PostManager } from '@/components/admin/PostManager';
import {
  getAdminCommentQueue,
  getAdminPostRecords,
  getCurrentAdminRole
} from '@/lib/data/live-content';
import { hasCapability } from '@/lib/supabase/auth';

export default async function AdminPostsPage() {
  const [commentQueue, records, role] = await Promise.all([
    getAdminCommentQueue(),
    getAdminPostRecords(),
    getCurrentAdminRole()
  ]);
  const canManagePosts =
    hasCapability(role, 'manage_posts') || hasCapability(role, 'manage_content');

  return (
    <div className="stack">
      <h1 style={{ margin: 0 }}>Community publishing and moderation</h1>
      <p className="section-description">
        Create and update public posts, review engagement, and handle comment
        moderation from one editor-friendly workspace.
      </p>
      <ModerationQueue items={commentQueue} title="Comment review queue" />
      {canManagePosts ? (
        <PostManager initialRecords={records} />
      ) : (
        <article className="card content-panel">
          <p className="muted" style={{ margin: 0 }}>
            Your role can review moderation items here, but only admin and
            super admin accounts can create or edit community posts.
          </p>
        </article>
      )}
    </div>
  );
}
