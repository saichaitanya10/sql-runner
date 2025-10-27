import clsx from 'clsx'
import { Database } from 'lucide-react'

export function TablesPanel({ tables, activeTable, onSelect }: {
  tables: string[]
  activeTable: string | null
  onSelect: (t: string) => void
}) {
  return (
    <div className="flex-1 overflow-auto rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
      {tables.length === 0 && (
        <div className="text-gray-500 dark:text-gray-300 text-sm p-2 mt-2">No tables</div>
      )}
      <ul>
        {tables.map((t) => (
          <li key={t}>
            <button
              className={clsx(
                'w-full text-left px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 inline-flex items-center gap-2',
                activeTable === t && 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
              )}
              onClick={() => onSelect(t)}
            >
              <Database size={14} className="text-indigo-500"/>
              <span>{t}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
