import React from 'react'

export function RecentQueries({ items, onSelect, onClear }: { items: string[]; onSelect: (q: string) => void; onClear: () => void }) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">Recent Queries</div>
        <button className="text-xs px-2 py-1 rounded border hover:bg-gray-100" onClick={onClear}>Clear</button>
      </div>
      <ul className="space-y-1 overflow-auto">
        {items.length === 0 && <li className="text-gray-500 text-sm">No recent queries</li>}
        {items.map((q, idx) => (
          <li key={idx}>
            <button className="w-full text-left px-2 py-1 rounded hover:bg-gray-100" onClick={() => onSelect(q)}>
              <code className="text-[11px]">{q}</code>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
