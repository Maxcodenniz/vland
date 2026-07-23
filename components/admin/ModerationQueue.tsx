type ModerationQueueItem = {
  title: string;
  type: string;
  status: string;
  owner: string;
  summary: string;
};

export function ModerationQueue({
  title,
  items
}: {
  title: string;
  items: ModerationQueueItem[];
}) {
  return (
    <section className="card content-panel stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <span className="badge">{items.length} items</span>
      </div>
      <div className="admin-queue">
        {items.map((item) => (
          <article className="admin-queue-item" key={`${item.type}-${item.title}`}>
            <div className="stack" style={{ gap: '0.5rem' }}>
              <div className="inline-actions">
                <span className="badge">{item.type}</span>
                <span className="badge">{item.status}</span>
              </div>
              <strong>{item.title}</strong>
              <p className="muted" style={{ margin: 0, lineHeight: 1.6 }}>
                {item.summary}
              </p>
            </div>
            <span className="muted">{item.owner}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
