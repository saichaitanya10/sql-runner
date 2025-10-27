export function ResultsTable({ rows }: { rows: any[] }) {
  if (!rows || rows.length === 0) {
    return <div className="text-gray-500 dark:text-gray-300 text-sm">No rows</div>
  }
  const columns = Object.keys(rows[0])
  return (
    <div className="overflow-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            {columns.map((c) => (
              <th key={c} className="text-left px-2 py-1 font-medium text-gray-900 dark:text-gray-100">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={i % 2 === 0
                ? 'bg-white dark:bg-gray-900'
                : 'bg-gray-50 dark:bg-gray-800'}
            >
              {columns.map((c) => (
                <td key={c} className="px-2 py-1 whitespace-nowrap text-gray-900 dark:text-gray-100">{formatCell(row[c])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatCell(v: any) {
  if (v === null || v === undefined) return ''
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}
