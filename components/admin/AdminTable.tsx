type AdminTableProps = {
  title: string;
  columns: string[];
  rows: string[][];
};

export function AdminTable({ title, columns, rows }: AdminTableProps) {
  return (
    <section className="card content-panel stack">
      <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <span className="badge">{rows.length} records</span>
      </div>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={`${title}-${index}`}>
                {row.map((cell, cellIndex) => (
                  <td key={`${title}-${index}-${cellIndex}`}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
